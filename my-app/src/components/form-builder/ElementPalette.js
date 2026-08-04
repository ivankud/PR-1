import React from 'react';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Палитра элементов — список доступных типов элементов,
 * которые можно добавить на холст формы.
 */
function ElementPalette({ onAddElement }) {
  return (
    <div className="palette">
      <h3 className="palette-title">Элементы</h3>
      <div className="palette-list">
        {Object.entries(ELEMENT_TYPES).map(([type, def]) => (
          <button
            key={type}
            className="palette-item"
            onClick={() => onAddElement(type)}
            title={`Добавить: ${def.label}`}
          >
            <span className="palette-item-icon">{def.icon}</span>
            <span className="palette-item-label">{def.label}</span>
          </button>
        ))}
      </div>
      <p className="palette-hint">
        Нажмите на элемент, чтобы добавить его в форму
      </p>
    </div>
  );
}

export default ElementPalette;