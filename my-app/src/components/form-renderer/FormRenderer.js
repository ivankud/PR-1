import React, { useState, useCallback } from 'react';
import ElementRenderer from './ElementRenderer';
import { runAction, createActionContext } from '../../utils/actionRunner';

/**
 * Рендерит форму из JSON-конфигурации и выполняет код действий
 * при срабатывании событий элементов.
 */
function FormRenderer({ form, navigate, onError }) {
  const [formData, setFormData] = useState({});
  const [error, setError] = useState(null);

  // Обработчик ошибок выполнения действий
  const handleError = useCallback(
    (err) => {
      setError(err.message || String(err));
      if (onError) onError(err);
    },
    [onError]
  );

  // Обработчик события элемента
  const handleElementEvent = useCallback(
    (element, eventName, event) => {
      const code = element.events && element.events[eventName];
      if (!code || !code.trim()) return;

      const context = createActionContext({
        formData,
        setFormData,
        element,
        form,
        navigate,
        onError: handleError,
      });

      runAction(code, context, event);
    },
    [formData, form, navigate, handleError]
  );

  // Обработчик отправки формы
  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      const code = form.events && form.events.onSubmit;
      if (!code || !code.trim()) return;

      const context = createActionContext({
        formData,
        setFormData,
        element: null,
        form,
        navigate,
        onError: handleError,
      });

      runAction(code, context, e);
    },
    [formData, form, navigate, handleError]
  );

  // Обновление значения поля
  const handleValueChange = useCallback((element, value) => {
    setFormData((prev) => ({
      ...prev,
      [element.name]: value,
    }));
  }, []);

  if (!form || !form.elements) {
    return <div className="form-renderer-empty">Форма пуста</div>;
  }

  return (
    <div className="form-renderer">
      {error && (
        <div className="form-renderer-error">
          <strong>Ошибка выполнения действия:</strong> {error}
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {form.elements.map((element) => (
          <div key={element.id} className="form-renderer-field">
            {element.type !== 'button' && element.type !== 'checkbox' && (
              <label className="form-renderer-label">
                {element.label}
                {element.required && <span className="required-mark">*</span>}
              </label>
            )}

            <ElementRenderer
              element={element}
              value={formData[element.name]}
              onChange={(value) => handleValueChange(element, value)}
              onEvent={(eventName, event) =>
                handleElementEvent(element, eventName, event)
              }
            />
          </div>
        ))}

        {form.events && form.events.onSubmit && (
          <div className="form-renderer-submit">
            <button type="submit" className="form-element-button btn-primary">
              Отправить
            </button>
          </div>
        )}
      </form>

      <div className="form-renderer-data">
        <details>
          <summary>Текущие значения формы</summary>
          <pre>{JSON.stringify(formData, null, 2)}</pre>
        </details>
      </div>
    </div>
  );
}

export default FormRenderer;