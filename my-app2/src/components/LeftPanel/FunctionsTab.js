// Вкладка с пользовательскими функциями формы
import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { generateId } from '../../utils/jsonUtils';

// Редактор одной функции
function FunctionEditor({ func, onSave, onCancel, onDelete }) {
  const [name, setName] = useState(func?.name || '');
  const [description, setDescription] = useState(func?.description || '');
  const [code, setCode] = useState(func?.code || '');

  const handleSave = () => {
    if (!name.trim()) return;
    onSave({
      id: func?.id || generateId('fn'),
      name: name.trim(),
      description: description.trim(),
      code
    });
  };

  return (
    <div className="function-editor">
      <div className="property-row">
        <label className="property-label">Имя</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="myFunction"
        />
      </div>
      <div className="property-row property-row-column">
        <label className="property-label">Описание</label>
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Что делает функция"
        />
      </div>
      <div className="property-row property-row-column">
        <label className="property-label">Код</label>
        <textarea
          className="json-textarea function-code"
          rows={8}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          spellCheck={false}
          placeholder={'// Доступен объект context (данные формы)\nreturn context.user?.name;'}
        />
      </div>
      <div className="function-editor-actions">
        <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
          Сохранить
        </button>
        <button className="btn btn-secondary" onClick={onCancel}>
          Отмена
        </button>
        {func && (
          <button className="btn btn-danger" onClick={onDelete}>
            Удалить
          </button>
        )}
      </div>
    </div>
  );
}

function FunctionsTab() {
  const { state, dispatch } = useEditor();
  const { form } = state;
  const [editingId, setEditingId] = useState(null); // null - список, 'new' - создание, id - редактирование

  const functions = form?.functions || [];

  const handleAdd = () => {
    setEditingId('new');
  };

  const handleEdit = (id) => {
    setEditingId(id);
  };

  const handleSave = (func) => {
    if (editingId === 'new') {
      dispatch({ type: 'ADD_FUNCTION', func });
    } else {
      dispatch({ type: 'UPDATE_FUNCTION', func });
    }
    setEditingId(null);
  };

  const handleCancel = () => {
    setEditingId(null);
  };

  const handleDelete = (func) => {
    if (!window.confirm(`Удалить функцию "${func.name}"?`)) return;
    dispatch({ type: 'DELETE_FUNCTION', id: func.id });
    setEditingId(null);
  };

  if (!form) {
    return <div className="layers-empty">Нет формы</div>;
  }

  return (
    <div className="functions-tab">
      <div className="panel-hint">
        Определите свои функции. Они доступны из контекста формы и могут привязываться к событиям.
      </div>

      {/* Кнопка добавления */}
      {editingId !== 'new' && (
        <button className="btn btn-primary btn-block" onClick={handleAdd}>
          ➕ Добавить функцию
        </button>
      )}

      {/* Создание новой */}
      {editingId === 'new' && (
        <FunctionEditor
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      {/* Список функций */}
      {functions.length === 0 && editingId !== 'new' && (
        <div className="layers-empty">Нет определённых функций</div>
      )}

      {functions.map(func => (
        <div key={func.id} className="function-item">
          {editingId === func.id ? (
            <FunctionEditor
              func={func}
              onSave={handleSave}
              onCancel={handleCancel}
              onDelete={() => handleDelete(func)}
            />
          ) : (
            <div className="function-item-view">
              <div className="function-item-header">
                <span className="function-item-name">⚙️ {func.name}</span>
                <div className="function-item-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => handleEdit(func.id)}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm btn-remove"
                    onClick={() => handleDelete(func)}
                    title="Удалить"
                  >
                    ✕
                  </button>
                </div>
              </div>
              {func.description && (
                <div className="function-item-desc">{func.description}</div>
              )}
              <pre className="function-item-code">{func.code}</pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export default FunctionsTab;