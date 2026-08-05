// Вкладка со списком примитивов для добавления на холст
import React from 'react';
import { useEditor } from '../../state/EditorContext';

function PrimitivesTab() {
  const { state, dispatch } = useEditor();
  const { primitives } = state;

  const handleDragStart = (e, primitiveType) => {
    e.dataTransfer.setData('application/primitivetype', primitiveType);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleClick = (primitiveType) => {
    // Добавление примитива по клику (в центр холста)
    dispatch({ type: 'ADD_PRIMITIVE', primitiveType });
  };

  return (
    <div className="primitives-tab">
      <div className="panel-hint">
        Перетащите примитив на холст или кликните для добавления
      </div>
      <div className="primitives-list">
        {primitives.map(primitive => (
          <div
            key={primitive.type}
            className="primitive-item"
            draggable
            onDragStart={(e) => handleDragStart(e, primitive.type)}
            onClick={() => handleClick(primitive.type)}
            title={primitive.name}
          >
            <span className="primitive-icon">{primitive.icon}</span>
            <span className="primitive-name">{primitive.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default PrimitivesTab;