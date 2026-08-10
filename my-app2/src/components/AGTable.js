// Компонент AGTable на основе ag-grid-react
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { withAuthHeaders } from '../utils/auth';

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

// Доступные размеры страницы для выпадающего списка
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 500];

// Построение URL с параметрами пагинации и сортировки в формате DataUSA
// Например: ?page=1&size=10&sort=Population
function buildApiUrl(baseUrl, { page, size, sortField, sortOrder }) {
  if (!baseUrl) return baseUrl;
  const url = new URL(baseUrl, window.location.origin);
  url.searchParams.set('page', page);
  url.searchParams.set('size', size);
  if (sortField) {
    const sortValue = sortOrder === 'desc' ? `-${sortField}` : sortField;
    url.searchParams.set('sort', sortValue);
  }
  return url.toString().replace(window.location.origin, '');
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
  const apiUrlRaw = resolveValue('apiUrl', '');
  const apiMethod = resolveValue('apiMethod', 'GET');
  // Мемоизируем apiHeaders, чтобы ссылка на объект была стабильной
  const apiHeadersRaw = resolveValue('apiHeaders', '{}');
  const apiHeaders = useMemo(() => safeParse(apiHeadersRaw, {}), [apiHeadersRaw]);
  // Опциональная настройка: пробрасывать логин/пароль со страницы авторизации
  const useAuth = resolveValue('useAuth', false);
  // Серверная пагинация
  const serverPagination = resolveValue('serverPagination', false);
  const apiDataPath = resolveValue('apiDataPath', '');
  const columnDefsRaw = resolveValue('columnDefs', '[{"field":"id","headerName":"ID"},{"field":"name","headerName":"Имя"}]');
  const rowDataRaw = resolveValue('rowData', '[{"id":1,"name":"Иван"},{"id":2,"name":"Пётр"}]');
  const clientPagination = resolveValue('pagination', true);
  const paginationPageSize = resolveValue('paginationPageSize', 10);
  const sortable = resolveValue('sortable', true);
  const filterable = resolveValue('filterable', true);
  const resizable = resolveValue('resizable', true);
  const selectable = resolveValue('selectable', false);
  const autoHeight = resolveValue('autoHeight', false);

  // Парсим модель колонок
  const columnDefs = useMemo(() => {
    const defs = safeParse(columnDefsRaw, []);
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

  // Состояние серверной пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(paginationPageSize);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Нормализация используемой пагинации
  const useClientPagination = !serverPagination && clientPagination;

  // Построение URL API с параметрами
  const builtApiUrl = useMemo(() => {
    if (dataSource !== 'api' || !apiUrlRaw) return apiUrlRaw;
    if (!serverPagination) return apiUrlRaw;
    return buildApiUrl(apiUrlRaw, {
      page: currentPage,
      size: pageSize,
      sortField,
      sortOrder
    });
  }, [dataSource, apiUrlRaw, serverPagination, currentPage, pageSize, sortField, sortOrder]);

  // Сброс страницы при изменении размера
  useEffect(() => {
    setCurrentPage(1);
  }, [pageSize, apiUrlRaw, serverPagination]);

  // Загрузка данных из API или из ручного ввода
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      setError(null);

      if (dataSource === 'api' && builtApiUrl) {
        setLoading(true);
        try {
          const options = {
            method: apiMethod || 'GET',
            headers: withAuthHeaders({
              'Content-Type': 'application/json',
              ...apiHeaders
            }, useAuth)
          };
          const response = await fetch(builtApiUrl, options);
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
          }
          const data = await response.json();
          if (cancelled) return;

          // Если серверная пагинация — пытаемся определить общее количество записей
          if (serverPagination) {
            const total = data?.total || data?.totalElements || data?.count || data?.totalCount;
            if (total !== undefined) {
              setTotalRecords(total);
            }
          }

          // Если указан путь к данным в ответе — извлекаем
          const result = apiDataPath ? getValueByPath(data, apiDataPath) : data;
          // Поддержка обёрток: { data: [...] } или { items: [...] } или { records: [...] }
          let rows = Array.isArray(result) ? result : null;
          if (!rows && result && typeof result === 'object') {
            rows = result.data || result.items || result.records || result.content || null;
          }
          setRowData(Array.isArray(rows) ? rows : []);
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
  }, [dataSource, builtApiUrl, apiMethod, apiHeaders, useAuth, apiDataPath, rowDataRaw, serverPagination]);

  // Обработчик сортировки для серверной пагинации
  const onSortChanged = useCallback((params) => {
    if (!serverPagination) return;
    const sortModel = params?.api?.getSortModel?.() || [];
    if (sortModel.length === 0) {
      setSortField('');
      setSortOrder('');
      setCurrentPage(1);
      return;
    }
    const { colId, sort } = sortModel[0];
    setSortField(colId);
    setSortOrder(sort || 'asc');
    setCurrentPage(1);
  }, [serverPagination]);

  // Обработчики пагинации
  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(1, prev - 1));
  };

  const handleNextPage = () => {
    const maxPage = Math.max(1, Math.ceil(totalRecords / (pageSize || 1)));
    setCurrentPage(prev => Math.min(maxPage, prev + 1));
  };

  const handlePageSizeChange = (e) => {
    setPageSize(Number(e.target.value));
  };

  // Количество страниц
  const totalPages = totalRecords > 0
    ? Math.max(1, Math.ceil(totalRecords / (pageSize || 1)))
    : 0;

  // Вызываем sizeColumnsToFit один раз при готовности сетки
  const onGridReady = useCallback((params) => {
    if (params?.api) {
      params.api.sizeColumnsToFit();
    }
  }, []);

  const gridOptions = useMemo(() => ({
    pagination: useClientPagination,
    paginationPageSize: paginationPageSize,
    paginationPageSizeSelector: PAGE_SIZE_OPTIONS,
    rowSelection: selectable ? 'multiple' : undefined,
    suppressRowClickSelection: !selectable,
    animateRows: true,
    domLayout: autoHeight ? 'autoHeight' : 'normal'
  }), [useClientPagination, paginationPageSize, selectable, autoHeight]);

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
          onSortChanged={onSortChanged}
          {...gridOptions}
        />
      </div>

      {/* Панель пагинации снизу */}
      {(serverPagination || useClientPagination) && (
        <div className="agtable-pagination">
          <div className="agtable-pagination-size">
            <span>Записей на странице:</span>
            <select
              className="agtable-page-size-select"
              value={serverPagination ? pageSize : paginationPageSize}
              onChange={handlePageSizeChange}
            >
              {PAGE_SIZE_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {serverPagination && (
            <div className="agtable-pagination-nav">
              <button
                className="btn btn-sm"
                onClick={handlePrevPage}
                disabled={currentPage <= 1 || loading}
              >
                ← Назад
              </button>
              <span className="agtable-page-number">{currentPage}</span>
              <button
                className="btn btn-sm"
                onClick={handleNextPage}
                disabled={(totalPages > 0 && currentPage >= totalPages) || loading}
              >
                Вперёд →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default AGTable;