// Вкладка с иерархическим списком примитивов на холсте
import React from 'react';
import { useEditor } from '../../state/EditorContext';
import { getPrimitiveTemplate } from '../../utils/primitiveRenderer';

function LayerItem({ primitive, primitives, depth, selectedIds, onSelect }) {
  const template = getPrimitiveTemplate(primitives, primitive.type);
  const isSelected = selectedIds.includes(primitive.id);
  const hasChildren = primitive.children && primitive.children.length > 0;

  return (
    <div className="layer-item-wrap">
      <div
        className={`layer-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(primitive.id, e.shiftKey);
        }}
      >
        <span className="layer-icon">{template?.icon || '📄'}</span>
        <span className="layer-name">{primitive.name || primitive.type}</span>
        <span className="layer-type">{primitive.type}</span>
      </div>
      {hasChildren && (
        <div className="layer-children">
          {primitive.children.map(child => (
            <LayerItem
              key={child.id}
              primitive={child}
              primitives={primitives}
              depth={depth + 1}
              selectedIds={selectedIds}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function LayersTab() {
  const { state, dispatch } = useEditor();
  const { form, primitives, selectedIds } = state;

  if (!form) {
    return <div className="layers-empty">Нет формы</div>;
  }

  const handleSelect = (id, additive) => {
    dispatch({ type: 'SELECT', id, additive });
  };

  return (
    <div className="layers-tab">
      <div className="panel-hint">
        Кликните для выделения, Shift+клик для мультивыделения
      </div>
      <div className="layers-list">
        {/* Корневой элемент - форма */}
        <div
          className={`layer-item layer-root ${selectedIds.length === 0 ? 'selected' : ''}`}
          onClick={() => dispatch({ type: 'CLEAR_SELECTION' })}
        >
          <span className="layer-icon">📋</span>
          <span className="layer-name">{form.name}</span>
          <span className="layer-type">form</span>
        </div>

        {form.children && form.children.map(primitive => (
          <LayerItem
            key={primitive.id}
            primitive={primitive}
            primitives={primitives}
            depth={1}
            selectedIds={selectedIds}
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

export default LayersTab;