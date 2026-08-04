import React, { useState } from 'react';
import EventBinding from './EventBinding';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Панель свойств выбранного элемента.
 * Две вкладки: "Свойства" (настройка полей) и "События" (привязка JS-кода).
 */
function PropertiesPanel({ element, onUpdateElement, onUpdateElementEvent }) {
  const [activeTab, setActiveTab] = useState('properties');

  if (!element) {
    return (
      <div className="properties-panel">
        <h3 className="properties-title">Свойства</h3>
        <div className="properties-empty">
          <p>Выберите элемент на холсте,</p>
          <p>чтобы настроить его свойства и события</p>
        </div>
      </div>
    );
  }

  const def = ELEMENT_TYPES[element.type];

  const update = (field, value) => {
    onUpdateElement(element.id, { [field]: value });
  };

  const updateOptions = (options) => {
    onUpdateElement(element.id, { options });
  };

  return (
    <div className="properties-panel">
      <div className="properties-header">
        <h3 className="properties-title">
          {def ? def.icon : '❓'} {def ? def.label : element.type}
        </h3>
        <span className="properties-id">{element.id}</span>
      </div>

      <div className="properties-tabs">
        <button
          className={`properties-tab ${activeTab === 'properties' ? 'active' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Свойства
        </button>
        <button
          className={`properties-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          События
        </button>
      </div>

      {activeTab === 'properties' ? (
        <div className="properties-content">
          <div className="property-group">
            <label className="property-label">Подпись (label)</label>
            <input
              type="text"
              className="property-input"
              value={element.label || ''}
              onChange={(e) => update('label', e.target.value)}
            />
          </div>

          <div className="property-group">
            <label className="property-label">Имя поля (name)</label>
            <input
              type="text"
              className="property-input"
              value={element.name || ''}
              onChange={(e) => update('name', e.target.value)}
            />
          </div>

          {element.type === 'button' && (
            <div className="property-group">
              <label className="property-label">Текст кнопки</label>
              <input
                type="text"
                className="property-input"
                value={element.buttonText || ''}
                onChange={(e) => update('buttonText', e.target.value)}
              />
            </div>
          )}

          {(element.type === 'text' ||
            element.type === 'textarea' ||
            element.type === 'number') && (
            <div className="property-group">
              <label className="property-label">Плейсхолдер</label>
              <input
                type="text"
                className="property-input"
                value={element.placeholder || ''}
                onChange={(e) => update('placeholder', e.target.value)}
              />
            </div>
          )}

          {element.type === 'textarea' && (
            <div className="property-group">
              <label className="property-label">Количество строк</label>
              <input
                type="number"
                className="property-input"
                value={element.rows || 4}
                min="1"
                max="20"
                onChange={(e) => update('rows', parseInt(e.target.value) || 4)}
              />
            </div>
          )}

          {element.type === 'number' && (
            <>
              <div className="property-group">
                <label className="property-label">Минимум</label>
                <input
                  type="number"
                  className="property-input"
                  value={element.min || ''}
                  onChange={(e) => update('min', e.target.value)}
                />
              </div>
              <div className="property-group">
                <label className="property-label">Максимум</label>
                <input
                  type="number"
                  className="property-input"
                  value={element.max || ''}
                  onChange={(e) => update('max', e.target.value)}
                />
              </div>
            </>
          )}

          {element.type !== 'button' && (
            <div className="property-group">
              <label className="property-checkbox">
                <input
                  type="checkbox"
                  checked={!!element.required}
                  onChange={(e) => update('required', e.target.checked)}
                />
                Обязательное поле
              </label>
            </div>
          )}

          {(element.type === 'select' || element.type === 'radio') && (
            <div className="property-group">
              <label className="property-label">Варианты (по одному на строку)</label>
              <textarea
                className="property-input property-textarea"
                value={(element.options || []).join('\n')}
                onChange={(e) =>
                  updateOptions(
                    e.target.value
                      .split('\n')
                      .map((s) => s.trim())
                      .filter(Boolean)
                  )
                }
                rows={5}
              />
            </div>
          )}

          {element.type === 'button' && (
            <div className="property-group">
              <label className="property-label">Стиль кнопки</label>
              <select
                className="property-input"
                value={element.variant || 'primary'}
                onChange={(e) => update('variant', e.target.value)}
              >
                <option value="primary">Основная</option>
                <option value="secondary">Вторичная</option>
                <option value="danger">Опасная</option>
                <option value="success">Успешная</option>
              </select>
            </div>
          )}
        </div>
      ) : (
        <div className="properties-content">
          <EventBinding
            elementType={element.type}
            events={element.events}
            onUpdateEvent={(eventName, code) =>
              onUpdateElementEvent(element.id, eventName, code)
            }
          />
        </div>
      )}
    </div>
  );
}

export default PropertiesPanel;