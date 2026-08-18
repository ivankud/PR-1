// Компонент FilterSelect — опциональный элемент для примитива AGTable.
// Представляет собой строку с множественным выбором. При нажатии раскрывается
// выпадающая часть, где настраиваются доступные фильтры: галочка (вкл/выкл),
// оператор и значение. Доступные фильтры задаются моделью фильтров (filterModel).
// При закрытии выпадающей части заданные фильтры отображаются как плашки с
// наименованием, кратким обозначением оператора, значением и крестиком для
// быстрого отключения фильтра.
import React, { useState, useRef, useEffect } from 'react';
import {
  getOperatorsForFilter,
  getOperatorLabel,
  getOperatorName
} from '../utils/filterUtils';

function FilterSelect({ filterModel = [], value = {}, onChange }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Состояние активных фильтров: { [field]: { operator, value, disabled } }
  const [activeFilters, setActiveFilters] = useState(() => {
    const initialState = {};
    for (const f of filterModel) {
      const prev = value[f.field];
      initialState[f.field] = {
        operator: prev?.operator || (getOperatorsForFilter(f)[0] || 'equal'),
        value: prev?.value !== undefined ? prev.value : '',
        // По умолчанию фильтр отключён (disabled: true).
        // Пользователь включает его галочкой в выпадающей части.
        disabled: prev?.disabled !== undefined ? prev.disabled : true
      };
    }
    return initialState;
  });

  // Закрытие выпадающей части при клике вне
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Обновление фильтра
  const updateFilter = (field, patch) => {
    setActiveFilters(prev => {
      const next = {
        ...prev,
        [field]: { ...prev[field], ...patch }
      };
      if (onChange) onChange(next);
      return next;
    });
  };

  // Быстрое отключение фильтра через крестик на плашке
  const disableFilter = (field) => {
    updateFilter(field, { disabled: true });
  };

  // Только включённые фильтры (для отображения плашек)
  const activeFilterItems = filterModel.filter(f => {
    const state = activeFilters[f.field];
    return state && !state.disabled;
  });

  // Формирование отображаемого значения фильтра в плашке
  const formatFilterValue = (f, state) => {
    const op = state?.operator;
    const val = state?.value;
    if (!val) return '';
    if (op === 'between') {
      const parts = Array.isArray(val)
        ? val
        : String(val).split(',').map(s => s.trim());
      const from = parts[0] || '';
      const to = parts[1] || '';
      if (!from && !to) return '';
      return (from ? String(from) : '?') + ' - ' + (to ? String(to) : '?');
    }
    if (op === 'in' || op === 'notin') {
      const list = Array.isArray(val)
        ? val.join(', ')
        : String(val).split(',').map(s => s.trim()).filter(Boolean).join(', ');
      return list;
    }
    return String(val);
  };

  // Преобразование массива в строку для in/notin
  const arrayValueToString = (val) => {
    if (Array.isArray(val)) return val.join(', ');
    return val || '';
  };

  // Рендер значения в зависимости от типа оператора
  const renderValueInput = (f, state) => {
    const op = state?.operator;
    const isBetween = op === 'between';
    const isList = op === 'in' || op === 'notin';

    if (isBetween) {
      const parts = Array.isArray(state.value)
        ? state.value
        : String(state.value || '').split(',');
      const from = parts[0] || '';
      const to = parts[1] || '';
      return (
        <div className="filter-row-values">
          <input
            type="text"
            className="filter-value-input"
            placeholder="от"
            value={from}
            onChange={(e) => {
              const val = e.target.value;
              updateFilter(f.field, { value: `${val},${to}` });
            }}
          />
          <span className="filter-between-sep">—</span>
          <input
            type="text"
            className="filter-value-input"
            placeholder="до"
            value={to}
            onChange={(e) => {
              const val = e.target.value;
              updateFilter(f.field, { value: `${from},${val}` });
            }}
          />
        </div>
      );
    }

    if (isList) {
      return (
        <input
          type="text"
          className="filter-value-input"
          placeholder="значения через запятую"
          value={arrayValueToString(state.value)}
          onChange={(e) => updateFilter(f.field, { value: e.target.value })}
        />
      );
    }

    return (
      <input
        type="text"
        className="filter-value-input"
        placeholder="значение"
        value={state.value || ''}
        onChange={(e) => updateFilter(f.field, { value: e.target.value })}
      />
    );
  };

  return (
    <div className="filter-select" ref={containerRef}>
      {/* Строка-мультиселект с плашками */}
      <div
        className="filter-select-trigger"
        onClick={() => setOpen(!open)}
        title="Настроить фильтры"
      >
        {activeFilterItems.length === 0 ? (
          <span className="filter-select-placeholder">Фильтры не заданы</span>
        ) : (
          <div className="filter-select-chips">
            {activeFilterItems.map(f => {
              const state = activeFilters[f.field];
              return (
                <span
                  key={f.field}
                  className="filter-chip"
                  title={`${f.headerName || f.field}: ${getOperatorLabel(state?.operator)} ${formatFilterValue(f, state)}`}
                >
                  <span className="filter-chip-name">{f.headerName || f.field}</span>
                  <span className="filter-chip-op">{getOperatorLabel(state?.operator)}</span>
                  {formatFilterValue(f, state) && (
                    <span className="filter-chip-value">{formatFilterValue(f, state)}</span>
                  )}
                  <span
                    className="filter-chip-remove"
                    title="Отключить фильтр"
                    onClick={(e) => {
                      e.stopPropagation();
                      disableFilter(f.field);
                    }}
                  >
                    ✕
                  </span>
                </span>
              );
            })}
          </div>
        )}
        <span className="filter-select-caret">{open ? '▲' : '▼'}</span>
      </div>

      {/* Выпадающая часть с настройкой фильтров */}
      {open && (
        <div className="filter-select-dropdown">
          {filterModel.length === 0 && (
            <div className="filter-dropdown-empty">
              Модель фильтров не задана. Добавьте свойство "Модель фильтров" (filterModel).
            </div>
          )}
          {filterModel.map(f => {
            const state = activeFilters[f.field];
            if (!state) return null;
            const operators = getOperatorsForFilter(f);
            return (
              <div key={f.field} className={`filter-item ${state.disabled ? 'disabled' : ''}`}>
                {/* Галочка включения/отключения */}
                <label className="filter-item-check">
                  <input
                    type="checkbox"
                    checked={!state.disabled}
                    onChange={(e) => updateFilter(f.field, { disabled: !e.target.checked })}
                  />
                </label>

                {/* Надпись фильтра (слева) */}
                <span className="filter-item-name" title={f.field}>
                  {f.headerName || f.field}
                </span>

                {/* Оператор */}
                <select
                  className="filter-item-op"
                  value={state.operator || ''}
                  disabled={state.disabled}
                  onChange={(e) => updateFilter(f.field, { operator: e.target.value })}
                  title={`Оператор (${getOperatorName(state.operator)})`}
                >
                  {operators.map(op => (
                    <option key={op} value={op}>{getOperatorName(op)}</option>
                  ))}
                </select>

                {/* Значение */}
                <div className="filter-item-value">
                  {renderValueInput(f, state)}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FilterSelect;