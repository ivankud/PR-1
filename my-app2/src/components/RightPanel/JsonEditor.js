// Редактор JSON/JSON5 данных примитива
import React, { useState, useEffect } from 'react';
import JSON5 from 'json5';
import { useEditor } from '../../state/EditorContext';

function JsonEditor({ primitive }) {
  const { dispatch } = useEditor();
  const [jsonText, setJsonText] = useState('');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Синхронизация при смене примитива
  useEffect(() => {
    setJsonText(JSON5.stringify(primitive, null, 2));
    setError(null);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primitive.id]);

  const handleChange = (e) => {
    setJsonText(e.target.value);
    setIsEditing(true);
    setError(null);
  };

  const handleApply = () => {
    try {
      const parsed = JSON5.parse(jsonText);
      if (!parsed.id) {
        setError('JSON должен содержать поле id');
        return;
      }
      dispatch({ type: 'UPDATE_JSON', id: primitive.id, json: parsed });
      setError(null);
      setIsEditing(false);
    } catch (e) {
      setError('Ошибка парсинга JSON5: ' + e.message);
    }
  };

  const handleReset = () => {
    setJsonText(JSON5.stringify(primitive, null, 2));
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="json-editor">
      <div className="properties-section-title">JSON данных (JSON5, поддерживает комментарии)</div>
      <textarea
        className="json-textarea"
        value={jsonText}
        onChange={handleChange}
        rows={15}
        spellCheck={false}
      />
      {error && <div className="json-error">{error}</div>}
      <div className="json-actions">
        <button
          className="btn btn-primary"
          onClick={handleApply}
          disabled={!isEditing}
        >
          Применить
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleReset}
          disabled={!isEditing}
        >
          Сбросить
        </button>
      </div>
    </div>
  );
}

export default JsonEditor;