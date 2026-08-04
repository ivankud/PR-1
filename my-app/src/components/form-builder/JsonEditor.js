import React, { useState, useEffect } from 'react';
import { validateFormSchema } from '../../utils/formSchema';

/**
 * Редактор JSON-схемы формы.
 * Позволяет просматривать и редактировать конфигурацию формы вручную.
 */
function JsonEditor({ form, onLoadForm, onClose }) {
  const [jsonText, setJsonText] = useState('');
  const [validation, setValidation] = useState(null);

  // Инициализация текста при открытии
  useEffect(() => {
    setJsonText(JSON.stringify(form, null, 2));
  }, [form]);

  const handleChange = (e) => {
    setJsonText(e.target.value);
    setValidation(null);
  };

  const handleValidate = () => {
    const result = validateFormSchema(jsonText);
    setValidation(result);
  };

  const handleApply = () => {
    const result = validateFormSchema(jsonText);
    setValidation(result);
    if (result.valid) {
      onLoadForm(result.data);
    }
  };

  return (
    <div className="json-editor-overlay">
      <div className="json-editor">
        <div className="json-editor-header">
          <h3 className="json-editor-title">JSON-схема формы</h3>
          <button className="json-editor-close" onClick={onClose} title="Закрыть">
            ✕
          </button>
        </div>

        <div className="json-editor-toolbar">
          <button className="json-editor-btn" onClick={handleValidate}>
            Проверить
          </button>
          <button className="json-editor-btn primary" onClick={handleApply}>
            Применить
          </button>
        </div>

        {validation && (
          <div
            className={`json-editor-validation ${
              validation.valid ? 'valid' : 'invalid'
            }`}
          >
            {validation.valid
              ? '✓ Схема корректна'
              : `✗ ${validation.error}`}
          </div>
        )}

        <textarea
          className="json-editor-textarea"
          value={jsonText}
          onChange={handleChange}
          spellCheck={false}
        />

        <div className="json-editor-hint">
          <p>
            Формат: объект с полями <code>id</code>, <code>name</code>,{' '}
            <code>elements</code> (массив) и <code>events</code> (объект).
          </p>
          <p>
            Каждый элемент: <code>id</code>, <code>type</code>, свойства и{' '}
            <code>events</code> (объект с JS-кодом для событий).
          </p>
        </div>
      </div>
    </div>
  );
}

export default JsonEditor;