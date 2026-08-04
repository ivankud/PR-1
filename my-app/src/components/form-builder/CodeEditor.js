import React, { useState } from 'react';
import { validateCodeSyntax } from '../../utils/actionRunner';

/**
 * Редактор JavaScript-кода для событий элементов.
 * Включает проверку синтаксиса и подсказки по доступному контексту.
 */
function CodeEditor({ value, onChange, placeholder }) {
  const [syntaxResult, setSyntaxResult] = useState(null);

  const handleCheckSyntax = () => {
    const result = validateCodeSyntax(value);
    setSyntaxResult(result);
  };

  const handleChange = (e) => {
    onChange(e.target.value);
    setSyntaxResult(null);
  };

  return (
    <div className="code-editor">
      <div className="code-editor-toolbar">
        <span className="code-editor-label">JavaScript</span>
        <button
          className="code-editor-check-btn"
          onClick={handleCheckSyntax}
          title="Проверить синтаксис"
        >
          Проверить синтаксис
        </button>
      </div>

      <textarea
        className="code-editor-textarea"
        value={value || ''}
        onChange={handleChange}
        placeholder={
          placeholder ||
          '// Введите JavaScript-код\n// Доступен контекст: context\n// context.formData - значения полей\n// context.setValue(name, value)\n// context.getValue(name)\n// context.alert(msg)\n// context.log(...args)\n// event - объект события'
        }
        spellCheck={false}
        rows={10}
      />

      {syntaxResult && (
        <div
          className={`code-editor-result ${
            syntaxResult.valid ? 'valid' : 'invalid'
          }`}
        >
          {syntaxResult.valid
            ? '✓ Синтаксис корректен'
            : `✗ Ошибка: ${syntaxResult.error}`}
        </div>
      )}

      <div className="code-editor-hint">
        <details>
          <summary>Доступный контекст</summary>
          <pre className="code-editor-context">
{`// Контекст выполнения (context):
context.formData      // объект со значениями всех полей
context.element       // текущий элемент формы
context.form          // вся конфигурация формы
context.setFormData   // функция обновления значений
context.getValue(name) // получить значение поля
context.setValue(name, value) // установить значение поля
context.alert(msg)    // показать alert
context.log(...args)  // вывод в консоль
event                 // объект события браузера`}
          </pre>
        </details>
      </div>
    </div>
  );
}

export default CodeEditor;