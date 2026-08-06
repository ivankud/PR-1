// Холст редактора форм
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getFormContext } from '../../utils/anchors';
import { findPrimitive } from '../../utils/jsonUtils';
import { isPxSize, getNumericSize, getCanvasSizeStyle } from '../../utils/sizeUtils';
import CanvasPrimitive from './CanvasPrimitive';

function Canvas() {
  const { state, dispatch } = useEditor();
  const { form, primitives, selectedIds, zoom } = state;

  const canvasRef = useRef(null);
  const [pan] = useState({ x: 0, y: 0 });
  const [dragState, setDragState] = useState(null); // { type: 'move'|'resize', startX, startY, origLeft, origTop, origWidth, origHeight, handle, id }
  const [dragOver, setDragOver] = useState(false);
  const dragRef = useRef({ lastX: 0, lastY: 0 }); // последние координаты мыши при drag

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

      // Инкрементальное смещение от последней позиции мыши (в координатах холста)
      const dx = (e.clientX - dragRef.current.lastX) / zoom;
      const dy = (e.clientY - dragRef.current.lastY) / zoom;

      // Обновляем последнюю позицию мыши
      dragRef.current.lastX = e.clientX;
      dragRef.current.lastY = e.clientY;

      if (dragState.type === 'move') {
        dispatch({
          type: 'MOVE_PRIMITIVES_LIVE',
          dx: Math.round(dx),
          dy: Math.round(dy)
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

        dispatch({
          type: 'RESIZE_PRIMITIVE_LIVE',
          id: dragState.id,
          width: Math.round(newWidth),
          height: Math.round(newHeight),
          left: Math.round(newLeft),
          top: Math.round(newTop)
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
    dragRef.current = { lastX: e.clientX, lastY: e.clientY };
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
    const x = (e.clientX - rect.left) / zoom - pan.x;
    const y = (e.clientY - rect.top) / zoom - pan.y;

    const template = primitives.find(p => p.type === primitiveType);
    const width = template?.defaults?.width || 100;
    const height = template?.defaults?.height || 40;

    dispatch({
      type: 'ADD_PRIMITIVE',
      primitiveType,
      left: Math.round(x - width / 2),
      top: Math.round(y - height / 2)
    });
  };

  if (!form) {
    return <div className="canvas-empty">Загрузите или создайте форму</div>;
  }

  const canvas = form.canvas || { width: 800, height: 600, backgroundColor: '#ffffff', gridSize: 10, showGrid: true };

  // Создание сетки (только для px-размера — иначе ширина/высота в %/vw/vh/auto)
  const canvasSizeStyle = getCanvasSizeStyle(canvas);
  const canvasWidthPx = canvas.widthUnit === 'auto' ? 800 : (canvas.width || 800);
  const canvasHeightPx = canvas.heightUnit === 'auto' ? 600 : (canvas.height || 600);

  const gridLines = [];
  if (canvas.showGrid) {
    const gridSize = canvas.gridSize || 10;
    for (let x = 0; x <= canvasWidthPx; x += gridSize) {
      gridLines.push(
        <div key={`v-${x}`} className="grid-line grid-v" style={{ left: x }} />
      );
    }
    for (let y = 0; y <= canvasHeightPx; y += gridSize) {
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
              {canvasWidthPx}×{canvasHeightPx}
              {(canvas.widthUnit || 'px') !== 'px' || (canvas.heightUnit || 'px') !== 'px'
                ? ` (${canvasSizeStyle.width} × ${canvasSizeStyle.height})`
                : 'px'}
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
              isSelected={selectedIds.includes(primitive.id)}
              isMultiSelected={selectedIds.length > 1 && selectedIds.includes(primitive.id)}
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