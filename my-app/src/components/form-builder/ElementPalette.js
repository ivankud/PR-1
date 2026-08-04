import React from 'react';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Палитра элементов — список доступных типов элементов,
 * которые можно добавить на холст формы или в выбранный контейнер.
 */
function ElementPalette({ onAddElement, selectedElement, isContainerSelected }) {
  return (
    <div className="palette">
      <h3 className="palette-title">Элементы</h3>
      {isContainerSelected && (
        <div className="palette-container-info">
          <span>📦 Добавление в: <strong>{selectedElement.label || 'Контейнер'}</strong></span>
        </div>
      )}
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
        {isContainerSelected
          ? 'Элементы будут добавлены в выбранный контейнер'
          : 'Элементы добавляются на холст. Выберите контейнер, чтобы добавить в него.'}
      </p>
    </div>
  );
}

export default ElementPalette;