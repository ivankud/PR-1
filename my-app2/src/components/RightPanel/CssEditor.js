// Редактор CSS стилей примитива
import React, { useState, useEffect } from 'react';
import { useEditor } from '../../state/EditorContext';
import { cssObjectToString, cssStringToObject } from '../../utils/jsonUtils';

function CssEditor({ primitive }) {
  const { dispatch } = useEditor();
  const [cssText, setCssText] = useState('');
  const [error, setError] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Синхронизация при смене примитива
  useEffect(() => {
    setCssText(cssObjectToString(primitive.style || {}));
    setError(null);
    setIsEditing(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [primitive.id]);

  const handleChange = (e) => {
    setCssText(e.target.value);
    setIsEditing(true);
    setError(null);
  };

  const handleApply = () => {
    try {
      const styleObj = cssStringToObject(cssText);
      dispatch({ type: 'UPDATE_STYLE', id: primitive.id, style: styleObj });
      setError(null);
      setIsEditing(false);
    } catch (e) {
      setError('Ошибка парсинга CSS: ' + e.message);
    }
  };

  const handleReset = () => {
    setCssText(cssObjectToString(primitive.style || {}));
    setError(null);
    setIsEditing(false);
  };

  return (
    <div className="css-editor">
      <div className="properties-section-title">CSS стиль</div>
      <textarea
        className="css-textarea"
        value={cssText}
        onChange={handleChange}
        rows={10}
        spellCheck={false}
        placeholder="color: #333333;
font-size: 14px;"
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

export default CssEditor;