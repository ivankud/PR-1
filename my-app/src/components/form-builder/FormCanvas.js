import React from 'react';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Холст формы — отображает элементы формы в режиме конструктора.
 * Элементы кликабельны для выбора, поддерживают удаление и перемещение.
 */
function FormCanvas({
  form,
  selectedElementId,
  onSelectElement,
  onRemoveElement,
  onMoveElement,
}) {
  return (
    <div className="canvas">
      <div className="canvas-header">
        <h3 className="canvas-title">{form.name || 'Форма'}</h3>
        <span className="canvas-count">
          {form.elements.length} {form.elements.length === 1 ? 'элемент' : 'элементов'}
        </span>
      </div>

      {form.elements.length === 0 ? (
        <div className="canvas-empty">
          <div className="canvas-empty-icon">📋</div>
          <p>Форма пуста</p>
          <p className="canvas-empty-hint">
            Добавьте элементы из палитры слева
          </p>
        </div>
      ) : (
        <div className="canvas-elements">
          {form.elements.map((element, index) => {
            const def = ELEMENT_TYPES[element.type];
            const isSelected = element.id === selectedElementId;

            return (
              <div
                key={element.id}
                className={`canvas-element ${isSelected ? 'selected' : ''}`}
                onClick={() => onSelectElement(element.id)}
              >
                <div className="canvas-element-header">
                  <span className="canvas-element-icon">{def ? def.icon : '❓'}</span>
                  <span className="canvas-element-type">
                    {def ? def.label : element.type}
                  </span>
                  <span className="canvas-element-name">{element.name}</span>
                  <div className="canvas-element-actions">
                    <button
                      className="canvas-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveElement(element.id, -1);
                      }}
                      disabled={index === 0}
                      title="Переместить вверх"
                    >
                      ↑
                    </button>
                    <button
                      className="canvas-action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        onMoveElement(element.id, 1);
                      }}
                      disabled={index === form.elements.length - 1}
                      title="Переместить вниз"
                    >
                      ↓
                    </button>
                    <button
                      className="canvas-action-btn danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveElement(element.id);
                      }}
                      title="Удалить элемент"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <div className="canvas-element-preview">
                  {element.type === 'button' ? (
                    <span className="canvas-preview-button">
                      {element.buttonText || element.label}
                    </span>
                  ) : (
                    <span className="canvas-preview-label">
                      {element.label}
                      {element.required && <span className="required-mark">*</span>}
                    </span>
                  )}
                </div>

                {element.events && Object.keys(element.events).length > 0 && (
                  <div className="canvas-element-events">
                    {Object.entries(element.events)
                      .filter(([, code]) => code && code.trim())
                      .map(([eventName]) => (
                        <span key={eventName} className="canvas-event-badge">
                          ⚡ {eventName}
                        </span>
                      ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FormCanvas;