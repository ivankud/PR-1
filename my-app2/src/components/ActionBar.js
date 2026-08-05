// Панель действий с примитивами
import React from 'react';
import { useEditor } from '../state/EditorContext';
import { downloadJson } from '../utils/jsonUtils';

function ActionBar({ onBack }) {
  const { state, dispatch } = useEditor();
  const { form, selectedIds, historyIndex, history, isDirty } = state;

  const hasSelection = selectedIds.length > 0;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  const handleSave = () => {
    if (!form) return;
    const filename = `${form.id || 'form'}.json`;
    downloadJson(form, filename);
    dispatch({ type: 'SET_DIRTY', isDirty: false });
  };

  const handleGroup = () => {
    dispatch({ type: 'GROUP' });
  };

  const handleUngroup = () => {
    dispatch({ type: 'UNGROUP' });
  };

  const handleAlign = (align) => {
    dispatch({ type: 'ALIGN', align });
  };

  const handleDistribute = (direction) => {
    dispatch({ type: 'DISTRIBUTE', direction });
  };

  const handleDelete = () => {
    dispatch({ type: 'DELETE_SELECTED' });
  };

  const handleUndo = () => {
    dispatch({ type: 'UNDO' });
  };

  const handleRedo = () => {
    dispatch({ type: 'REDO' });
  };

  const handleZoomIn = () => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom + 0.1 });
  };

  const handleZoomOut = () => {
    dispatch({ type: 'SET_ZOOM', zoom: state.zoom - 0.1 });
  };

  return (
    <div className="action-bar">
      <div className="action-bar-left">
        <button className="btn btn-secondary" onClick={onBack} title="Назад к списку форм">
          ← Меню
        </button>
        <span className="action-bar-form-name">
          {form ? form.name : 'Нет формы'}
          {isDirty && <span className="dirty-indicator"> •</span>}
        </span>
      </div>

      <div className="action-bar-group">
        <button
          className="btn btn-secondary"
          onClick={handleUndo}
          disabled={!canUndo}
          title="Отменить (Ctrl+Z)"
        >
          ↩ Отменить
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleRedo}
          disabled={!canRedo}
          title="Повторить (Ctrl+Y)"
        >
          ↪ Повторить
        </button>
      </div>

      <div className="action-bar-group">
        <button
          className="btn btn-secondary"
          onClick={handleGroup}
          disabled={!hasSelection || selectedIds.length < 2}
          title="Сгруппировать выбранные"
        >
          📦 Группировать
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleUngroup}
          disabled={!hasSelection}
          title="Разгруппировать"
        >
          📂 Разгруппировать
        </button>
      </div>

      <div className="action-bar-group">
        <span className="action-bar-label">Выравнивание:</span>
        <button className="btn btn-icon" onClick={() => handleAlign('left')} title="По левому краю" disabled={!hasSelection || selectedIds.length < 2}>⇤</button>
        <button className="btn btn-icon" onClick={() => handleAlign('center-h')} title="По центру по горизонтали" disabled={!hasSelection || selectedIds.length < 2}>⇔</button>
        <button className="btn btn-icon" onClick={() => handleAlign('right')} title="По правому краю" disabled={!hasSelection || selectedIds.length < 2}>⇥</button>
        <button className="btn btn-icon" onClick={() => handleAlign('top')} title="По верхнему краю" disabled={!hasSelection || selectedIds.length < 2}>⇧</button>
        <button className="btn btn-icon" onClick={() => handleAlign('center-v')} title="По центру по вертикали" disabled={!hasSelection || selectedIds.length < 2}>⇕</button>
        <button className="btn btn-icon" onClick={() => handleAlign('bottom')} title="По нижнему краю" disabled={!hasSelection || selectedIds.length < 2}>⇩</button>
      </div>

      <div className="action-bar-group">
        <span className="action-bar-label">Распределить:</span>
        <button className="btn btn-icon" onClick={() => handleDistribute('horizontal')} title="По горизонтали" disabled={!hasSelection || selectedIds.length < 3}>↔</button>
        <button className="btn btn-icon" onClick={() => handleDistribute('vertical')} title="По вертикали" disabled={!hasSelection || selectedIds.length < 3}>↕</button>
      </div>

      <div className="action-bar-group">
        <button className="btn btn-icon" onClick={handleZoomOut} title="Уменьшить">−</button>
        <span className="zoom-value">{Math.round(state.zoom * 100)}%</span>
        <button className="btn btn-icon" onClick={handleZoomIn} title="Увеличить">+</button>
      </div>

      <div className="action-bar-right">
        <button
          className="btn btn-danger"
          onClick={handleDelete}
          disabled={!hasSelection}
          title="Удалить выбранные (Delete)"
        >
          🗑 Удалить
        </button>
        <button className="btn btn-primary" onClick={handleSave} disabled={!form} title="Скачать JSON формы">
          💾 Сохранить
        </button>
      </div>
    </div>
  );
}

export default ActionBar;