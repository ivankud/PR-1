// Отрисовка примитива на холсте
import React from 'react';
import { renderPrimitive, getPrimitiveTemplate } from '../../utils/primitiveRenderer';
import { getSizeStyle } from '../../utils/sizeUtils';

function CanvasPrimitive({
  primitive,
  primitives,
  context,
  selectedIds,
  onSelect,
  onMouseDown,
  onResizeStart
}) {
  const template = getPrimitiveTemplate(primitives, primitive.type);
  const isSelected = selectedIds && selectedIds.includes(primitive.id);
  const isMultiSelected = selectedIds
    ? selectedIds.length > 1 && selectedIds.includes(primitive.id)
    : false;

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

  // Если контейнер использует flex-раскладку, передаём её вложенному контейнеру детей,
  // чтобы дочерние примитивы корректно располагались (горизонтально/вертикально)
  const childrenStyle = {};
  if (primitive.style?.display === 'flex') {
    childrenStyle.display = 'flex';
    childrenStyle.flexDirection = primitive.style.flexDirection || 'row';
    childrenStyle.gap = primitive.style.gap;
    childrenStyle.justifyContent = primitive.style.justifyContent;
    childrenStyle.alignItems = primitive.style.alignItems;
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
        <div className="canvas-primitive-children" style={childrenStyle}>
          {primitive.children.map(child => (
            <CanvasPrimitive
              key={child.id}
              primitive={child}
              primitives={primitives}
              context={context}
              selectedIds={selectedIds}
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