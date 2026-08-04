import React, { useState } from 'react';
import CodeEditor from './CodeEditor';
import { EVENT_TYPES, EVENT_LABELS } from '../../utils/formSchema';

/**
 * Компонент привязки событий к JavaScript-коду.
 * Позволяет выбрать событие и написать код, который выполнится при его срабатывании.
 */
function EventBinding({ elementType, events, onUpdateEvent }) {
  const [activeEvent, setActiveEvent] = useState(null);

  const availableEvents = EVENT_TYPES[elementType] || [];

  // Если активное событие не выбрано, выбираем первое доступное
  const currentEvent = activeEvent || availableEvents[0] || null;

  const handleSelectEvent = (eventName) => {
    setActiveEvent(eventName);
  };

  if (availableEvents.length === 0) {
    return (
      <div className="event-binding-empty">
        Для этого типа элемента нет доступных событий
      </div>
    );
  }

  return (
    <div className="event-binding">
      <div className="event-binding-tabs">
        {availableEvents.map((eventName) => (
          <button
            key={eventName}
            className={`event-binding-tab ${
              currentEvent === eventName ? 'active' : ''
            }`}
            onClick={() => handleSelectEvent(eventName)}
          >
            {EVENT_LABELS[eventName] || eventName}
            {events && events[eventName] && events[eventName].trim() && (
              <span className="event-binding-dot" title="Код привязан" />
            )}
          </button>
        ))}
      </div>

      {currentEvent && (
        <div className="event-binding-editor">
          <div className="event-binding-header">
            <span className="event-binding-name">
              {EVENT_LABELS[currentEvent] || currentEvent}
            </span>
            <span className="event-binding-code-name">{currentEvent}</span>
          </div>
          <CodeEditor
            value={events ? events[currentEvent] : ''}
            onChange={(code) => onUpdateEvent(currentEvent, code)}
            placeholder={`// Код для события ${currentEvent}\n// Выполнится при ${(
              EVENT_LABELS[currentEvent] || currentEvent
            ).toLowerCase()}`}
          />
        </div>
      )}
    </div>
  );
}

export default EventBinding;