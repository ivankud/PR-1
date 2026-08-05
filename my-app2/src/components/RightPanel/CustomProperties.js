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
          <label className="property-label">{key}</label>
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
          />
          <button
            className="btn btn-icon btn-remove"
            onClick={() => handleRemove(key)}
            title="Удалить свойство"
          >
            ✕
          </button>
        </div>
      ))}

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