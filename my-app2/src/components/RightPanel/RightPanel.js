// Правая панель: свойства, JSON, CSS, свои свойства
import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { findPrimitive } from '../../utils/jsonUtils';
import { SIZE_UNITS } from '../../utils/sizeUtils';
import PropertiesForm from './PropertiesForm';
import CustomProperties from './CustomProperties';
import JsonEditor from './JsonEditor';
import CssEditor from './CssEditor';
import EventsTab from './EventsTab';

// Настройки холста (корневой элемент формы)
function FormSettings({ form }) {
  const { dispatch } = useEditor();

  const handleCanvasChange = (prop, value) => {
    dispatch({
      type: 'UPDATE_FORM',
      updates: {
        canvas: {
          ...(form.canvas || {}),
          [prop]: value
        }
      }
    });
  };

  // Рендер поля размера холста с выбором единицы измерения
  const renderCanvasSizeInput = (dimension, label) => {
    const canvas = form.canvas || {};
    const unit = canvas[`${dimension}Unit`] || 'px';
    const value = canvas[dimension] !== undefined ? canvas[dimension] : (dimension === 'width' ? 800 : 600);

    return (
      <div className="property-row">
        <label className="property-label">{label}</label>
        <input
          type="number"
          value={value}
          disabled={unit === 'auto'}
          onChange={(e) => handleCanvasChange(dimension, parseFloat(e.target.value) || 0)}
        />
        <select
          className="size-unit-select"
          value={unit}
          onChange={(e) => handleCanvasChange(`${dimension}Unit`, e.target.value)}
          title="Единица измерения"
        >
          {SIZE_UNITS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    );
  };

  const handleContextChange = (prop, value) => {
    dispatch({
      type: 'UPDATE_FORM',
      updates: {
        context: {
          ...(form.context || {}),
          [prop]: value
        }
      }
    });
  };

  const handleInlineContextChange = (value) => {
    let parsed = {};
    try {
      parsed = value ? JSON.parse(value) : {};
    } catch (e) {
      // Невалидный JSON - не обновляем
      return;
    }
    dispatch({
      type: 'UPDATE_FORM',
      updates: {
        context: {
          ...(form.context || {}),
          inline: parsed
        }
      }
    });
  };

  const canvas = form.canvas || {};
  const context = form.context || {};

  return (
    <div className="properties-form">
      <div className="properties-section">
        <div className="properties-section-title">Настройки холста</div>
        <div className="property-row">
          <label className="property-label">Имя формы</label>
          <input
            type="text"
            value={form.name || ''}
            onChange={(e) => dispatch({ type: 'UPDATE_FORM', updates: { name: e.target.value } })}
          />
        </div>
        {renderCanvasSizeInput('width', 'Ширина')}
        {renderCanvasSizeInput('height', 'Высота')}
        <div className="property-row">
          <label className="property-label">Фон</label>
          <input
            type="color"
            value={canvas.backgroundColor || '#ffffff'}
            onChange={(e) => handleCanvasChange('backgroundColor', e.target.value)}
          />
        </div>
        <div className="property-row">
          <label className="property-label">Размер сетки</label>
          <input
            type="number"
            value={canvas.gridSize || 10}
            onChange={(e) => handleCanvasChange('gridSize', parseFloat(e.target.value) || 10)}
          />
        </div>
        <div className="property-row">
          <label className="property-label">Показать сетку</label>
          <input
            type="checkbox"
            checked={canvas.showGrid !== false}
            onChange={(e) => handleCanvasChange('showGrid', e.target.checked)}
          />
        </div>
      </div>

      <div className="properties-section">
        <div className="properties-section-title">Контекст</div>
        <div className="property-row">
          <label className="property-label">Источник</label>
          <select
            value={context.source || 'inline'}
            onChange={(e) => handleContextChange('source', e.target.value)}
          >
            <option value="inline">Inline (встроенный)</option>
            <option value="url">URL (загрузка)</option>
            <option value="none">Нет</option>
          </select>
        </div>
        {context.source === 'url' && (
          <div className="property-row">
            <label className="property-label">URL</label>
            <input
              type="text"
              value={context.url || ''}
              onChange={(e) => handleContextChange('url', e.target.value)}
              placeholder="https://api.example.com/context"
            />
          </div>
        )}
        {context.source === 'inline' && (
          <div className="property-row property-row-column">
            <label className="property-label">Inline данные (JSON)</label>
            <textarea
              className="json-textarea"
              rows={6}
              value={JSON.stringify(context.inline || {}, null, 2)}
              onChange={(e) => handleInlineContextChange(e.target.value)}
              spellCheck={false}
            />
          </div>
        )}
      </div>

      <div className="properties-section">
        <div className="properties-section-title">Действия при открытии</div>
        <div className="property-row">
          <label className="property-label">Тип</label>
          <select
            value={form.onOpen?.type || 'none'}
            onChange={(e) => dispatch({
              type: 'UPDATE_FORM',
              updates: {
                onOpen: { ...(form.onOpen || {}), type: e.target.value }
              }
            })}
          >
            <option value="none">Нет</option>
            <option value="loadContext">Загрузить контекст</option>
            <option value="init">Инициализация</option>
          </select>
        </div>
      </div>
    </div>
  );
}

function RightPanel() {
  const { state } = useEditor();
  const { form, selectedIds } = state;
  const [activeTab, setActiveTab] = useState('properties');

  // Если ничего не выбрано - показываем настройки формы
  const isFormSelected = selectedIds.length === 0;
  const selectedPrimitive = !isFormSelected && selectedIds.length === 1
    ? findPrimitive(form, selectedIds[0])
    : null;

  const tabs = [
    { id: 'properties', label: 'Свойства' },
    { id: 'custom', label: 'Свои' },
    { id: 'css', label: 'CSS' },
    { id: 'json', label: 'JSON' },
    { id: 'events', label: 'События' }
  ];

  return (
    <div className="right-panel">
      <div className="panel-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`panel-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="panel-content">
        {isFormSelected && (
          <div className="selection-info">
            <div className="selection-title">📋 {form?.name || 'Форма'}</div>
            <div className="selection-subtitle">Настройки холста (корневой элемент)</div>
          </div>
        )}

        {!isFormSelected && selectedIds.length > 1 && (
          <div className="selection-info">
            <div className="selection-title">Выбрано: {selectedIds.length} элементов</div>
            <div className="selection-subtitle">
              Используйте панель действий для группировки и выравнивания
            </div>
          </div>
        )}

        {!isFormSelected && selectedIds.length === 1 && selectedPrimitive && (
          <div className="selection-info">
            <div className="selection-title">
              {selectedPrimitive.name || selectedPrimitive.type}
            </div>
            <div className="selection-subtitle">Тип: {selectedPrimitive.type}</div>
          </div>
        )}

        {isFormSelected && activeTab === 'properties' && form && <FormSettings form={form} />}
        {isFormSelected && activeTab === 'custom' && form && (
          <div className="property-empty">Настройки формы редактируются во вкладке «Свойства»</div>
        )}
        {isFormSelected && activeTab === 'css' && form && (
          <div className="property-empty">Стили формы редактируются во вкладке «Свойства»</div>
        )}
        {isFormSelected && activeTab === 'json' && form && (
          <div className="property-empty">JSON формы доступен при сохранении</div>
        )}
        {isFormSelected && activeTab === 'events' && form && <EventsTab isFormSelected />}

        {!isFormSelected && selectedIds.length === 1 && selectedPrimitive && (
          <>
            {activeTab === 'properties' && <PropertiesForm primitive={selectedPrimitive} />}
            {activeTab === 'custom' && <CustomProperties primitive={selectedPrimitive} />}
            {activeTab === 'css' && <CssEditor primitive={selectedPrimitive} />}
            {activeTab === 'json' && <JsonEditor primitive={selectedPrimitive} />}
            {activeTab === 'events' && <EventsTab primitive={selectedPrimitive} />}
          </>
        )}

        {!isFormSelected && selectedIds.length > 1 && (
          <div className="multi-select-hint">
            Мультивыделение. Доступные действия: группировка, выравнивание, удаление.
          </div>
        )}
      </div>
    </div>
  );
}

export default RightPanel;