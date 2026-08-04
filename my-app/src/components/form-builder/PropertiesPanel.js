import React, { useState } from 'react';
import EventBinding from './EventBinding';
import { ELEMENT_TYPES, CSS_PROPERTIES } from '../../utils/formSchema';

/**
 * Панель свойств выбранного элемента.
 * Три вкладки: "Свойства" (настройка полей), "Стили" (CSS) и "События" (привязка JS-кода).
 */
function PropertiesPanel({
  element,
  onUpdateElement,
  onUpdateElementCss,
  onUpdateElementEvent,
  onUpdateElementPosition,
  onUpdateElementSize,
}) {
  const [activeTab, setActiveTab] = useState('properties');
  const [styleTab, setStyleTab] = useState('fields');
  const [showCssTooltip, setShowCssTooltip] = useState(false);
  const [cssEditText, setCssEditText] = useState('');
  const [cssEditError, setCssEditError] = useState(null);
  // Дублирующие состояния для редактирования полей CSS (применяются по кнопке «Сохранить»)
  const [cssFieldDraft, setCssFieldDraft] = useState({});
  const [isCssFieldDirty, setIsCssFieldDirty] = useState(false);

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

  // Форматирование CSS-свойств элемента в читаемый CSS-код
  const formatCssCode = (css) => {
    if (!css || typeof css !== 'object') return '/* Стили не заданы */';

    const lines = Object.entries(css)
      .filter(([, value]) => value !== undefined && value !== null && value !== '')
      .map(([key, value]) => `  ${key}: ${value};`);

    if (lines.length === 0) {
      return '/* Стили не заданы */';
    }

    return `{\n${lines.join('\n')}\n}`;
  };

  // Копирование CSS в буфер обмена
  const copyCssToClipboard = () => {
    const cssCode = formatCssCode(element.css);
    const fullCode = `/* ${element.label || element.name || 'Элемент'} */\n${cssCode}`;
    navigator.clipboard
      .writeText(fullCode)
      .then(() => {
        setShowCssTooltip(true);
        setTimeout(() => setShowCssTooltip(false), 1500);
      })
      .catch((err) => console.error('Ошибка копирования CSS:', err));
  };

  // Парсинг CSS-текста обратно в объект
  const parseCssText = (text) => {
    const result = {};
    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('/*') || trimmed === '{' || trimmed === '}') continue;
      const match = trimmed.match(/^([\w-]+)\s*:\s*(.+?);?$/);
      if (match) {
        result[match[1].trim()] = match[2].trim();
      }
    }
    return result;
  };

  // Начало редактирования CSS-кода
  const startCssEdit = () => {
    setCssEditText(formatCssCode(element.css));
    setCssEditError(null);
  };

  // Применение отредактированного CSS-кода
  const applyCssEdit = () => {
    try {
      const parsed = parseCssText(cssEditText);
      onUpdateElementCss(element.id, parsed);
      setCssEditError(null);
    } catch (err) {
      setCssEditError('Ошибка парсинга CSS: ' + err.message);
    }
  };

  const renderPositionSection = () => {
    return (
      <div className="property-section">
        <div className="property-section-title">Позиция и размер</div>
        <p className="property-section-hint">
          Изменение размеров автоматически прописывается в CSS-стили (вкладка «Стили»)
        </p>
        <div className="property-row">
          <div className="property-group">
            <label className="property-label">X</label>
            <input
              type="number"
              className="property-input"
              value={element.x || 0}
              onChange={(e) =>
                onUpdateElementPosition(element.id, parseInt(e.target.value) || 0, element.y || 0)
              }
            />
          </div>
          <div className="property-group">
            <label className="property-label">Y</label>
            <input
              type="number"
              className="property-input"
              value={element.y || 0}
              onChange={(e) =>
                onUpdateElementPosition(element.id, element.x || 0, parseInt(e.target.value) || 0)
              }
            />
          </div>
        </div>
        <div className="property-row">
          <div className="property-group">
            <label className="property-label">Ширина</label>
            <div className="property-size-input">
              <input
                type="number"
                className="property-input"
                value={element.width || 200}
                min="20"
                onChange={(e) =>
                  onUpdateElementSize(
                    element.id,
                    parseInt(e.target.value) || 200,
                    element.height || 40,
                    element.widthUnit || 'px',
                    element.heightUnit || 'px'
                  )
                }
              />
              <select
                className="property-unit-select"
                value={element.widthUnit || 'px'}
                onChange={(e) =>
                  onUpdateElementSize(
                    element.id,
                    element.width || 200,
                    element.height || 40,
                    e.target.value,
                    element.heightUnit || 'px'
                  )
                }
                title="Единицы измерения ширины"
              >
                <option value="px">px</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
          <div className="property-group">
            <label className="property-label">Высота</label>
            <div className="property-size-input">
              <input
                type="number"
                className="property-input"
                value={element.height || 40}
                min="20"
                onChange={(e) =>
                  onUpdateElementSize(
                    element.id,
                    element.width || 200,
                    parseInt(e.target.value) || 40,
                    element.widthUnit || 'px',
                    element.heightUnit || 'px'
                  )
                }
              />
              <select
                className="property-unit-select"
                value={element.heightUnit || 'px'}
                onChange={(e) =>
                  onUpdateElementSize(
                    element.id,
                    element.width || 200,
                    element.height || 40,
                    element.widthUnit || 'px',
                    e.target.value
                  )
                }
                title="Единицы измерения высоты"
              >
                <option value="px">px</option>
                <option value="%">%</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPropertiesTab = () => {
    return (
      <>
        {renderPositionSection()}

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

        {element.type !== 'button' && element.type !== 'container' && (
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
      </>
    );
  };

  // Инициализация черновика полей CSS при переключении на вкладку «Поля»
  const initCssFieldDraft = () => {
    const draft = {};
    CSS_PROPERTIES.forEach((prop) => {
      draft[prop.key] = (element.css && element.css[prop.key]) || '';
    });
    setCssFieldDraft(draft);
    setIsCssFieldDirty(false);
  };

  // Сохранение изменений полей CSS
  const saveCssFields = () => {
    onUpdateElementCss(element.id, cssFieldDraft);
    setIsCssFieldDirty(false);
  };

  // Сброс изменений полей CSS
  const resetCssFields = () => {
    initCssFieldDraft();
  };

  const renderStylesTab = () => {
    return (
      <>
        {renderPositionSection()}

        <div className="style-tabs">
          <button
            className={`style-tab ${styleTab === 'fields' ? 'active' : ''}`}
            onClick={() => {
              setStyleTab('fields');
              initCssFieldDraft();
            }}
          >
            Поля
          </button>
          <button
            className={`style-tab ${styleTab === 'code' ? 'active' : ''}`}
            onClick={() => setStyleTab('code')}
          >
            CSS-код
          </button>
        </div>

        {styleTab === 'fields' ? (
          <div className="property-section">
            <div className="property-section-title css-preview-title">
              <span>Свойства CSS</span>
              {isCssFieldDirty && (
                <span className="style-unsaved-hint">● несохранённые изменения</span>
              )}
            </div>
            {CSS_PROPERTIES.map((prop) => {
              const value = cssFieldDraft[prop.key] || '';

              if (prop.type === 'select') {
                return (
                  <div key={prop.key} className="property-group">
                    <label className="property-label">{prop.label}</label>
                    <select
                      className="property-input"
                      value={value || prop.options[0]}
                      onChange={(e) => {
                        setCssFieldDraft((prev) => ({
                          ...prev,
                          [prop.key]: e.target.value,
                        }));
                        setIsCssFieldDirty(true);
                      }}
                    >
                      {prop.options.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                );
              }

              return (
                <div key={prop.key} className="property-group">
                  <label className="property-label">{prop.label}</label>
                  <input
                    type={prop.type === 'color' ? 'color' : 'text'}
                    className="property-input"
                    value={prop.type === 'color' ? (value || '#333333') : value}
                    placeholder={prop.placeholder}
                    onChange={(e) => {
                      setCssFieldDraft((prev) => ({
                        ...prev,
                        [prop.key]: e.target.value,
                      }));
                      setIsCssFieldDirty(true);
                    }}
                  />
                </div>
              );
            })}

            <div className="css-edit-actions">
              <button
                className="css-copy-btn primary"
                onClick={saveCssFields}
                disabled={!isCssFieldDirty}
              >
                ✓ Сохранить
              </button>
              <button
                className="css-copy-btn"
                onClick={resetCssFields}
                disabled={!isCssFieldDirty}
              >
                Сбросить
              </button>
            </div>
          </div>
        ) : (
          <div className="property-section">
            <div className="property-section-title css-preview-title">
              <span>CSS-код</span>
              <div className="css-preview-actions">
                <button
                  className="css-copy-btn"
                  onClick={copyCssToClipboard}
                  title="Копировать CSS в буфер обмена"
                >
                  {showCssTooltip ? '✓ Скопировано' : '📋 Копировать'}
                </button>
                <button
                  className="css-copy-btn"
                  onClick={startCssEdit}
                  title="Редактировать CSS"
                >
                  ✏️ Редактировать
                </button>
              </div>
            </div>

            {cssEditText ? (
              <>
                <textarea
                  className="css-edit-textarea"
                  value={cssEditText}
                  onChange={(e) => {
                    setCssEditText(e.target.value);
                    setCssEditError(null);
                  }}
                  spellCheck={false}
                  rows={10}
                />
                {cssEditError && (
                  <div className="css-edit-error">{cssEditError}</div>
                )}
                <div className="css-edit-actions">
                  <button
                    className="css-copy-btn primary"
                    onClick={applyCssEdit}
                  >
                    ✓ Сохранить
                  </button>
                  <button
                    className="css-copy-btn"
                    onClick={() => {
                      setCssEditText('');
                      setCssEditError(null);
                    }}
                  >
                    Отмена
                  </button>
                </div>
              </>
            ) : (
              <pre className="css-preview-code">{formatCssCode(element.css)}</pre>
            )}
          </div>
        )}
      </>
    );
  };

  const renderEventsTab = () => {
    return (
      <EventBinding
        elementType={element.type}
        events={element.events}
        onUpdateEvent={(eventName, code) =>
          onUpdateElementEvent(element.id, eventName, code)
        }
      />
    );
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
          className={`properties-tab ${activeTab === 'styles' ? 'active' : ''}`}
          onClick={() => setActiveTab('styles')}
        >
          Стили
        </button>
        <button
          className={`properties-tab ${activeTab === 'events' ? 'active' : ''}`}
          onClick={() => setActiveTab('events')}
        >
          События
        </button>
      </div>

      <div className="properties-content">
        {activeTab === 'properties' && renderPropertiesTab()}
        {activeTab === 'styles' && renderStylesTab()}
        {activeTab === 'events' && renderEventsTab()}
      </div>
    </div>
  );
}

export default PropertiesPanel;