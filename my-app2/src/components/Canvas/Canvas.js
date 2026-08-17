// Холст редактора форм
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getFormContext } from '../../utils/anchors';
import { findPrimitive } from '../../utils/jsonUtils';
import { isPxSize, getNumericSize, getCanvasSizeStyle } from '../../utils/sizeUtils';
import CanvasPrimitive from './CanvasPrimitive';

// Функция примагничивания к узлам сетки
const snapToGrid = (value, gridSize) => {
  return Math.round(value / gridSize) * gridSize;
};

// Поиск самого глубокого контейнера, в который попадает точка
// point: { x, y } — координаты относительно холста (формы)
// node: примитив, проверяемый рекурсивно
// offset: { left, top } — смещение текущего примитива относительно холста
// Возвращает самый глубокий контейнер, чья область содержит точку, либо null
function findContainerAtPoint(node, point, offset = { left: 0, top: 0 }) {
  if (!node) return null;

  // Абсолютные координаты текущего примитива на холсте
  const absLeft = offset.left + (node.left || 0);
  const absTop = offset.top + (node.top || 0);
  const absRight = absLeft + (node.width || 0);
  const absBottom = absTop + (node.height || 0);

  // Сначала проверяем детей (самый глубокий приоритетнее)
  let deepestChild = null;
  if (node.children) {
    for (const child of node.children) {
      const found = findContainerAtPoint(child, point, { left: absLeft, top: absTop });
      if (found) deepestChild = found;
    }
  }

  // Если в детях нашли контейнер — возвращаем его (самый глубокий)
  if (deepestChild) return deepestChild;

  // Проверяем, является ли текущий примитив контейнером и попадает ли точка в его область
  const isContainer = node.children !== undefined || node.type === 'container';
  if (isContainer &&
      point.x >= absLeft && point.x <= absRight &&
      point.y >= absTop && point.y <= absBottom) {
    return node;
  }

  return null;
}

// Получение абсолютной позиции (смещение относительно холста) целевого примитива.
// Используется для вычисления координат точки относительно целевого контейнера.
function getOffsetToNode(root, targetId) {
  let offset = { left: 0, top: 0 };

  const traverse = (node, accLeft, accTop) => {
    if (!node) return false;
    const curLeft = accLeft + (node.left || 0);
    const curTop = accTop + (node.top || 0);
    if (node.id === targetId) {
      // Абсолютная позиция самого узла (левая/верхняя граница)
      offset = { left: curLeft, top: curTop };
      return true;
    }
    if (node.children) {
      for (const child of node.children) {
        if (traverse(child, curLeft, curTop)) return true;
      }
    }
    return false;
  };

  traverse(root, 0, 0);
  return offset;
}

function Canvas() {
  const { state, dispatch } = useEditor();
  const { form, primitives, selectedIds, zoom } = state;

  const canvasRef = useRef(null);
  const [pan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null); // { type: 'move'|'resize', startX, startY, origLeft, origTop, origWidth, origHeight, handle, id }
  const [dragOver, setDragOver] = useState(false);
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });
  const dragRef = useRef({ lastX: 0, lastY: 0 }); // последние координаты мыши при drag

  // Получаем размер сетки из состояния формы (по умолчанию 10px)
  const gridSize = (form?.canvas?.gridSize || 10);

  // Отслеживаем размер контейнера холста для корректного расчёта %-единиц
  useEffect(() => {
    const container = canvasRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      // Вычитаем padding контейнера (20px со всех сторон)
      const padding = 20;
      setContainerSize({
        width: Math.max(0, rect.width - padding * 2),
        height: Math.max(0, rect.height - padding * 2)
      });
    };

    updateSize();

    // Используем ResizeObserver для отслеживания изменения размера
    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      observer.observe(container);
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const context = getFormContext(form);

  // Обработка колеса мыши для зума
  const handleWheel = useCallback((e) => {
    if (e.ctrlKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      dispatch({ type: 'SET_ZOOM', zoom: zoom + delta });
    }
  }, [dispatch, zoom]);

  // Обработка перемещения мыши при drag
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!dragState) return;

      if (dragState.type === 'move') {
        // Полное смещение мыши от начала drag (в координатах холста)
        const mouseDx = (e.clientX - dragState.startX) / zoom;
        const mouseDy = (e.clientY - dragState.startY) / zoom;

        // Привязываем полное перемещение мыши к сетке
        const snappedMouseDx = snapToGrid(mouseDx, gridSize);
        const snappedMouseDy = snapToGrid(mouseDy, gridSize);

        // Формируем абсолютные позиции для всех выделенных примитивов
        const initialPositions = dragRef.current.initialPositions || {};
        const positions = {};
        for (const id of state.selectedIds) {
          const orig = initialPositions[id];
          if (orig) {
            positions[id] = {
              left: orig.left + snappedMouseDx,
              top: orig.top + snappedMouseDy
            };
          }
        }

        // Передаём абсолютные позиции
        dispatch({
          type: 'MOVE_PRIMITIVES_LIVE',
          positions
        });
      } else if (dragState.type === 'resize') {
        // Полное смещение от начала ресайза (для пересчёта от исходных значений)
        const totalDx = (e.clientX - dragState.startX) / zoom;
        const totalDy = (e.clientY - dragState.startY) / zoom;

        const { handle, origLeft, origTop, origWidth, origHeight } = dragState;
        let newLeft = origLeft;
        let newTop = origTop;
        let newWidth = origWidth;
        let newHeight = origHeight;

        if (handle.includes('e')) newWidth = origWidth + totalDx;
        if (handle.includes('s')) newHeight = origHeight + totalDy;
        if (handle.includes('w')) {
          newWidth = origWidth - totalDx;
          newLeft = origLeft + totalDx;
        }
        if (handle.includes('n')) {
          newHeight = origHeight - totalDy;
          newTop = origTop + totalDy;
        }

        // Примагничивание при ресайзе
        const snappedLeft = snapToGrid(Math.round(newLeft), gridSize);
        const snappedTop = snapToGrid(Math.round(newTop), gridSize);
        const snappedWidth = snapToGrid(Math.round(newWidth), gridSize);
        const snappedHeight = snapToGrid(Math.round(newHeight), gridSize);

        dispatch({
          type: 'RESIZE_PRIMITIVE_LIVE',
          id: dragState.id,
          width: Math.max(gridSize, snappedWidth),
          height: Math.max(gridSize, snappedHeight),
          left: snappedLeft,
          top: snappedTop
        });
      }
    };

    const handleMouseUp = () => {
      if (dragState) {
        // Коммитим в историю после завершения drag
        dispatch({ type: 'COMMIT_HISTORY' });
        setDragState(null);
      }
    };

    if (dragState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragState, dispatch, zoom]);

  // Обработка клика по пустому месту холста
  const handleCanvasClick = (e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-grid')) {
      dispatch({ type: 'CLEAR_SELECTION' });
    }
  };

  // Начало перемещения примитива
  const handlePrimitiveMouseDown = (e, id) => {
    if (e.button !== 0) return;
    // Если примитив не выбран, выделяем его
    if (!selectedIds.includes(id)) {
      dispatch({ type: 'SELECT', id, additive: e.shiftKey });
    }
    // Сохраняем начальные позиции всех выделенных примитивов до начала перетаскивания
    const initialPositions = {};
    for (const selId of selectedIds) {
      const prim = findPrimitive(form, selId);
      if (prim) {
        initialPositions[selId] = { left: prim.left || 0, top: prim.top || 0 };
      }
    }

    dragRef.current = { lastX: e.clientX, lastY: e.clientY, initialPositions };
    setDragState({
      type: 'move',
      startX: e.clientX,
      startY: e.clientY,
      id
    });
  };

  // Начало ресайза
  const handleResizeStart = (e, id, handle) => {
    e.stopPropagation();
    const prim = findPrimitive(form, id);
    if (!prim) return;
    // Ресайз доступен только для px-размеров
    const canResizeWidth = handle.includes('e') || handle.includes('w');
    const canResizeHeight = handle.includes('n') || handle.includes('s');
    if ((canResizeWidth && !isPxSize(prim, 'width')) || (canResizeHeight && !isPxSize(prim, 'height'))) {
      return;
    }
    dragRef.current = { lastX: e.clientX, lastY: e.clientY };
    setDragState({
      type: 'resize',
      startX: e.clientX,
      startY: e.clientY,
      id,
      handle,
      origLeft: prim.left || 0,
      origTop: prim.top || 0,
      origWidth: getNumericSize(prim, 'width'),
      origHeight: getNumericSize(prim, 'height')
    });
  };

  // Drag & drop из палитры
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const primitiveType = e.dataTransfer.getData('application/primitivetype');
    if (!primitiveType) return;

    const rect = canvasRef.current.getBoundingClientRect();
    // Координаты точки сброса относительно холста (canvas-viewport, без учёта панорамирования)
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    const template = primitives.find(p => p.type === primitiveType);
    const width = template?.defaults?.width || 100;
    const height = template?.defaults?.height || 40;

    // Определяем контейнер, в область которого попадает точка сброса
    const targetContainer = findContainerAtPoint(form, { x, y });
    const parentId = targetContainer ? targetContainer.id : null;

    // Координаты точки относительно родителя (контейнера или корня)
    let localX = x;
    let localY = y;
    if (targetContainer) {
      const offset = getOffsetToNode(form, targetContainer.id);
      localX = x - offset.left;
      localY = y - offset.top;
    }

    // Примагничивание позиции нового элемента к узлам сетки
    const snappedX = snapToGrid(Math.round(localX - width / 2), gridSize);
    const snappedY = snapToGrid(Math.round(localY - height / 2), gridSize);

    dispatch({
      type: 'ADD_PRIMITIVE',
      primitiveType,
      left: snappedX,
      top: snappedY,
      parentId
    });
  };

  if (!form) {
    return <div className="canvas-empty">Загрузите или создайте форму</div>;
  }

  const canvas = form.canvas || { width: 800, height: 600, backgroundColor: '#ffffff', gridSize: 10, showGrid: true };

  // Создание сетки (только для px-размера — иначе ширина/высота в %/vw/vh/auto)
  const canvasSizeStyle = getCanvasSizeStyle(canvas);

  // Для %-единиц пересчитываем в px на основе реального размера контейнера,
  // чтобы проценты корректно отображались от доступной высоты/ширины
  if (canvas.widthUnit === '%') {
    canvasSizeStyle.width = `${(canvas.width / 100) * containerSize.width}px`;
  }
  if (canvas.heightUnit === '%') {
    canvasSizeStyle.height = `${(canvas.height / 100) * containerSize.height}px`;
  }

  // Используем реальный пиксельный размер для рисования сетки
  const actualWidthPx = parseInt(canvasSizeStyle.width, 10) || (canvas.width || 800);
  const actualHeightPx = parseInt(canvasSizeStyle.height, 10) || (canvas.height || 600);

  const gridLines = [];
  if (canvas.showGrid) {
    const gridSize = canvas.gridSize || 10;
    for (let x = 0; x <= actualWidthPx; x += gridSize) {
      gridLines.push(
        <div key={`v-${x}`} className="grid-line grid-v" style={{ left: x }} />
      );
    }
    for (let y = 0; y <= actualHeightPx; y += gridSize) {
      gridLines.push(
        <div key={`h-${y}`} className="grid-line grid-h" style={{ top: y }} />
      );
    }
  }

  return (
    <div
      className={`canvas-container ${dragOver ? 'drag-over' : ''}`}
      ref={canvasRef}
      onWheel={handleWheel}
      onClick={handleCanvasClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div
        className="canvas-viewport"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0'
        }}
      >
        {/* Корневой элемент формы */}
        <div
          className="canvas-form"
          style={{
            ...canvasSizeStyle,
            backgroundColor: canvas.backgroundColor,
            position: 'relative'
          }}
        >
          {/* Сетка */}
          {canvas.showGrid && (
            <div className="canvas-grid">
              {gridLines}
            </div>
          )}

          {/* Служебная часть формы (не отображается на готовой веб-форме) */}
          <div className="canvas-form-service">
            <div className="service-label">Форма: {form.name}</div>
            <div className="service-size">
              {actualWidthPx}×{actualHeightPx}px
              {(canvas.widthUnit || 'px') !== 'px' || (canvas.heightUnit || 'px') !== 'px'
                ? ` (${canvasSizeStyle.width} × ${canvasSizeStyle.height})`
                : ''}
            </div>
            <div className="service-context">
              Контекст: {form.context?.source === 'url' ? form.context.url : 'inline'}
            </div>
          </div>

          {/* Примитивы */}
          {form.children && form.children.map(primitive => (
            <CanvasPrimitive
              key={primitive.id}
              primitive={primitive}
              primitives={primitives}
              context={context}
              selectedIds={selectedIds}
              onSelect={(id, additive) => dispatch({ type: 'SELECT', id, additive })}
              onMouseDown={handlePrimitiveMouseDown}
              onResizeStart={handleResizeStart}
            />
          ))}
        </div>
      </div>

      {/* Индикатор зума */}
      <div className="canvas-zoom-indicator">
        {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}

export default Canvas;