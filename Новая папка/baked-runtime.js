
/* ============================================================================
   Автономный рантайм для запечённых форм, сгенерированный редактором форм.
   Содержит утилиты и компоненты (AGTable, иконки, якоря, размеры, события,
   функции), необходимые для запуска запечённой формы внутри другого проекта.
   См. файл <ИмяФормы>.jsx.
   Зависимости для установки в целевом проекте:
     npm i ag-grid-community ag-grid-react
   ============================================================================ */
import React, { useState, useEffect, useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';


/* ---------------------- доступ к значению по пути a.b.c -------------------- */
function getByPath(obj, path) {
  if (!obj || !path) return undefined;
  var parts = String(path).split('.');
  var current = obj;
  for (var i = 0; i < parts.length; i++) {
    if (current === null || current === undefined) return undefined;
    current = current[parts[i]];
  }
  return current;
}

function stringify(v) {
  if (v === undefined || v === null) return '';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
}

/* ----------------------- резолвинг якорей {{path}} ------------------------ */
export function resolveTemplate(template, context) {
  if (template === undefined || template === null) return '';
  if (typeof template !== 'string') return template;
  var result = template;
  for (var pass = 0; pass < 10; pass++) {
    if (!/\{\{([^}]+)\}\}/.test(result)) break;
    result = result.replace(/\{\{([^}]+)\}\}/g, function (m, path) {
      var p = path.trim();
      if (p === '.' || p === '') return stringify(context);
      return stringify(getByPath(context, p));
    });
  }
  return result;
}

/* Разрешение шаблона с приоритетом: сначала собственные свойства примитива,
   затем контекст. Соответствует поведению resolveTemplate в редакторе форм. */
export function R(template, primitive, context) {
  return resolveTemplate(template, Object.assign({}, context, primitive));
}

/* Строки таблицы для простого примитива "table". Возвращает массив <tr>. */
export function bakedTableRows(primitive, context) {
  var rowsRaw = R(primitive.rows !== undefined ? String(primitive.rows) : ('{{rows}}'), primitive, context);
  var colsRaw = R(primitive.cols !== undefined ? String(primitive.cols) : '{{cols}}', primitive, context);
  var rowsI = parseInt(typeof rowsRaw === 'string' ? rowsRaw : primitive.rows, 10) || 3;
  var colsI = parseInt(typeof colsRaw === 'string' ? colsRaw : primitive.cols, 10) || 3;
  var dataRaw = R('{{data}}', primitive, context);
  var data = null;
  if (Array.isArray(dataRaw)) data = dataRaw;
  else if (typeof dataRaw === 'string' && dataRaw.charAt(0) === '[') {
    try { data = JSON.parse(dataRaw); } catch (e) { data = null; }
  }
  var out = [];
  for (var r = 0; r < rowsI; r++) {
    var cells = [];
    for (var c = 0; c < colsI; c++) {
      var cellValue = data && data[r] ? data[r][c] : '';
      cells.push(
        React.createElement('td', { key: c, style: { border: '1px solid #ccc', padding: '4px 8px' } },
          cellValue !== undefined && cellValue !== null ? String(cellValue) : '')
      );
    }
    out.push(React.createElement('tr', { key: r }, cells));
  }
  return out;
}

/* ----------------------- условная видимость и значения ---------------------- */
export function resolveCondition(expression, context) {
  if (expression === undefined || expression === null) return true;
  if (typeof expression !== 'string') return Boolean(expression);
  var trimmed = expression.trim();
  if (trimmed === '') return true;
  var jsExpr = trimmed.replace(/\{\{([^}]+)\}\}/g, function (m, path) {
    var parts = path.trim().split('.').filter(Boolean);
    if (parts.length === 0) return 'undefined';
    var access = parts.map(function (p) {
      return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p) ? '.' + p : '[' + JSON.stringify(p) + ']';
    }).join('');
    return 'context' + access;
  });
  try {
    var fn = new Function('context', 'return (' + jsExpr + ');');
    return Boolean(fn(context));
  } catch (e) {
    return false;
  }
}

export function resolveConditionalValue(value, context) {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'object' || !Array.isArray(value.conditions)) return value;
  for (var i = 0; i < value.conditions.length; i++) {
    var cond = value.conditions[i];
    if (cond && cond.when && resolveCondition(cond.when, context)) return cond.value;
  }
  return value.default !== undefined ? value.default : undefined;
}

/* ----------------------------- размеры и единицы ---------------------------- */
export function sizeValue(value, unit) {
  if (unit === 'auto') return 'auto';
  var v = value !== undefined ? value : 0;
  return v + (unit || 'px');
}
export function getSizeStyle(primitive) {
  return {
    width: sizeValue(primitive.width, primitive.widthUnit),
    height: sizeValue(primitive.height, primitive.heightUnit)
  };
}
export function getCanvasSizeStyle(canvas) {
  return {
    width: sizeValue(canvas.width, canvas.widthUnit || 'px'),
    height: sizeValue(canvas.height, canvas.heightUnit || 'px')
  };
}

/* ------------------------- функции и события форм -------------------------- */
export function buildFunctions(functions) {
  var map = {};
  for (var i = 0; i < (functions || []).length; i++) {
    var fn = functions[i];
    try {
      map[fn.name] = new Function('context', fn.code || '');
    } catch (e) {
      map[fn.name] = function () { return null; };
    }
  }
  return map;
}
export function callFunction(fns, fnName, context) {
  if (!fns || !fnName) return null;
  var fn = fns[fnName];
  if (!fn) return null;
  try { return fn(context); } catch (e) { return null; }
}
function toReactEventName(name) {
  if (name.indexOf('on') === 0) return name;
  return 'on' + name.charAt(0).toUpperCase() + name.slice(1);
}

/* Обработчики событий примитива (onClick, onChange, ...) с обновлением контекста. */
export function buildEventHandlers(primitive, fns, context, onUpdateContext) {
  var handlers = {};
  var events = primitive && primitive.events ? primitive.events : {};
  Object.keys(events).forEach(function (eventName) {
    var fnName = events[eventName];
    if (!fnName) return;
    var reactName = toReactEventName(eventName);
    handlers[reactName] = function (e) {
      var eventContext = JSON.parse(JSON.stringify(context));
      eventContext.event = {
        type: e && e.type,
        target: e && e.target,
        value: e && e.target && e.target.value
      };
      eventContext.primitiveId = primitive && primitive.id;
      eventContext.primitiveName = primitive && primitive.name;
      var result = callFunction(fns, fnName, eventContext);
      if (onUpdateContext && result && typeof result === 'object') onUpdateContext(result);
    };
  });
  return handlers;
}

/* Контекст из данных формы (гибрид: inline или loadedData). */
export function getInitialContext(formData) {
  if (!formData || !formData.context) return {};
  if (formData.context.source === 'inline') return formData.context.inline || {};
  return formData.context.loadedData || {};
}

/* Итоговый style обёртки примитива: размеры + позиция + условные стили + видимость. */
export function ms(primitive, context) {
  var style = Object.assign({}, getSizeStyle(primitive), primitive.style || {});
  if (primitive.position) style.position = primitive.position;
  else delete style.position;
  if (primitive.left !== undefined && primitive.left !== null && primitive.left !== '') {
    style.left = primitive.left;
  } else {
    delete style.left;
  }
  if (primitive.top !== undefined && primitive.top !== null && primitive.top !== '') {
    style.top = primitive.top;
  } else {
    delete style.top;
  }
  if (style.left === undefined || style.left === '') delete style.left;
  if (style.top === undefined || style.top === '') delete style.top;

  var customProps = primitive.customProperties || {};
  Object.keys(customProps).forEach(function (key) {
    if (key === 'visibility') return;
    var value = customProps[key];
    if (typeof value === 'object' && value !== null && Array.isArray(value.conditions)) {
      var resolved = resolveConditionalValue(value, context);
      if (resolved !== undefined) style[key] = resolved;
    }
  });

  var visible = resolveCondition(
    primitive.customProperties && primitive.customProperties.visibility,
    context
  );
  if (!visible) style.display = 'none';
  if (primitive.children && primitive.children.length > 0) style.overflow = 'visible';
  return style;
}

/* Стиль внутреннего контейнера детей (раскладка для flex-контейнеров). */
export function containerChildStyle(primitive) {
  var base = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 };
  if (primitive.style && primitive.style.display === 'flex') {
    base.display = 'flex';
    base.flexDirection = primitive.style.flexDirection || 'row';
    base.gap = primitive.style.gap;
    base.justifyContent = primitive.style.justifyContent;
    base.alignItems = primitive.style.alignItems;
  }
  return base;
}

/* Обработчик событий ячеек AGTable (кнопки в колонках custom/button). */
export function cellEvent(primitive, fns, context, onUpdateContext) {
  return function (params) {
    if (!primitive || !primitive.events) return;
    var evName = params && params.eventName;
    var fnName = primitive.events[evName];
    if (!fnName) return;
    var eventContext = JSON.parse(JSON.stringify(context));
    eventContext.event = {
      type: evName,
      data: params && params.data,
      rowIndex: params && params.rowIndex
    };
    eventContext.primitiveId = primitive.id;
    eventContext.primitiveName = primitive.name;
    var result = callFunction(fns, fnName, eventContext);
    if (onUpdateContext && result && typeof result === 'object') onUpdateContext(result);
  };
}


/* ----------------------------- иконки ----------------------------- */
var BUILTIN_ICONS = {
  home: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  users: '<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  minus: '<line x1="5" y1="12" x2="19" y2="12"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  x: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
  edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  download: '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',
  mail: '<path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/>',
  phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'
};

/* Компонент иконки по id (svg встраивается через dangerouslySetInnerHTML). */
export function IconBaked({ iconId, size = 16, color = 'currentColor', className }) {
  var svg = iconId ? BUILTIN_ICONS[iconId] : null;
  if (!svg) return null;
  return React.createElement('svg', {
    className: className,
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    dangerouslySetInnerHTML: { __html: svg }
  });
}


/* --------------------- AGTable: обёртка над ag-grid-react --------------------- */
function safeParse(json, fallback) {
  if (json === undefined || json === null) return fallback;
  if (typeof json !== 'string') return json;
  try { return JSON.parse(json); } catch (e) { return fallback; }
}

/* Извлечение массива строк из ответа (data / rows / items / records / content). */
function getDataRows(raw) {
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    if (Array.isArray(raw.data)) return raw.data;
    if (Array.isArray(raw.rows)) return raw.rows;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.records)) return raw.records;
    if (Array.isArray(raw.content)) return raw.content;
  }
  return [];
}

/* Компонент-рендерер ячейки для колонок cellRenderer: 'custom' / 'button'.
   По клику вызывает onCellEvent ({ data, rowIndex, eventName }). */
var CellRender = function (cellProps) {
  var data = cellProps ? cellProps.data : null;
  var rowIndex = cellProps ? cellProps.rowIndex : 0;
  var content = (cellProps && cellProps.colDef && cellProps.colDef.cellContent) || [];
  return React.createElement('div', { style: { display: 'flex', gap: 6, alignItems: 'center', height: '100%' } },
    content.map(function (item, i) {
      if (item.type === 'text') {
        return React.createElement('span', { key: i, style: Object.assign({ fontSize: 12 }, item.style || {}) }, item.text);
      }
      var evName = item.event || 'click';
      return React.createElement('button', {
        key: i,
        type: 'button',
        style: Object.assign({ padding: '2px 8px', cursor: 'pointer' }, item.style || {}),
        onClick: function (e) {
          e.stopPropagation();
          var oc = cellProps.context && cellProps.context.onCellEvent;
          if (oc) oc({ data: data, rowIndex: rowIndex, eventName: evName });
        }
      }, item.text || ('Кнопка' + (i + 1)));
    })
  );
};

/*__RUNTIME_AGTABLE_PART_B__*/
export function BakedAGTable({ primitive, context, fns }) {
  var props = primitive || {};
  var dataSource = props.dataSource || 'manual';
  var columnDefs = safeParse(props.columnDefs, []);
  var [rowData, setRowData] = React.useState([]);
  var [page, setPage] = React.useState(1);
  var pageSize = props.pageSize || props.paginationPageSize || 10;
  var serverPagination = props.serverPagination === true;
  var apiUrl = props.apiUrl || '';
  var apiDataPath = props.apiDataPath || '';
  var useAuth = props.useAuth === true;
  var headers = safeParse(props.apiHeaders, {});
  var method = props.apiMethod || 'GET';

  function basicAuthHeader() {
    try {
      var raw = localStorage.getItem('app_auth_credentials');
      if (!raw) return '';
      var decoded = JSON.parse(decodeURIComponent(escape(atob(raw))));
      return 'Basic ' + btoa(unescape(encodeURIComponent(decoded.login + ':' + decoded.password)));
    } catch (e) { return ''; }
  }

  function loadManual() {
    setRowData(getDataRows(safeParse(props.rowData, [])));
  }

  async function loadServer(pg) {
    if (!apiUrl) return;
    var sep = apiUrl.indexOf('?') >= 0 ? '&' : '?';
    var url = apiUrl + sep + 'page=' + pg + '&size=' + pageSize;
    var initHeaders = Object.assign({ 'Content-Type': 'application/json' }, headers || {});
    if (useAuth) {
      var authHeader = basicAuthHeader();
      if (authHeader) initHeaders['Authorization'] = authHeader;
    }
    try {
      var res = await fetch(url, { method: method, headers: initHeaders });
      var json = await res.json();
      var payload = apiDataPath ? getByPath(json, apiDataPath) : json;
      setRowData(getDataRows(payload));
    } catch (e) { setRowData([]); }
  }

  function loadFunction() {
    if (!fns || !props.functionName) return;
    var callContext = JSON.parse(JSON.stringify(context));
    callContext.page = page;
    callContext.currentPage = page;
    callContext.size = pageSize;
    callContext.pageSize = pageSize;
    callContext.serverPagination = serverPagination;
    var result = callFunction(fns, props.functionName, callContext);
    if (result && typeof result.then === 'function') {
      result.then(function (data) { setRowData(getDataRows(data)); }).catch(function () { setRowData([]); });
    } else {
      setRowData(getDataRows(result));
    }
  }

  React.useEffect(function () {
    if (dataSource === 'api') loadServer(1);
    else if (dataSource === 'function') loadFunction();
    else loadManual();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.id, props.dataSource, apiUrl]);

  var goNext = function () {
    var p = page + 1; setPage(p);
    if (dataSource === 'api') loadServer(p); else loadFunction();
  };
  var goPrev = function () {
    var p = Math.max(1, page - 1); setPage(p);
    if (dataSource === 'api') loadServer(p); else loadFunction();
  };

  var anyCustomCell = columnDefs.some(function (c) {
    return c.cellRenderer === 'custom' || c.cellRenderer === 'button';
  });

  var effectiveColumnDefs = anyCustomCell
    ? columnDefs.map(function (c) {
        var cl = Object.assign({}, c);
        if (cl.cellRenderer === 'custom' || cl.cellRenderer === 'button') {
          cl.cellRenderer = 'bakedCell';
          cl.cellRendererParams = { isCustom: true };
        }
        return cl;
      })
    : columnDefs;

  var grid = React.createElement(AgGridReact, {
    columnDefs: effectiveColumnDefs,
    rowData: rowData,
    components: anyCustomCell ? { bakedCell: CellRender } : undefined,
    context: { onCellEvent: props.onCellEvent },
    defaultColDef: {
      sortable: props.sortable !== false,
      filter: props.filterable !== false,
      resizable: props.resizable !== false
    },
    pagination: props.pagination !== false && !serverPagination,
    paginationPageSize: pageSize
  });

  var pagination = serverPagination
    ? React.createElement('div', { style: { display: 'flex', gap: 8, paddingTop: 6, alignItems: 'center' } },
        React.createElement('button', { type: 'button', onClick: goPrev, disabled: page <= 1, style: { padding: '2px 10px', cursor: 'pointer' } }, String.fromCharCode(8592)),
        React.createElement('span', null, String(page)),
        React.createElement('button', { type: 'button', onClick: goNext, style: { padding: '2px 10px', cursor: 'pointer' } }, String.fromCharCode(8594))
      )
    : null;

  return React.createElement('div', { style: { height: '100%', width: '100%', display: 'flex', flexDirection: 'column' } },
    React.createElement('div', { className: 'ag-theme-alpine', style: { flex: 1, minHeight: 0 } }, grid),
    pagination
  );
}

