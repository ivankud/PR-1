import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElementPalette from './ElementPalette';
import FormCanvas from './FormCanvas';
import PropertiesPanel from './PropertiesPanel';
import JsonEditor from './JsonEditor';
import FormRenderer from '../form-renderer/FormRenderer';
import { useFormBuilder } from '../../hooks/useFormBuilder';

/**
 * Главный компонент конструктора форм.
 * Трёхколоночный макет: палитра | холст | свойства.
 * Поддерживает режим предпросмотра и редактирование JSON.
 */
function FormBuilder() {
  const navigate = useNavigate();
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [showFormEvents, setShowFormEvents] = useState(false);

  const {
    form,
    selectedElement,
    selectedElementId,
    previewMode,
    setSelectedElementId,
    addElement,
    updateElement,
    updateElementEvent,
    updateFormEvent,
    removeElement,
    moveElement,
    updateFormName,
    loadFormFromJson,
    createNewForm,
    togglePreview,
  } = useFormBuilder();

  // Обработчик ошибок выполнения действий в предпросмотре
  const handleActionError = (error) => {
    console.error('Ошибка действия:', error);
  };

  return (
    <div className="form-builder">
      {/* Верхняя панель инструментов */}
      <div className="builder-toolbar">
        <input
          type="text"
          className="builder-form-name"
          value={form.name || ''}
          onChange={(e) => updateFormName(e.target.value)}
          placeholder="Название формы"
        />

        <div className="builder-toolbar-actions">
          <button
            className={`builder-btn ${previewMode ? 'active' : ''}`}
            onClick={togglePreview}
            title={previewMode ? 'Вернуться к редактированию' : 'Предпросмотр формы'}
          >
            {previewMode ? '✏️ Редактировать' : '👁️ Предпросмотр'}
          </button>
          <button
            className="builder-btn"
            onClick={() => setShowJsonEditor(true)}
            title="Просмотр и редактирование JSON"
          >
            {'{ }'} JSON
          </button>
          <button
            className="builder-btn"
            onClick={createNewForm}
            title="Создать новую форму"
          >
            ➕ Новая
          </button>
        </div>
      </div>

      {/* Режим предпросмотра */}
      {previewMode ? (
        <div className="builder-preview">
          <div className="builder-preview-header">
            <h2>{form.name || 'Форма'}</h2>
            <p className="builder-preview-hint">
              Взаимодействуйте с формой — код действий выполняется
            </p>
          </div>
          <FormRenderer form={form} navigate={navigate} onError={handleActionError} />
        </div>
      ) : (
        /* Режим редактирования: три колонки */
        <div className="builder-layout">
          <div className="builder-column palette-column">
            <ElementPalette onAddElement={addElement} />
          </div>

          <div className="builder-column canvas-column">
            <FormCanvas
              form={form}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onRemoveElement={removeElement}
              onMoveElement={moveElement}
            />

            {/* События формы */}
            <div className="form-events-section">
              <button
                className="form-events-toggle"
                onClick={() => setShowFormEvents((prev) => !prev)}
              >
                ⚡ События формы {showFormEvents ? '▾' : '▸'}
              </button>
              {showFormEvents && (
                <div className="form-events-content">
                  <div className="form-events-header">
                    <span className="form-events-title">onSubmit — отправка формы</span>
                  </div>
                  <textarea
                    className="code-editor-textarea"
                    value={form.events?.onSubmit || ''}
                    onChange={(e) => updateFormEvent('onSubmit', e.target.value)}
                    placeholder={`// Код для события onSubmit\n// Выполнится при отправке формы\n// context.formData - значения полей`}
                    spellCheck={false}
                    rows={6}
                  />
                  <p className="form-events-hint">
                    Кнопка "Отправить" появится в предпросмотре, если задан код onSubmit
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="builder-column properties-column">
            <PropertiesPanel
              element={selectedElement}
              onUpdateElement={updateElement}
              onUpdateElementEvent={updateElementEvent}
            />
          </div>
        </div>
      )}

      {/* Модальное окно JSON-редактора */}
      {showJsonEditor && (
        <JsonEditor
          form={form}
          onLoadForm={loadFormFromJson}
          onClose={() => setShowJsonEditor(false)}
        />
      )}
    </div>
  );
}

export default FormBuilder;