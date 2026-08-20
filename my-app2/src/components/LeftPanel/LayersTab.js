// Вкладка с иерархическим списком примитивов на холсте
import React from 'react';
import { useEditor } from '../../state/EditorContext';
import { getPrimitiveTemplate } from '../../utils/primitiveRenderer';

// Иконка глаза: открытый/закрытый в зависимости от видимости примитива
function EyeIcon({ visible }) {
  return (
    <svg
      className="layer-eye-icon"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {visible ? (
        <>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </>
      ) : (
        <>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
          <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
          <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
          <line x1="1" y1="1" x2="23" y2="23" />
        </>
      )}
    </svg>
  );
}

function LayerItem({ primitive, primitives, depth, selectedIds, onSelect, onToggleVisible }) {
  const template = getPrimitiveTemplate(primitives, primitive.type);
  const isSelected = selectedIds.includes(primitive.id);
  const hasChildren = primitive.children && primitive.children.length > 0;
  const isVisible = primitive.visible !== false;

  return (
    <div className="layer-item-wrap">
      <div
        className={`layer-item ${isSelected ? 'selected' : ''} ${isVisible ? '' : 'hidden'}`}
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={(e) => {
          e.stopPropagation();
          onSelect(primitive.id, e.shiftKey);
        }}
      >
        <button
          type="button"
          className={`layer-eye-btn ${isVisible ? 'visible' : 'hidden'}`}
          title={isVisible ? 'Скрыть примитив' : 'Показать примитив'}
          onClick={(e) => {
            e.stopPropagation();
            onToggleVisible(primitive.id);
          }}
        >
          <EyeIcon visible={isVisible} />
        </button>
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
              onToggleVisible={onToggleVisible}
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

  const handleToggleVisible = (id) => {
    dispatch({ type: 'TOGGLE_VISIBLE', id });
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
            onToggleVisible={handleToggleVisible}
          />
        ))}
      </div>
    </div>
  );
}

export default LayersTab;