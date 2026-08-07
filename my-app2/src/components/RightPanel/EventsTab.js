// Вкладка событий: привязка функций к событиям формы и примитивов
import React from 'react';
import { useEditor } from '../../state/EditorContext';

// Стандартные события для примитивов
export const PRIMITIVE_EVENTS = [
  'click',
  'change',
  'input',
  'focus',
  'blur',
  'mouseenter',
  'mouseleave',
  'rowClicked'
];

// Стандартные события формы
export const FORM_EVENTS = [
  'onOpen',
  'onSubmit',
  'onLoad'
];

// События формы (выбор из функций)
function FormEventRows({ form, functions }) {
  const { dispatch } = useEditor();
  const events = form?.events || {};

  const handleEventChange = (eventName, fnName) => {
    if (!form) return;
    dispatch({
      type: 'UPDATE_FORM_EVENT',
      eventName,
      fnName // '' — отвязать
    });
  };

  if (!form) return null;

  // События, определённые пользователем дополнительно
  const customEvents = Object.keys(events).filter(e => !FORM_EVENTS.includes(e));

  return (
    <div className="events-tab">
      <div className="panel-hint">
        Привяжите функции к событиям формы. События выполняются при открытии, отправке и т.д.
      </div>

      <div className="properties-section-title">Стандартные события</div>
      {FORM_EVENTS.map(eventName => (
        <div key={eventName} className="property-row">
          <label className="property-label">{eventName}</label>
          <select
            value={events[eventName] || ''}
            onChange={(e) => handleEventChange(eventName, e.target.value)}
          >
            <option value="">— Не привязано —</option>
            {functions.map(fn => (
              <option key={fn.id} value={fn.name}>{fn.name}</option>
            ))}
          </select>
        </div>
      ))}

      <div className="properties-section-title">Дополнительные события</div>
      {customEvents.length === 0 && (
        <div className="property-empty">Нет дополнительных событий</div>
      )}
      {customEvents.map(eventName => (
        <div key={eventName} className="property-row">
          <label className="property-label">{eventName}</label>
          <select
            value={events[eventName] || ''}
            onChange={(e) => handleEventChange(eventName, e.target.value)}
          >
            <option value="">— Не привязано —</option>
            {functions.map(fn => (
              <option key={fn.id} value={fn.name}>{fn.name}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// События примитива
function PrimitiveEventRows({ primitive, functions }) {
  const { dispatch } = useEditor();
  const events = primitive?.events || {};

  const handleEventChange = (eventName, fnName) => {
    dispatch({
      type: 'UPDATE_PRIMITIVE_EVENT',
      id: primitive.id,
      eventName,
      fnName // '' — отвязать
    });
  };

  const addedEvents = Object.keys(events).filter(e => !PRIMITIVE_EVENTS.includes(e));

  return (
    <div className="events-tab">
      <div className="panel-hint">
        Привяжите функции к событиям элемента формы.
      </div>

      <div className="properties-section-title">Стандартные события</div>
      {PRIMITIVE_EVENTS.map(eventName => (
        <div key={eventName} className="property-row">
          <label className="property-label">{eventName}</label>
          <select
            value={events[eventName] || ''}
            onChange={(e) => handleEventChange(eventName, e.target.value)}
          >
            <option value="">— Не привязано —</option>
            {functions.map(fn => (
              <option key={fn.id} value={fn.name}>{fn.name}</option>
            ))}
          </select>
        </div>
      ))}

      <div className="properties-section-title">Дополнительные события</div>
      {addedEvents.length === 0 ? (
        <div className="property-empty">Нет дополнительных событий</div>
      ) : (
        addedEvents.map(eventName => (
          <div key={eventName} className="property-row">
            <label className="property-label">{eventName}</label>
            <select
              value={events[eventName] || ''}
              onChange={(e) => handleEventChange(eventName, e.target.value)}
            >
              <option value="">— Не привязано —</option>
              {functions.map(fn => (
                <option key={fn.id} value={fn.name}>{fn.name}</option>
              ))}
            </select>
          </div>
        ))
      )}
    </div>
  );
}

function EventsTab({ primitive, isFormSelected }) {
  const { state } = useEditor();
  const { form } = state;
  const functions = form?.functions || [];

  if (!form) return null;

  if (isFormSelected) {
    return <FormEventRows form={form} functions={functions} />;
  }

  if (primitive) {
    return <PrimitiveEventRows primitive={primitive} functions={functions} />;
  }

  return <div className="property-empty">Выберите элемент для настройки событий</div>;
}

export default EventsTab;