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

// Отступ между примитивами при добавлении слева/справа/сверху/снизу
const GAP = 10;

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

// Определение зоны размещения примитива при перетаскивании.
// point: { x, y } — координаты относительно холста (формы)
// node: примитив, проверяемый рекурсивно
// offset: { left, top } — смещение текущего примитива относительно холста
// isRoot: true — корневой элемент формы (размеры берутся из node.canvas)
// Возвращает { targetId, zone, index } — самый глубокий примитив и зону, либо null.
// Зоны:
//   - left/right/top/bottom — краевые полосы (добавление в родителя целевого)
//   - inside — центральная зона контейнера (добавление внутрь)
//   - before/between/after — зоны flex-контейнера вдоль главной оси (вставка в children)
function findDropZone(node, point, offset = { left: 0, top: 0 }, isRoot = false) {
  if (!node) return null;

  // Для корневого элемента формы используем размеры canvas
  const width = isRoot ? (node.canvas?.width || 800) : (node.width || 0);
  const height = isRoot ? (node.canvas?.height || 600) : (node.height || 0);
  const absLeft = offset.left + (isRoot ? 0 : (node.left || 0));
  const absTop = offset.top + (isRoot ? 0 : (node.top || 0));
  const absRight = absLeft + width;
  const absBottom = absTop + height;

  // Точка вне области примитива — не обрабатываем (для корня пропускаем,
  // т.к. форма всегда содержит точку внутри своих границ)
  if (!isRoot && (point.x < absLeft || point.x > absRight || point.y < absTop || point.y > absBottom)) {
    return null;
  }

  // Для flex-контейнера определяем зоны вдоль главной оси ДО проверки детей,
  // чтобы вставка происходила между элементами контейнера, а не внутрь детей
  const isFlex = node.style?.display === 'flex';
  if (!isRoot && isFlex && node.children && node.children.length > 0) {
    const flexDirection = node.style.flexDirection || 'row';
    const isRow = flexDirection === 'row' || flexDirection === 'row-reverse';
    const isReverse = flexDirection === 'row-reverse' || flexDirection === 'column-reverse';

    // Сортируем детей вдоль главной оси
    const children = [...node.children].filter(c => c.visible !== false);
    const sorted = children
      .map(child => ({
        child,
        start: isRow ? (child.left || 0) : (child.top || 0),
        end: isRow ? (child.left || 0) + (child.width || 0) : (child.top || 0) + (child.height || 0)
      }))
      .sort((a, b) => a.start - b.start);

    // Позиция точки вдоль главной оси (относительно контейнера)
    const relX = point.x - absLeft;
    const relY = point.y - absTop;
    const pos = isRow ? relX : relY;

    // Определяем индекс вставки
    let index = 0;
    let zone = 'before';
    for (let i = 0; i < sorted.length; i++) {
      const { start, end } = sorted[i];
      if (pos < start) {
        index = i;
        zone = 'before';
        break;
      } else if (pos <= end) {
        // Точка внутри ребёнка — вставляем после него (или до, если reverse)
        index = isReverse ? i : i + 1;
        zone = 'between';
        break;
      } else {
        index = i + 1;
        zone = 'after';
      }
    }

    return { targetId: node.id, zone, index };
  }

  // Сначала проверяем детей-контейнеров (самый глубокий приоритетнее).
  // В детей-не-контейнеры не спускаемся: если точка попадает в такой ребёнок,
  // зона определяется относительно его родителя (контейнера) — "inside".
  let deepestChild = null;
  if (node.children) {
    for (const child of node.children) {
      const isChildContainer = child.children !== undefined || child.type === 'container';
      if (isChildContainer) {
        const found = findDropZone(child, point, { left: absLeft, top: absTop });
        if (found) deepestChild = found;
      }
    }
  }

  // Если в детях нашли зону — возвращаем её (самый глубокий)
  if (deepestChild) return deepestChild;

  // Для корня не определяем зоны — только дети
  if (isRoot) return null;

  const relX = point.x - absLeft;
  const relY = point.y - absTop;

  // Краевые полосы (25% от каждого края)
  const edgeX = width * 0.25;
  const edgeY = height * 0.25;

  // Определяем, какая зона активна:
  //   left — точка в левой полосе (0..25%)
  //   right — точка в правой полосе (75%..100%)
  //   top — точка в верхней полосе (0..25%)
  //   bottom — точка в нижней полосе (75%..100%)
  //   иначе — центральная зона
  let zone = null;
  if (relX < edgeX) {
    zone = 'left';
  } else if (relX > width - edgeX) {
    zone = 'right';
  } else if (relY < edgeY) {
    zone = 'top';
  } else if (relY > height - edgeY) {
    zone = 'bottom';
  }

  // Центральная зона
  if (!zone) {
    const isContainer = node.children !== undefined || node.type === 'container';
    if (isContainer) {
      // Контейнер — добавление внутрь
      return { targetId: node.id, zone: 'inside' };
    }
    // Не-контейнер — определяем ближайший край, чтобы зона отображалась всегда
    const nearestX = Math.min(relX, width - relX);
    const nearestY = Math.min(relY, height - relY);
    if (nearestX <= nearestY) {
      zone = relX <= width / 2 ? 'left' : 'right';
    } else {
      zone = relY <= height / 2 ? 'top' : 'bottom';
    }
  }

  return { targetId: node.id, zone };
}

function Canvas() {
  const { state, dispatch } = useEditor();
  const { form, primitives, selectedIds, zoom } = state;

  const canvasRef = useRef(null);
  const [pan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null); // { type: 'move'|'resize', startX, startY, origLeft, origTop, origWidth, origHeight, handle, id }
  const [dragOver, setDragOver] = useState(false);
  const [dropZone, setDropZone] = useState(null); // { targetId, zone, index } — зона размещения при перетаскивании
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

  // Получение координат точки относительно холста из события
  const getCanvasPoint = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom - pan.x,
      y: (e.clientY - rect.top) / zoom - pan.y
    };
  };

  // Drag & drop из палитры
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);

    // Определяем зону размещения под курсором
    if (form) {
      const point = getCanvasPoint(e);
      const zone = findDropZone(form, point, { left: 0, top: 0 }, true);
      setDropZone(zone);
    }
  };

  const handleDragLeave = (e) => {
    setDragOver(false);
    setDropZone(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    setDropZone(null);
    const primitiveType = e.dataTransfer.getData('application/primitivetype');
    if (!primitiveType) return;

    const point = getCanvasPoint(e);
    const template = primitives.find(p => p.type === primitiveType);
    const width = template?.defaults?.width || 100;
    const height = template?.defaults?.height || 40;

    // Определяем зону размещения
    const zone = findDropZone(form, point, { left: 0, top: 0 }, true);

    // Если зона не определена — добавляем в свободную область (корень формы)
    if (!zone) {
      const snappedX = snapToGrid(Math.round(point.x - width / 2), gridSize);
      const snappedY = snapToGrid(Math.round(point.y - height / 2), gridSize);
      dispatch({
        type: 'ADD_PRIMITIVE',
        primitiveType,
        left: snappedX,
        top: snappedY
      });
      return;
    }

    const target = findPrimitive(form, zone.targetId);
    if (!target) return;

    // Flex-контейнер: вставка в children на индекс, без position/left/top
    if (zone.zone === 'before' || zone.zone === 'between' || zone.zone === 'after') {
      dispatch({
        type: 'ADD_PRIMITIVE',
        primitiveType,
        parentId: target.id,
        index: zone.index,
        noPosition: true
      });
      return;
    }

    // Внутрь контейнера (блочный)
    if (zone.zone === 'inside') {
      dispatch({
        type: 'ADD_PRIMITIVE',
        primitiveType,
        parentId: target.id
      });
      return;
    }

    // Краевые зоны: добавляем в родителя целевого примитива
    // Определяем родителя целевого примитива
    const parentInfo = findParentOf(form, target.id);
    const parentId = parentInfo ? parentInfo.id : null;

    // Абсолютная позиция целевого примитива
    const targetOffset = getOffsetToNode(form, target.id);
    const targetAbsLeft = targetOffset.left;
    const targetAbsTop = targetOffset.top;

    // Абсолютная позиция родителя (для пересчёта в локальные координаты)
    let parentAbsLeft = 0;
    let parentAbsTop = 0;
    if (parentId) {
      const parentOffset = getOffsetToNode(form, parentId);
      parentAbsLeft = parentOffset.left;
      parentAbsTop = parentOffset.top;
    }

    let newLeft = targetAbsLeft;
    let newTop = targetAbsTop;

    switch (zone.zone) {
      case 'left':
        newLeft = targetAbsLeft - width - GAP;
        newTop = targetAbsTop;
        break;
      case 'right':
        newLeft = targetAbsLeft + (target.width || 0) + GAP;
        newTop = targetAbsTop;
        break;
      case 'top':
        newLeft = targetAbsLeft;
        newTop = targetAbsTop - height - GAP;
        break;
      case 'bottom':
        newLeft = targetAbsLeft;
        newTop = targetAbsTop + (target.height || 0) + GAP;
        break;
      default:
        break;
    }

    // Пересчитываем в локальные координаты родителя
    const localLeft = newLeft - parentAbsLeft;
    const localTop = newTop - parentAbsTop;

    const snappedX = snapToGrid(Math.round(localLeft), gridSize);
    const snappedY = snapToGrid(Math.round(localTop), gridSize);

    dispatch({
      type: 'ADD_PRIMITIVE',
      primitiveType,
      left: snappedX,
      top: snappedY,
      parentId
    });
  };

  // Поиск родителя примитива в дереве
  const findParentOf = (node, id, parent = null) => {
    if (!node) return null;
    if (node.children) {
      for (const child of node.children) {
        if (child.id === id) return parent || node;
        const found = findParentOf(child, id, node);
        if (found) return found;
      }
    }
    return null;
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

          {/* Примитивы (скрытые через visible=false не отображаются на холсте) */}
          {form.children && form.children
            .filter(primitive => primitive.visible !== false)
            .map(primitive => (
              <CanvasPrimitive
                key={primitive.id}
                primitive={primitive}
                primitives={primitives}
                context={context}
                selectedIds={selectedIds}
                dropZone={dropZone}
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