// Вкладка с пользовательскими функциями формы
import React, { useState, useRef } from 'react';
import { useEditor } from '../../state/EditorContext';
import { generateId } from '../../utils/jsonUtils';
import { getIconById, IconSvg } from '../../utils/iconLibrary';

// Передвигаемое немодальное диалоговое окно редактирования функции.
// Не блокирует остальной интерфейс, можно перетаскивать за заголовок.
function FunctionDialog({ func, isNew, onSave, onClose, onDelete }) {
  const [name, setName] = useState(func?.name || '');
  const [description, setDescription] = useState(func?.description || '');
  const [code, setCode] = useState(func?.code || '');
  const [position, setPosition] = useState({ left: 300, top: 120 });
  const dragRef = useRef(null);

  // Начало перетаскивания окна за заголовок
  const handleHeaderMouseDown = (e) => {
    if (e.button !== 0) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      origLeft: position.left,
      origTop: position.top
    };
    const handleMove = (ev) => {
      if (!dragRef.current) return;
      setPosition({
        left: dragRef.current.origLeft + (ev.clientX - dragRef.current.startX),
        top: dragRef.current.origTop + (ev.clientY - dragRef.current.startY)
      });
    };
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

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
    <div className="function-dialog" style={{ left: position.left, top: position.top }}>
      <div
        className="function-dialog-header"
        onMouseDown={handleHeaderMouseDown}
        title="Перетащите, чтобы переместить"
      >
        <span className="function-dialog-title">
          {isNew ? 'Новая функция' : `Редактирование: ${func.name}`}
        </span>
        <button className="function-dialog-close" onClick={onClose} title="Закрыть">✕</button>
      </div>
      <div className="function-dialog-body">
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
        <div className="function-dialog-actions">
          <button className="btn btn-primary" onClick={handleSave} disabled={!name.trim()}>
            Сохранить
          </button>
          <button className="btn btn-secondary" onClick={onClose}>
            Отмена
          </button>
          {!isNew && (
            <button className="btn btn-danger" onClick={() => onDelete(func)}>
              Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function FunctionsTab() {
  const { state, dispatch } = useEditor();
  const { form } = state;
  // Редактируемая функция. null — ничего не открыто, 'new' — создание новой, объект — редактирование.
  const [editingFunc, setEditingFunc] = useState(null);
  // id раскрытой функции (для показа описания и кода)
  const [expandedId, setExpandedId] = useState(null);

  const functions = form?.functions || [];

  const handleAdd = () => {
    setEditingFunc('new');
  };

  const handleEdit = (id) => {
    const func = functions.find(fn => fn.id === id);
    if (func) setEditingFunc(func);
  };

  const handleSave = (func) => {
    if (editingFunc === 'new') {
      dispatch({ type: 'ADD_FUNCTION', func });
    } else {
      dispatch({ type: 'UPDATE_FUNCTION', func });
    }
    setEditingFunc(null);
  };

  const handleClose = () => {
    setEditingFunc(null);
  };

  const handleDelete = (func) => {
    if (!window.confirm(`Удалить функцию "${func.name}"?`)) return;
    dispatch({ type: 'DELETE_FUNCTION', id: func.id });
    setEditingFunc(null);
  };

  const handleCopy = (func) => {
    const newName = `${func.name}-copy`;
    const exists = functions.some(fn => fn.name === newName);
    if (exists) {
      alert(`Функция с именем "${newName}" уже существует`);
      return;
    }
    dispatch({ type: 'COPY_FUNCTION', id: func.id });
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
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
      <button className="btn btn-primary btn-block" onClick={handleAdd}>
        ➕ Добавить функцию
      </button>

      {/* Список функций */}
      {functions.length === 0 && (
        <div className="layers-empty">Нет определённых функций</div>
      )}

      {functions.map(func => {
        const isExpanded = expandedId === func.id;
        return (
          <div key={func.id} className="function-item">
            <div className="function-item-view">
              <div className="function-item-header">
                <button
                  className="function-item-toggle"
                  onClick={() => toggleExpand(func.id)}
                  title={isExpanded ? 'Скрыть описание и код' : 'Показать описание и код'}
                >
                  <span className={`function-item-caret ${isExpanded ? 'open' : ''}`}>▶</span>
                  <span className="function-item-name">⚙️ {func.name}</span>
                </button>
                <div className="function-item-actions">
                  <button
                    className="btn btn-sm"
                    onClick={() => handleEdit(func.id)}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    className="btn btn-sm"
                    onClick={() => handleCopy(func)}
                    title="Копия"
                  >
                    <IconSvg icon={getIconById('copy')} size={14} />
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
              {/* Раскрываемая часть: описание и код (по умолчанию скрыта) */}
              {isExpanded && (
                <div className="function-item-details">
                  {func.description && (
                    <div className="function-item-desc">{func.description}</div>
                  )}
                  <pre className="function-item-code">{func.code}</pre>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Диалоговое окно редактирования/создания функции */}
      {editingFunc !== null && (
        <FunctionDialog
          func={editingFunc === 'new' ? null : editingFunc}
          isNew={editingFunc === 'new'}
          onSave={handleSave}
          onClose={handleClose}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

export default FunctionsTab;