// Модальное диалоговое окно для редактирования JSON-свойства
import React, { useState, useEffect } from 'react';

function JsonDialog({ title, value, onSave, onClose }) {
  const [text, setText] = useState('');
  const [error, setError] = useState(null);

  // Синхронизация при открытии
  useEffect(() => {
    setText(typeof value === 'string' ? value : JSON.stringify(value, null, 2));
    setError(null);
  }, [value]);

  const handleSave = () => {
    try {
      JSON.parse(text);
      onSave(text);
      onClose();
    } catch (e) {
      setError('Ошибка парсинга JSON: ' + e.message);
    }
  };

  return (
    <div className="json-dialog-overlay" onClick={onClose}>
      <div className="json-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="json-dialog-header">
          <span className="json-dialog-title">{title}</span>
          <button className="json-dialog-close" onClick={onClose} title="Закрыть">✕</button>
        </div>
        <textarea
          className="json-textarea json-dialog-textarea"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          rows={15}
          spellCheck={false}
          autoFocus
        />
        {error && <div className="json-error">{error}</div>}
        <div className="json-dialog-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Сохранить
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}

export default JsonDialog;