// Добавление и редактирование произвольных свойств
import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';

// Быстрые ссылки на контекст для вставки в условия
const CONTEXT_REFERENCES = [
  { label: '{{rowT1}}', value: '{{rowT1}}' },
  { label: '{{rowT1.id}}', value: '{{rowT1.id}}' },
  { label: '{{rowT1.name}}', value: '{{rowT1.name}}' },
  { label: '{{field1.value}}', value: '{{field1.value}}' },
  { label: '{{field2.value}}', value: '{{field2.value}}' },
  { label: '{{field3.value}}', value: '{{field3.value}}' }
];

// Операторы сравнения для конструктора условий
const COMPARISON_OPERATORS = [
  { label: '==', value: '===' },
  { label: '!=', value: '!==' },
  { label: '>', value: '>' },
  { label: '<', value: '<' },
  { label: '>=', value: '>=' },
  { label: '<=', value: '<=' },
  { label: 'существует', value: '!= null' },
  { label: 'не существует', value: '== null' }
];

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

  // Добавление условного свойства (объект с default и conditions)
  const handleAddConditional = () => {
    if (!newKey.trim()) return;
    dispatch({
      type: 'UPDATE_PROPERTY',
      id: primitive.id,
      property: 'customProperties',
      value: {
        ...customProps,
        [newKey.trim()]: {
          default: '',
          conditions: [
            { when: '', value: '' }
          ]
        }
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

  // Добавление нового условия в условное свойство
  const handleAddCondition = (key, value) => {
    const conditions = [...(value.conditions || [])];
    conditions.push({ when: '', value: '' });
    handleChange(key, { ...value, conditions });
  };

  // Удаление условия из условного свойства
  const handleRemoveCondition = (key, value, idx) => {
    const conditions = [...(value.conditions || [])];
    conditions.splice(idx, 1);
    handleChange(key, { ...value, conditions });
  };

  // Вставка ссылки на контекст в поле условия
  const insertContextRef = (key, value, idx, ref) => {
    const conditions = [...(value.conditions || [])];
    const current = conditions[idx] || { when: '', value: '' };
    conditions[idx] = { ...current, when: (current.when || '') + ref.value };
    handleChange(key, { ...value, conditions });
  };

  // Вставка оператора в поле условия
  const insertOperator = (key, value, idx, op) => {
    const conditions = [...(value.conditions || [])];
    const current = conditions[idx] || { when: '', value: '' };
    conditions[idx] = { ...current, when: (current.when || '') + ' ' + op.value + ' ' };
    handleChange(key, { ...value, conditions });
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
                <div key={idx} className="property-conditional-block">
                  <div className="property-conditional-row">
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
                    <button
                      className="btn btn-icon btn-remove"
                      onClick={() => handleRemoveCondition(key, value, idx)}
                      title="Удалить условие"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="property-conditional-tools">
                    <span className="property-conditional-tools-label">Контекст:</span>
                    {CONTEXT_REFERENCES.map(ref => (
                      <button
                        key={ref.value}
                        className="btn btn-sm btn-context-ref"
                        onClick={() => insertContextRef(key, value, idx, ref)}
                        title={`Вставить ${ref.value}`}
                      >
                        {ref.label}
                      </button>
                    ))}
                    <span className="property-conditional-tools-label">Оператор:</span>
                    {COMPARISON_OPERATORS.map(op => (
                      <button
                        key={op.value}
                        className="btn btn-sm btn-op"
                        onClick={() => insertOperator(key, value, idx, op)}
                        title={`Вставить ${op.label}`}
                      >
                        {op.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => handleAddCondition(key, value)}
              >
                + Добавить условие
              </button>
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
        <div className="custom-property-add-actions">
          <button className="btn btn-secondary" onClick={handleAdd}>
            Добавить
          </button>
          <button className="btn btn-secondary" onClick={handleAddConditional}>
            + Условное свойство
          </button>
        </div>
      </div>
    </div>
  );
}

export default CustomProperties;