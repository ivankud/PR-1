import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ElementPalette from './ElementPalette';
import FormCanvas from './FormCanvas';
import PropertiesPanel from './PropertiesPanel';
import JsonEditor from './JsonEditor';
import ElementTree from './ElementTree';
import FormRenderer from '../form-renderer/FormRenderer';
import { useFormBuilder } from '../../hooks/useFormBuilder';

/**
 * Главный компонент конструктора форм.
 * Трёхколоночный макет: палитра/дерево | холст | свойства.
 * Поддерживает режим предпросмотра и редактирование JSON.
 */
function FormBuilder() {
  const navigate = useNavigate();
  const [showJsonEditor, setShowJsonEditor] = useState(false);
  const [showFormEvents, setShowFormEvents] = useState(false);
  const [leftTab, setLeftTab] = useState('elements');

  const {
    form,
    selectedElement,
    selectedElementId,
    previewMode,
    setSelectedElementId,
    addElement,
    updateElement,
    updateElementCss,
    updateElementPosition,
    updateElementSize,
    updateElementEvent,
    updateFormEvent,
    removeElement,
    moveElement,
    updateFormName,
    updateCanvasSettings,
    loadFormFromJson,
    createNewForm,
    togglePreview,
  } = useFormBuilder();

  const isContainerSelected = selectedElement?.type === 'container';

  // Обработчик ошибок выполнения действий в предпросмотре
  const handleActionError = (error) => {
    console.error('Ошибка действия:', error);
  };

  // Обработчик добавления элемента: в контейнер или на холст
  const handleAddElement = (type) => {
    const parentId = isContainerSelected ? selectedElementId : null;
    addElement(type, parentId);
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
          {/* Видимая страница в предпросмотре (без невидимой рабочей области) */}
          <div
            className="preview-page"
            style={{
              width: form.canvas?.width || 800,
              minHeight: form.canvas?.height || 600,
            }}
          >
            <FormRenderer form={form} navigate={navigate} onError={handleActionError} />
          </div>
        </div>
      ) : (
        /* Режим редактирования: три колонки */
        <div className="builder-layout">
          <div className="builder-column palette-column">
            <div className="left-panel-tabs">
              <button
                className={`left-panel-tab ${leftTab === 'elements' ? 'active' : ''}`}
                onClick={() => setLeftTab('elements')}
              >
                Элементы
              </button>
              <button
                className={`left-panel-tab ${leftTab === 'tree' ? 'active' : ''}`}
                onClick={() => setLeftTab('tree')}
              >
                Дерево
              </button>
            </div>

            {leftTab === 'elements' ? (
              <ElementPalette
                onAddElement={handleAddElement}
                selectedElement={selectedElement}
                isContainerSelected={isContainerSelected}
              />
            ) : (
              <div className="palette">
                <h3 className="palette-title">Дерево элементов</h3>
                <ElementTree
                  form={form}
                  selectedElementId={selectedElementId}
                  onSelectElement={setSelectedElementId}
                  onRemoveElement={removeElement}
                />
              </div>
            )}
          </div>

          <div className="builder-column canvas-column">
            <FormCanvas
              form={form}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onRemoveElement={removeElement}
              onMoveElement={moveElement}
              onUpdateElementPosition={updateElementPosition}
              onUpdateElementSize={updateElementSize}
              onAddElement={handleAddElement}
              onUpdateCanvasSettings={updateCanvasSettings}
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
              onUpdateElementCss={updateElementCss}
              onUpdateElementEvent={updateElementEvent}
              onUpdateElementPosition={updateElementPosition}
              onUpdateElementSize={updateElementSize}
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