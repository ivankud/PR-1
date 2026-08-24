// Компонент AGTable на основе ag-grid-react
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import JSON5 from 'json5';
import { withAuthHeaders } from '../utils/auth';
import FilterSelect from './FilterSelect';
import {
  buildFilterParams,
  appendFilterParamsToUrl
} from '../utils/filterUtils';
import { callFunction } from '../utils/functionRunner';

// Утилита для безопасного парсинга JSON5 (поддерживает комментарии, одинарные кавычки и т.д.)
function safeParse(json, fallback) {
  if (json === undefined || json === null) return fallback;
  if (typeof json !== 'string') return json;
  try {
    return JSON5.parse(json);
  } catch (e) {
    console.warn('AGTable: не удалось распарсить JSON5:', e.message);
    try {
      return JSON.parse(json);
    } catch (e2) {
      console.warn('AGTable: не удалось распарсить JSON:', e2.message);
      return fallback;
    }
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

// Компонент для отображения кнопки в ячейке таблицы.
// Используется, когда в модели колонки указано cellRenderer: 'button'.
// Колонка рендерится как контейнер (div), внутри которого размещена кнопка.
// При клике вызывает обработчик onCellButtonClick (передаётся через контекст AG Grid).
const ButtonCellRenderer = (props) => {
  const { data, context, colDef, rowIndex, node } = props;
  const buttonText = colDef?.buttonText || 'Кнопка';
  const handleClick = (e) => {
    e.stopPropagation();
    if (context?.onCellButtonClick) {
      context.onCellButtonClick({ data, rowIndex, node });
    }
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        width: '100%'
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        style={{ padding: '4px 12px', cursor: 'pointer' }}
      >
        {buttonText}
      </button>
    </div>
  );
};

// Компонент для отображения произвольного контента в ячейке таблицы.
// Используется, когда в модели колонки указано cellRenderer: 'custom'.
// Колонка рендерится как контейнер (div), внутри которого размещаются
// несколько кнопок, надписи и другие элементы, описанные в colDef.cellContent.
// Формат cellContent — массив объектов:
//   { type: 'button', text: '...', event: 'cellButtonClick', style: {...} } — кнопка
//   { type: 'text', text: '...', style: {...} } — надпись
// При клике на кнопку вызывается обработчик onCellEvent (передаётся через контекст AG Grid)
// с указанием имени события (eventName), чтобы можно было привязать разные функции.
const CustomCellRenderer = (props) => {
  const { data, context, colDef, rowIndex, node } = props;
  const content = colDef?.cellContent || [];

  const handleButtonClick = (e, item) => {
    e.stopPropagation();
    if (context?.onCellEvent) {
      context.onCellEvent({
        data,
        rowIndex,
        node,
        eventName: item.event || 'cellButtonClick'
      });
    }
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        height: '100%',
        width: '100%',
        flexWrap: 'wrap'
      }}
    >
      {content.map((item, idx) => {
        if (item.type === 'button') {
          return (
            <button
              key={idx}
              type="button"
              onClick={(e) => handleButtonClick(e, item)}
              style={{ padding: '4px 8px', cursor: 'pointer', ...(item.style || {}) }}
            >
              {item.text || 'Кнопка'}
            </button>
          );
        }
        if (item.type === 'text') {
          return (
            <span key={idx} style={{ ...(item.style || {}) }}>
              {item.text || ''}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

// Построение URL с параметрами пагинации и сортировки в формате DataUSA
// Например: ?page=1&size=10&sort=Population
function buildApiUrl(baseUrl, { page, size, sortField, sortOrder }) {
  if (!baseUrl) return baseUrl;
  // Формируем параметры вручную, чтобы запятая не кодировалась как %2C
  const params = [];
  // Параметр page в запросе 0-based (начинается с 0),
  // визуально страница отображается как 1-based (начинается с 1)
  params.push(`page=${page - 1}`);
  params.push(`size=${size}`);
  if (sortField) {
    // Формат: sort=Поле,asc или sort=Поле,desc
    params.push(`sort=${sortField},${sortOrder === 'desc' ? 'desc' : 'asc'}`);
  }
  const separator = baseUrl.includes('?') ? '&' : '?';
  return `${baseUrl}${separator}${params.join('&')}`;
}

function AGTable({ primitive, context, fns, onRowClicked, onCellButtonClick, onCellEvent, ...restProps }) {
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
  // Имя пользовательской функции — источника данных (dataSource = 'function')
  const functionName = resolveValue('functionName', '');
  const columnDefsRaw = resolveValue('columnDefs', "[\n  // Первичный ключ\n  { field: 'id', headerName: 'ID', width: 80 },\n  // Основное имя\n  { field: 'name', headerName: 'Имя' }\n]");
  const rowDataRaw = resolveValue('rowData', "[\n  { id: 1, name: 'Иван' },\n  { id: 2, name: 'Пётр' }\n]");
  const clientPagination = resolveValue('pagination', true);
  const paginationPageSize = resolveValue('paginationPageSize', 10);
  const filterModelRaw = resolveValue('filterModel', '[]');
  const filterModel = useMemo(() => safeParse(filterModelRaw, []), [filterModelRaw]);
  const [activeFilters, setActiveFilters] = useState({});
  const sortable = resolveValue('sortable', true);
  const filterable = resolveValue('filterable', true);
  const resizable = resolveValue('resizable', true);
  const selectable = resolveValue('selectable', false);
  const autoHeight = resolveValue('autoHeight', false);

  // Парсим модель колонок
  const columnDefs = useMemo(() => {
    const defs = safeParse(columnDefsRaw, []);
    return defs.map(col => {
      // notFiltered — запретить фильтрацию по полю
      const colFilter = col.notFiltered === true ? false : (col.filter !== undefined ? col.filter : filterable);
      // notSorted — запретить сортировку по полю
      const colSortable = col.notSorted === true ? false : (col.sortable !== undefined ? col.sortable : sortable);
      // resizable — переопределение изменения ширины для конкретной колонки
      const colResizable = col.resizable !== undefined ? col.resizable : resizable;
      // hidden — скрыть поле
      const colHidden = col.hidden === true ? true : (col.hide !== undefined ? col.hide : false);

      // Для API-источника включаем sortable (чтобы AG Grid показывал стрелку сортировки),
      // но задаём нейтральный компаратор, который не меняет порядок строк,
      // т.к. данные приходят уже отсортированными с сервера.
      const isApi = dataSource === 'api';
      const hasComparator = col.comparator !== undefined;

      const colDef = {
        ...col,
        sortable: colSortable,
        filter: colFilter,
        resizable: colResizable,
        hide: colHidden
      };

      // Для API-источника без явно заданного компаратора добавляем нейтральный,
      // чтобы клиентская сортировка AG Grid не изменяла порядок строк
      if (isApi && !hasComparator) {
        colDef.comparator = () => 0;
      }

      // Если колонка — кнопка (cellRenderer: 'button'), используем кастомный рендер.
      // В AG Grid 36+ для React-компонентов используется cellRenderer (не cellRendererFramework).
      if (col.cellRenderer === 'button') {
        colDef.cellRenderer = ButtonCellRenderer;
      }

      // Если колонка — произвольный контент (cellRenderer: 'custom'),
      // используем кастомный рендер с поддержкой нескольких кнопок и надписей.
      if (col.cellRenderer === 'custom') {
        colDef.cellRenderer = CustomCellRenderer;
        // В ячейке может быть несколько элементов (надпись + кнопки), которые
        // не помещаются по ширине. Разрешаем перенос и автовысоту строки,
        // чтобы перенесённые элементы (например, вторая кнопка) не обрезались
        // фиксированной высотой строки AG Grid.
        if (col.wrapText === undefined) colDef.wrapText = true;
        if (col.autoHeight === undefined) colDef.autoHeight = true;
        colDef.cellStyle = {
          ...(col.cellStyle || {}),
          whiteSpace: 'normal',
          lineHeight: 'normal'
        };
      }

      return colDef;
    });
  }, [columnDefsRaw, sortable, filterable, resizable, dataSource]);

  const [rowData, setRowData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Состояние видимости колонок и всплывающего окна
  const [hiddenColumns, setHiddenColumns] = useState(() => {
    // Инициализируем скрытыми все колонки, у которых есть поле hide в модели
    const hidden = {};
    for (const col of columnDefs) {
      if (col.hide || col.hidden) hidden[col.field || col.colId] = true;
    }
    return hidden;
  });
  const [columnsMenuOpen, setColumnsMenuOpen] = useState(false);
  const columnsMenuRef = useRef(null);

  // Закрытие всплывающего окна при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (columnsMenuRef.current && !columnsMenuRef.current.contains(e.target)) {
        setColumnsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Применяем скрытие колонок к columnDefs
  const visibleColumnDefs = useMemo(() => {
    return columnDefs.map(col => {
      const key = col.field || col.colId;
      return {
        ...col,
        hide: hiddenColumns[key] === true || col.hidden === true
      };
    });
  }, [columnDefs, hiddenColumns]);

  // Переключение видимости колонки
  const toggleColumn = (col) => {
    const key = col.field || col.colId;
    setHiddenColumns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Состояние серверной пагинации
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(paginationPageSize);
  const [sortField, setSortField] = useState('');
  const [sortOrder, setSortOrder] = useState('');
  const [totalRecords, setTotalRecords] = useState(0);

  // Нормализация используемой пагинации
  const useClientPagination = !serverPagination && clientPagination;

  // Построение URL API с параметрами (пагинация, сортировка, фильтры)
  const builtApiUrl = useMemo(() => {
    if (dataSource !== 'api' || !apiUrlRaw) return apiUrlRaw;
    let url = apiUrlRaw;

    // Параметры фильтрации
    const filterParams = buildFilterParams(filterModel, activeFilters);
    url = appendFilterParamsToUrl(url, filterParams);

    // Если серверная пагинация выключена, но источник — API,
    // при сортировке всё равно перезапрашиваем данные с сервера
    if (!serverPagination) {
      // Добавляем только параметр сортировки, если она задана
      if (sortField) {
        const sortValue = `${sortField},${sortOrder === 'desc' ? 'desc' : 'asc'}`;
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}sort=${sortValue}`;
      }
      return url;
    }
    return buildApiUrl(url, {
      page: currentPage,
      size: pageSize,
      sortField,
      sortOrder
    });
  }, [dataSource, apiUrlRaw, serverPagination, currentPage, pageSize, sortField, sortOrder, filterModel, activeFilters]);

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
      } else if (dataSource === 'function' && functionName) {
        // Источник данных — пользовательская функция формы.
        // Функция получает контекст формы и фильтры примитива, сама выполняет
        // запрос к серверу (GET) и возвращает строки данных (массив или { data: [...] }).
        setLoading(true);
        try {
          // Формируем параметры фильтрации для передачи функции
          const filterParams = buildFilterParams(filterModel, activeFilters);
          // Дополняем контекст фильтрами и настройками примитива
          const fnContext = {
            ...JSON.parse(JSON.stringify(context || {})),
            filters: filterParams,
            filterModel,
            activeFilters,
            // Настройки примитива, доступные функции (напр., базовый URL для GET)
            apiUrl: apiUrlRaw,
            apiMethod,
            apiDataPath,
            useAuth
          };
          const fnResult = fns ? callFunction(fns, functionName, fnContext) : null;
          if (cancelled) return;

          // Функция может быть async и возвращать Promise — ожидаем его
          const result = (fnResult && typeof fnResult.then === 'function')
            ? await fnResult
            : fnResult;

          // Обрабатываем результат функции
          let rows = Array.isArray(result) ? result : null;
          if (!rows && result && typeof result === 'object') {
            rows = result.data || result.rows || result.items || result.records || result.content || null;
            if (!rows && Array.isArray(result.result)) rows = result.result;
            // Если функция вернула пагинированный ответ — определяем общее количество
            const total = result?.total || result?.totalElements || result?.count || result?.totalCount;
            if (serverPagination && total !== undefined) {
              setTotalRecords(total);
            }
          }
          setRowData(Array.isArray(rows) ? rows : []);
        } catch (e) {
          if (!cancelled) {
            console.error('AGTable: ошибка выполнения функции данных:', e);
            setError('Ошибка выполнения функции данных: ' + e.message);
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
  }, [dataSource, builtApiUrl, apiMethod, apiHeaders, useAuth, apiDataPath, rowDataRaw, serverPagination, functionName, filterModel, activeFilters, fns, context, apiUrlRaw]);

  // Обработчик клика по заголовку колонки
  // При API-источнике: перезапрашиваем данные с сервера с сортировкой по полю.
  // Применяем сортировку через applyColumnState, чтобы AG Grid отрисовал стрелку,
  // и обновляем sortField/sortOrder, чтобы изменился URL и произошёл перезапрос.
  // Цикл сортировки: asc → desc → без сортировки → asc
  const onColumnHeaderClicked = useCallback((params) => {
    // Только для данных из API
    if (dataSource !== 'api') return;
    const colId = params?.column?.getColId?.() || params?.column?.colId;
    if (!colId) return;

    // Если для колонки запрещена сортировка (notSorted: true) — игнорируем клик
    const colDef = params?.column?.getColDef?.();
    if (colDef?.notSorted === true) return;

    // Определяем следующее состояние сортировки
    let nextSort = 'asc';
    if (sortField === colId) {
      if (sortOrder === 'asc') nextSort = 'desc';
      else if (sortOrder === 'desc') nextSort = '';
      else nextSort = 'asc';
    }

    // Применяем состояние сортировки в AG Grid через applyColumnState,
    // чтобы стрелка сортировки в заголовке обновилась
    if (params?.api?.applyColumnState) {
      params.api.applyColumnState({
        state: [{ colId, sort: nextSort || null }],
        defaultState: { sort: null }
      });
    }

    // Обновляем состояние — builtApiUrl изменится и данные перезапросятся
    setSortField(nextSort ? colId : '');
    setSortOrder(nextSort || '');
    setCurrentPage(1);
  }, [dataSource, sortField, sortOrder]);

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
    // Запрет удаления колонок перетаскиванием за пределы таблицы
    suppressDragLeaveHidesColumns: true,
    animateRows: true,
    domLayout: autoHeight ? 'autoHeight' : 'normal',
    // Контекст AG Grid: передаём обработчики кликов по кнопкам в ячейках
    context: { onCellButtonClick, onCellEvent }
  }), [useClientPagination, paginationPageSize, selectable, autoHeight, onCellButtonClick, onCellEvent]);

  return (
    <div className="agtable-container" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      {title && (
        <div className="agtable-title">{title}</div>
      )}
      {/* Панель фильтров (опциональный элемент, настраиваемый через filterModel) */}
      {Array.isArray(filterModel) && filterModel.length > 0 && (
        <div className="agtable-filters">
          <FilterSelect
            filterModel={filterModel}
            value={{}}
            onChange={setActiveFilters}
          />
        </div>
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
          height: autoHeight ? undefined : '100%',
          position: 'relative'
        }}
      >
        {/* Кнопка управления колонками в левом верхнем углу */}
        <div className="agtable-columns-menu" ref={columnsMenuRef}>
          <button
            className="agtable-columns-toggle"
            onClick={() => setColumnsMenuOpen(!columnsMenuOpen)}
            title="Управление колонками"
          >
            <svg
              className="agtable-columns-icon"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
          </button>
          {columnsMenuOpen && (
            <div className="agtable-columns-popup">
              <div className="agtable-columns-header">Отображаемые колонки</div>
              <div className="agtable-columns-list">
                {columnDefs.map(col => {
                  const key = col.field || col.colId;
                  // Полностью скрытые колонки (hidden: true) не показываем в списке
                  if (col.hidden === true) return null;
                  const isHidden = hiddenColumns[key] === true;
                  return (
                    <label key={key} className="agtable-column-item">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => toggleColumn(col)}
                      />
                      <span>{col.headerName || col.field || col.colId}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <AgGridReact
          ref={gridRef}
          columnDefs={visibleColumnDefs}
          rowData={rowData}
          onGridReady={onGridReady}
          onRowClicked={onRowClicked}
          onColumnHeaderClicked={onColumnHeaderClicked}
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