// Добавление и редактирование произвольных свойств
import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';

function CustomProperties({ primitive }) {
  const { dispatch } = useEditor();
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');

  const customProps = primitive.customProperties || {};

  const handleAdd = () => {
    if (!newKey.trim()) return;
    dispatch({
      type: 'UPDATE_PROPERTY',
      id: primitive.id,
      property: 'customProperties',
      value: {
        ...customProps,
        [newKey.trim()]: newValue
      }
    });
    setNewKey('');
    setNewValue('');
  };

  const handleChange = (key, value) => {
    const updated = { ...customProps };
    updated[key] = value;
    dispatch({
      type: 'UPDATE_PROPERTY',
      id: primitive.id,
      property: 'customProperties',
      value: updated
    });
  };

  const handleRemove = (key) => {
    const updated = { ...customProps };
    delete updated[key];
    dispatch({
      type: 'UPDATE_PROPERTY',
      id: primitive.id,
      property: 'customProperties',
      value: updated
    });
  };

  return (
    <div className="custom-properties">
      <div className="properties-section-title">Свои свойства</div>

      {Object.keys(customProps).length === 0 && (
        <div className="property-empty">Нет своих свойств</div>
      )}

      {Object.entries(customProps).map(([key, value]) => (
        <div key={key} className="property-row">
          <label
            className="property-label"
            title={key === 'visibility'
              ? 'Логическое условие видимости примитива. Ссылки на контекст через {{path}}. Пример: "{{rowT1}} != null" — примитив виден, когда переменная rowT1 существует в контексте.'
              : (typeof value === 'object' && value !== null && Array.isArray(value.conditions)
                  ? 'Условное значение. Формат: { "default": "...", "conditions": [ { "when": "{{path}} === ...", "value": "..." } ] }'
                  : undefined)}
          >
            {key}
          </label>
          {typeof value === 'object' && value !== null && Array.isArray(value.conditions) ? (
            <div className="property-conditional">
              <div className="property-conditional-default">
                <span className="property-conditional-label">default:</span>
                <input
                  type="text"
                  value={value.default || ''}
                  onChange={(e) => handleChange(key, { ...value, default: e.target.value })}
                />
              </div>
              {value.conditions.map((cond, idx) => (
                <div key={idx} className="property-conditional-row">
                  <span className="property-conditional-label">when:</span>
                  <input
                    type="text"
                    value={cond.when || ''}
                    onChange={(e) => {
                      const conditions = [...value.conditions];
                      conditions[idx] = { ...cond, when: e.target.value };
                      handleChange(key, { ...value, conditions });
                    }}
                  />
                  <span className="property-conditional-label">value:</span>
                  <input
                    type="text"
                    value={cond.value || ''}
                    onChange={(e) => {
                      const conditions = [...value.conditions];
                      conditions[idx] = { ...cond, value: e.target.value };
                      handleChange(key, { ...value, conditions });
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <input
              type="text"
              value={value}
              onChange={(e) => handleChange(key, e.target.value)}
            />
          )}
          <button
            className="btn btn-icon btn-remove"
            onClick={() => handleRemove(key)}
            title="Удалить свойство"
          >
            ✕
          </button>
        </div>
      ))}

      {customProps.visibility !== undefined && (
        <div className="property-hint">
          💡 Условие видимости: примитив отображается, когда выражение истинно.
          Ссылки на контекст — через {'{{path}}'}, например {'{{rowT1}} != null'}.
        </div>
      )}

      <div className="custom-property-add">
        <input
          type="text"
          placeholder="Имя свойства"
          value={newKey}
          onChange={(e) => setNewKey(e.target.value)}
        />
        <input
          type="text"
          placeholder="Значение"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
        />
        <button className="btn btn-secondary" onClick={handleAdd}>
          Добавить
        </button>
      </div>
    </div>
  );
}

export default CustomProperties;