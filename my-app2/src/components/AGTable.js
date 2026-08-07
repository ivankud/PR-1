// Компонент AGTable на основе ag-grid-react
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';

// Утилита для безопасного парсинга JSON
function safeParse(json, fallback) {
  if (json === undefined || json === null) return fallback;
  if (typeof json !== 'string') return json;
  try {
    return JSON.parse(json);
  } catch (e) {
    console.warn('AGTable: не удалось распарсить JSON:', e.message);
    return fallback;
  }
}

// Получение значения по пути (например "data.items")
function getValueByPath(obj, path) {
  if (!obj || !path) return obj;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

function AGTable({ primitive, context, onRowClicked, ...restProps }) {
  const gridRef = useRef(null);

  // Свойства примитива (с подстановкой из контекста)
  const props = primitive?.customProperties || {};

  // Резолвим значение: сначала из свойств примитива, затем из контекста
  const resolveValue = (key, fallback) => {
    if (primitive && primitive[key] !== undefined) return primitive[key];
    if (props[key] !== undefined) return props[key];
    if (context && context[key] !== undefined) return context[key];
    return fallback;
  };

  const title = resolveValue('title', 'Таблица');
  const dataSource = resolveValue('dataSource', 'manual');
  const apiUrl = resolveValue('apiUrl', '');
  const apiMethod = resolveValue('apiMethod', 'GET');
  // Мемоизируем apiHeaders, чтобы ссылка на объект была стабильной
  // (иначе useEffect, зависящий от apiHeaders, будет срабатывать каждый рендер → бесконечный цикл)
  const apiHeadersRaw = resolveValue('apiHeaders', '{}');
  const apiHeaders = useMemo(() => safeParse(apiHeadersRaw, {}), [apiHeadersRaw]);
  const apiDataPath = resolveValue('apiDataPath', '');
  const columnDefsRaw = resolveValue('columnDefs', '[{"field":"id","headerName":"ID"},{"field":"name","headerName":"Имя"}]');
  const rowDataRaw = resolveValue('rowData', '[{"id":1,"name":"Иван"},{"id":2,"name":"Пётр"}]');
  const pagination = resolveValue('pagination', true);
  const paginationPageSize = resolveValue('paginationPageSize', 10);
  const sortable = resolveValue('sortable', true);
  const filterable = resolveValue('filterable', true);
  const resizable = resolveValue('resizable', true);
  const selectable = resolveValue('selectable', false);
  const autoHeight = resolveValue('autoHeight', false);

  // Парсим модель колонок и данные
  const columnDefs = useMemo(() => {
    const defs = safeParse(columnDefsRaw, []);
    // Применяем глобальные настройки сортировки/фильтрации/ресайза к колонкам
    return defs.map(col => ({
      ...col,
      sortable: col.sortable !== undefined ? col.sortable : sortable,
      filter: col.filter !== undefined ? col.filter : filterable,
      resizable: col.resizable !== undefined ? col.resizable : resizable
    }));
  }, [columnDefsRaw, sortable, filterable, resizable]);

  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка данных из API или из ручного ввода
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setError(null);

      if (dataSource === 'api' && apiUrl) {
        setLoading(true);
        try {
          const options = {
            method: apiMethod || 'GET',
            headers: {
              'Content-Type': 'application/json',
              ...apiHeaders
            }
          };
          const response = await fetch(apiUrl, options);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          if (cancelled) return;
          // Если указан путь к данным в ответе — извлекаем
          const result = apiDataPath ? getValueByPath(data, apiDataPath) : data;
          setRowData(Array.isArray(result) ? result : []);
        } catch (e) {
          if (!cancelled) {
            console.error('AGTable: ошибка загрузки данных:', e);
            setError('Ошибка загрузки данных: ' + e.message);
            setRowData([]);
          }
        } finally {
          if (!cancelled) setLoading(false);
        }
      } else {
        // Ручной ввод данных
        const data = safeParse(rowDataRaw, []);
        setRowData(Array.isArray(data) ? data : []);
      }
    };

    loadData();
    return () => { cancelled = true; };
  }, [dataSource, apiUrl, apiMethod, apiHeaders, apiDataPath, rowDataRaw]);

  // Вызываем sizeColumnsToFit только один раз при готовности сетки,
  // чтобы избежать бесконечного цикла обновлений (setState внутри AG Grid)
  const onGridReady = useCallback((params) => {
    if (params?.api) {
      params.api.sizeColumnsToFit();
    }
  }, []);

  const gridOptions = useMemo(() => ({
    pagination,
    paginationPageSize,
    paginationPageSizeSelector: [10, 20, 50, 100],
    rowSelection: selectable ? 'multiple' : undefined,
    suppressRowClickSelection: !selectable,
    animateRows: true,
    domLayout: autoHeight ? 'autoHeight' : 'normal'
  }), [pagination, paginationPageSize, selectable, autoHeight]);

  return (
    <div className="agtable-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div className="agtable-title">{title}</div>
      )}
      {error && (
        <div className="agtable-error">{error}</div>
      )}
      {loading && (
        <div className="agtable-loading">Загрузка данных...</div>
      )}
      <div
        className="ag-theme-alpine"
        style={{
          flex: 1,
          width: '100%',
          minHeight: 0,
          height: autoHeight ? undefined : '100%'
        }}
      >
        <AgGridReact
          ref={gridRef}
          columnDefs={columnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          {...gridOptions}
        />
      </div>
    </div>
  );
}

export default AGTable;