// Панель действий с примитивами
import React from 'react';
import { useEditor } from '../state/EditorContext';
import { downloadJson, downloadTextFile, findPrimitive } from '../utils/jsonUtils';
import { bakeForm } from '../utils/baker';

function ActionBar({ onBack, onPreview }) {
  const { state, dispatch } = useEditor();
  const { form, primitives, selectedIds, historyIndex, history, isDirty } = state;

  const hasSelection = selectedIds.length > 0;
  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  // Проверка: выбран ли единственный контейнер, содержащий дочерние примитивы.
  // В этом случае выравнивание/распределение применяется к его детям.
  const selectedSingleContainer = (() => {
    if (selectedIds.length !== 1 || !form) return null;
    const prim = findPrimitive(form, selectedIds[0]);
    if (!prim) return null;
    const template = primitives.find(p => p.type === prim.type);
    const isContainer = template?.isContainer || (prim.children && prim.children.length > 0);
    if (!isContainer || !prim.children || prim.children.length === 0) return null;
    return prim;
  })();

  // Кнопки выравнивания доступны:
  // - при выборе 2+ примитивов;
  // - при выборе одного контейнера с дочерними примитивами (применяется к детям).
  const canAlign = hasSelection && (
    selectedIds.length >= 2 ||
    !!selectedSingleContainer ||
    (selectedSingleContainer && selectedSingleContainer.children.length >= 2)
  );

  // Кнопки распределения доступны:
  // - при выборе 3+ примитивов;
  // - при выборе одного контейнера с 3+ дочерними примитивами.
  const canDistribute = hasSelection && (
    selectedIds.length >= 3 ||
    (!!selectedSingleContainer && selectedSingleContainer.children.length >= 3)
  );

  const handleSave = () => {
    if (!form) return;
    const filename = `${form.id || 'form'}.json`;
    downloadJson(form, filename);
    dispatch({ type: 'SET_DIRTY', isDirty: false });
  };

  // Запекание формы в пару исходных файлов (BakedForm + рантайм)
  const handleBake = () => {
    if (!form) return;
    try {
      const baked = bakeForm(form, { primitives });
      downloadTextFile(baked.file1, `${baked.name}.jsx`, 'text/javascript');
      downloadTextFile(baked.file2, `${baked.runtimeName}.js`, 'text/javascript');
    } catch (e) {
      console.error('Ошибка запекания формы:', e);
      alert('Не удалось «запечь» форму: ' + e.message);
    }
  };

  const handleGroup = () => {
    dispatch({ type: 'GROUP' });
  };

  const handleUngroup = () => {
    dispatch({ type: 'UNGROUP' });
  };

  const handleMoveBackward = () => {
    dispatch({ type: 'MOVE_BACKWARD' });
  };

  const handleMoveForward = () => {
    dispatch({ type: 'MOVE_FORWARD' });
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
        <button className="btn btn-icon" onClick={() => handleAlign('left')} title="По левому краю" disabled={!canAlign}>⇤</button>
        <button className="btn btn-icon" onClick={() => handleAlign('center-h')} title="По центру по горизонтали" disabled={!canAlign}>⇔</button>
        <button className="btn btn-icon" onClick={() => handleAlign('right')} title="По правому краю" disabled={!canAlign}>⇥</button>
        <button className="btn btn-icon" onClick={() => handleAlign('top')} title="По верхнему краю" disabled={!canAlign}>⇧</button>
        <button className="btn btn-icon" onClick={() => handleAlign('center-v')} title="По центру по вертикали" disabled={!canAlign}>⇕</button>
        <button className="btn btn-icon" onClick={() => handleAlign('bottom')} title="По нижнему краю" disabled={!canAlign}>⇩</button>
      </div>

      <div className="action-bar-group">
        <span className="action-bar-label">Распределить:</span>
        <button className="btn btn-icon" onClick={() => handleDistribute('horizontal')} title="По горизонтали" disabled={!canDistribute}>↔</button>
        <button className="btn btn-icon" onClick={() => handleDistribute('vertical')} title="По вертикали" disabled={!canDistribute}>↕</button>
      </div>

      <div className="action-bar-group">
        <span className="action-bar-label">Слой:</span>
        <button className="btn btn-icon" onClick={handleMoveBackward} title="На одну позицию назад (вглубь слоя)" disabled={!hasSelection || selectedIds.length !== 1}>⤒</button>
        <button className="btn btn-icon" onClick={handleMoveForward} title="На одну позицию вперёд (наверх слоя)" disabled={!hasSelection || selectedIds.length !== 1}>⤓</button>
      </div>

      <div className="action-bar-group">
        <button className="btn btn-icon" onClick={handleZoomOut} title="Уменьшить">−</button>
        <span className="zoom-value">{Math.round(state.zoom * 100)}%</span>
        <button className="btn btn-icon" onClick={handleZoomIn} title="Увеличить">+</button>
      </div>

      <div className="action-bar-right">
        <button
          className="btn btn-secondary"
          onClick={onPreview}
          disabled={!form}
          title="Открыть форму как отдельную страницу"
        >
          👁 Предпросмотр
        </button>
        <button
          className="btn btn-secondary"
          onClick={handleBake}
          disabled={!form}
          title="Сгенерировать пару исходных файлов (компонент формы + рантайм)"
        >
          🥖 Запечь
        </button>
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