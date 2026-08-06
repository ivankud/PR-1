// Отрисовка примитива на холсте
import React from 'react';
import { renderPrimitive, getPrimitiveTemplate } from '../../utils/primitiveRenderer';
import { getSizeStyle } from '../../utils/sizeUtils';

function CanvasPrimitive({
  primitive,
  primitives,
  context,
  isSelected,
  isMultiSelected,
  onSelect,
  onMouseDown,
  onResizeStart
}) {
  const template = getPrimitiveTemplate(primitives, primitive.type);

  const handleClick = (e) => {
    e.stopPropagation();
    onSelect(primitive.id, e.shiftKey);
  };

  const handleMouseDown = (e) => {
    if (e.button !== 0) return;
    e.stopPropagation();
    onMouseDown(e, primitive.id);
  };

  const style = {
    position: 'absolute',
    left: primitive.left || 0,
    top: primitive.top || 0,
    ...getSizeStyle(primitive),
    ...(primitive.style || {})
  };

  // Для контейнеров добавляем overflow visible
  if (primitive.children && primitive.children.length > 0) {
    style.overflow = 'visible';
  }

  const rendered = renderPrimitive(primitive, template, context);

  return (
    <div
      className={`canvas-primitive ${isSelected ? 'selected' : ''} ${isMultiSelected ? 'multi-selected' : ''}`}
      style={style}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      data-primitive-id={primitive.id}
    >
      {rendered}

      {/* Дочерние примитивы (для контейнеров) */}
      {primitive.children && primitive.children.length > 0 && (
        <div className="canvas-primitive-children">
          {primitive.children.map(child => (
            <CanvasPrimitive
              key={child.id}
              primitive={child}
              primitives={primitives}
              context={context}
              isSelected={isSelected}
              isMultiSelected={isMultiSelected}
              onSelect={onSelect}
              onMouseDown={onMouseDown}
              onResizeStart={onResizeStart}
            />
          ))}
        </div>
      )}

      {/* Рамка выделения и ресайз-хендлы */}
      {isSelected && (
        <div className="selection-box">
          {['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'].map(handle => (
            <div
              key={handle}
              className={`resize-handle resize-${handle}`}
              onMouseDown={(e) => {
                e.stopPropagation();
                onResizeStart(e, primitive.id, handle);
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CanvasPrimitive;