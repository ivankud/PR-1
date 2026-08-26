// ===========================================================================
// Запечённая форма: Итоговый пример c элементами для реестра333333
// Файл №1 — компонент формы. Все функции и примитивы выписаны ЯВНО.
// Для запуска нужен Файл №2 (bakedRuntime) — импорт ниже.
// ===========================================================================
import React, { useState, useEffect } from 'react';
import {
  AGTable,
  IconSvg,
  resolveTemplate,
  resolveCondition,
  resolveConditionalValue
} from './bakedRuntime';

// ===== Пользовательские функции формы =====
function updateField1(context) {
  if (context.event && context.event.value !== undefined) {
    context.field1.value = context.event.value;
    console.log('Контекст обновлен:', context);
  }
  return context;
}

function showContext(context) {
  const { event, primitiveId, primitiveName, ...data } = context;
  console.log(event);
  console.log(primitiveId);
  console.log(primitiveName);
  console.log(JSON.stringify(data, null, 2));
  alert(JSON.stringify(data, null, 2));
}

function exampleFunction(context) {
  console.log('var1:', context.var1);
  console.log('var2:', context.var2);
  console.log('var3:', context.var3);

  // Меняем значение переменной контекста
  context.var1 = 'новое значение var1';
  context.var2 = 'новое значение var2';

  // Возвращаем обновлённый контекст, чтобы он применился ко всей форме
  return context;
}

function logRowClick(context) {
  let vrow = context.event?.data;
  console.log('Клик по строке:', vrow);
  context.row1 = vrow;
  return context;
}

function showHello(context) {
  alert('Hello');
}

function showHello2(context) {
  alert('Hello 2');
}

function hideButton2(context) {
  const btn2 = getElementByName('Button2');
  if (btn2) btn2.style.display = 'none';
}

function hideHideTable1(context) {
  const tbl1 = getElementByName('AGTable1');
  if (tbl1) tbl1.style.display = 'none';
}

function hideHideTable2(context) {
  const tbl2 = getElementByName('AGTable2');
  if (tbl2) tbl2.style.display = 'none';
}

function hideHideTable3(context) {
  const tbl3 = getElementByName('AGTable3');
  if (tbl3) tbl3.style.display = 'none';
}

function logRowClickT1(context) {
  let vrow = context.event?.data;
  console.log('Клик по строке:', vrow);
  context.rowT1 = vrow;
  return context;
}

function onOpenHandler(context) {
  console.log('Событие onOpen: форма открыта');
  context.eventLog = (context.eventLog || '') + 'onOpen; ';
  context.onOpenMessage = 'Событие onOpen выполнено при открытии формы';
  alert('onOpenHandler');
  return context;
}

function onLoadHandler(context) {
  console.log('Событие onLoad: контекст загружен');
  context.eventLog = (context.eventLog || '') + 'onLoad; ';
  context.onLoadMessage = 'Событие onLoad выполнено после загрузки контекста';
  return context;
}

function onSubmitHandler(context) {
  console.log('Событие onSubmit: форма отправлена');
  context.eventLog = (context.eventLog || '') + 'onSubmit; ';
  context.onSubmitMessage = 'Событие onSubmit выполнено при отправке формы';
  return context;
}

function fetchFilteredData(context) {
  // Источник данных для AGTable (dataSource = 'function', functionName = 'fetchFilteredData')
  // AGTable передаёт в context:
  //   context.filterModel   — модель фильтров примитива
  //   context.activeFilters — текущее состояние фильтров ({ field: { operator, value, disabled } })
  //   context.apiUrl        — базовый URL из настроек примитива
  //   context.page/size     — параметры серверной пагинации
  //   context.serverPagination — включена ли серверная пагинация
  //
  // Параметры фильтрации формируем так же, как при dataSource = 'api' — через buildFilterParams
  // и appendFilterParamsToUrl: массив { name, datatype, operator, val } сериализуется в JSON
  // и добавляется в URL как параметр filter.
  async function fetchData() {
    const baseUrl = context.apiUrl || 'http://172.16.50.42:9977/app/api/1.0/auditprograms';
    const isServerPaged = Boolean(context.serverPagination || context.server);

    // Сборка фильтров (ключ val, как buildFilterParams)
    const filters = [];
    const model = context.filterModel || [];
    const active = context.activeFilters || {};
    for (const f of model) {
      const state = active[f.field];
      if (!state || state.disabled) continue;
      const op = state.operator;
      const val = state.value;
      if (!op || val === '' || val === null || val === undefined) continue;
      filters.push({
        name: f.field,
        datatype: (f.type || 'string').replace('numeic', 'numeric'),
        operator: op,
        val: val
      });
    }

    // Добавление в URL как appendFilterParamsToUrl: /filter=<JSON>
    let url = baseUrl;
    if (filters.length > 0) {
      const sep = url.includes('?') ? '&' : '?';
      url += sep + 'filter=' + encodeURIComponent(JSON.stringify(filters));
    }
    console.log('context');
    console.log(context);

    // Добавление параметров серверной пагинации (AGTable передаёт context.page / context.size)
    if (isServerPaged) {
      // Сервер принимает page 0-based (как buildApiUrl в AGTable)
      const pagSep = url.includes('?') ? '&' : '?';
      const page = (Number(context.page) || 1) - 1;
      const size = Number(context.size) || 10;
      url += pagSep + 'page=' + page + '&size=' + size;
    }

    // GET к серверу (Basic Auth берётся из настроек авторизации)
    const payload = await fetchWithAuth(url);

    // Данные могут прийти в обёртке Spring Data: content / data / rows / items / list
    let rows = Array.isArray(payload) ? payload : null;
    if (!rows && payload && typeof payload === 'object') {
      rows = payload.content || payload.data || payload.rows
          || payload.items || payload.result || payload.list || payload.records || null;
      if (!rows && payload.page) rows = payload.page.content || payload.page.records || null;
    }

    // Для серверной пагинации возвращаем объект с total + content,
    // чтобы AGTable заблокировал кнопку «Вперёд» на последней странице
    if (isServerPaged) {
      const total = (payload && payload.total !== undefined && payload.total !== null) ? payload.total
        : (payload && payload.totalElements != null) ? payload.totalElements
        : (payload && payload.totalCount != null) ? payload.totalCount
        : (payload && payload.count != null) ? payload.count
        : (payload && payload.page && payload.page.totalElements != null) ? payload.page.totalElements
        : (Array.isArray(rows) ? rows.length : 0);
      return { content: Array.isArray(rows) ? rows : [], total: total };
    }
    return rows;
  }

  // Возвращаем Promise — AGTable ожидает его через await
  return fetchData();
}

// Объект-карта функций (нужен AGTable с dataSource = "function")
const fns = {
  updateField1,
  showContext,
  exampleFunction,
  logRowClick,
  showHello,
  showHello2,
  hideButton2,
  hideHideTable1,
  hideHideTable2,
  hideHideTable3,
  logRowClickT1,
  onOpenHandler,
  onLoadHandler,
  onSubmitHandler,
  fetchFilteredData,
};

// Начальный контекст формы (inline)
const INITIAL_CONTEXT = {
  "row1": null,
  "field1": {
    "value": "Иван Петров"
  },
  "field2": {
    "value": "ivan@example.com"
  },
  "field3": {
    "value": "Москва"
  }
};

export default function BakedForm() {
  const [context, setContext] = useState(INITIAL_CONTEXT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const handleContextUpdate = (newContext) => {
    if (!newContext || typeof newContext !== 'object') return;
    const { event, primitiveId, primitiveName, ...clean } = newContext;
    setContext(prev => ({ ...prev, ...clean }));
  };

  // Загрузка контекста (inline / url) и события onOpen/onLoad
  useEffect(() => {
    const src = "inline";
    let cancelled = false;
    (async () => {
      let data = INITIAL_CONTEXT;
      if (src === 'url' && CONTEXT_URL) {
        setLoading(true); setError(null);
        try {
          const res = await fetch(CONTEXT_URL);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const json = await res.json();
          if (!cancelled) { data = json; setContext(json); }
        } catch (e) {
          if (!cancelled) setError('Ошибка загрузки контекста: ' + e.message);
        } finally { if (!cancelled) setLoading(false); }
      }

      if (!cancelled && data !== INITIAL_CONTEXT) setContext(data);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>1</div>
//     <div className="form-preview">
//       {error && <div className="preview-error">{error}</div>}
//       {loading && <div className="preview-loading">Загрузка контекста...</div>}
//       <form className="preview-form" style={{"width":"100%","height":"100%","backgroundColor":"#ffffff","position":"relative"}} onSubmit={(e) => {
//         e.preventDefault();
//       }}>
//       <div
//         style={{
//         "width": "95%",
//         "height": "300px",
//         "border": "1px solid #ccc",
//         "borderRadius": "4px",
//         "left": "30",
//         "top": "320",
//       }}
//         data-primitive-id={"prim-1786340816100-kmkof9wze"}
//         data-primitive-name={"AGTable4"}
//       >
//           <AGTable
//             primitive={{"id":"prim-1786340816100-kmkof9wze","type":"agtable","name":"AGTable4","width":95,"height":300,"widthUnit":"%","heightUnit":"px","left":30,"top":320,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"visible":true,"dataSource":"function","functionName":"fetchFilteredData","useAuth":true,"serverPagination":true,"apiDataPath":"content","columnDefs":"[\n\t{\n        \"field\": \"id\",\n        \"headerName\": \"ID\"\n    },\n\t{\n        \"field\": \"smnemocode\",\n        \"headerName\": \"Код\",\n        \"width\": 500, \n        \"notFiltered\": true,\n        \"notSorted\": true\n    },\n\t{\n        \"field\": \"scaption\",\n        \"headerName\": \"Наименование\"\n    },\n\t{\n        \"field\": \"action\",\n        \"headerName\": \"123\",\n        \"width\": 100,\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"button\",\n        \"buttonText\": \"Hello\"\n    },\n\t{\n        \"field\": \"actions\",\n        \"headerName\": \"Действия\",\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"custom\",\n        \"cellContent\": [\n            {\n                \"type\": \"text\",\n                \"text\": \"Операции:\",\n                \"style\": {\n                    \"fontWeight\": \"bold\",\n                    \"marginRight\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн1\",\n                \"event\": \"cellButtonClick\",\n                \"style\": {\n                    \"backgroundColor\": \"#007bff\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн2\",\n                \"event\": \"cellButtonClick2\",\n                \"style\": {\n                    \"backgroundColor\": \"#28a745\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            }\n        ]\n    },\n\t{\n        \"field\": \"nactive\",\n        \"headerName\": \"Используется\"\n    }\n]","rowData":"","filterModel":"[\n\t{\n\t\t\"field\": \"id\",\n\t\t\"headerName\": \"ID\",\n\t\t\"type\":\"numeric\"\n\t},\n\t{\n\t\t\"field\": \"smnemocode\",\n\t\t\"headerName\": \"Код\",\n\t\t\"type\":\"string\"\n\t},\n\t{\n\t\t\"field\": \"scaption\",\n\t\t\"headerName\": \"Наименование\",\n\t\t\"type\":\"string\"\n\t}\n]","paginationPageSize":10,"selectable":false}}
//             context={context}
//             fns={fns}
//             onCellButtonClick={(event) => {
//           const c = {
//             event: {
//               data: event && event.data,
//               rowIndex: event && event.rowIndex,
//               node: event && event.node
//             },
//             primitiveId: 'prim-1786340816100-kmkof9wze',
//             primitiveName: "AGTable4"
//           };
//           const result = showHello(c);
//           if (result && typeof result === 'object') handleContextUpdate(result);
//           />
//       </div>

//   <div
//     style={{ {
//     "width": "600px",
//     "height": "300px",
//     "border": "1px solid #ccc",
//     "borderRadius": "4px",
//     "position": "absolute",
//     "left": "110",
//     "top": "350",
//   } }}
//     data-primitive-id={"prim-1787650426945-luxax84j9"}
//     data-primitive-name={"AGTable"}
//   >
//       <AGTable
//         primitive={{"id":"prim-1787650426945-luxax84j9","type":"agtable","name":"AGTable","width":600,"height":300,"widthUnit":"px","heightUnit":"px","left":110,"top":350,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"visible":true,"title":"Таблица","dataSource":"function","functionName":"fetchFilteredData","apiUrl":"","apiMethod":"GET","apiHeaders":"{}","useAuth":true,"serverPagination":true,"apiDataPath":"content","columnDefs":"[\n  // Первичный ключ\n  { field: 'id', headerName: 'ID', width: 80 },\n  // Основное имя\n  { field: 'name', headerName: 'Имя' }\n]","rowData":"[\n  { id: 1, name: 'Иван' },\n  { id: 2, name: 'Пётр' }\n]","filterModel":"[]","pagination":true,"paginationPageSize":10,"sortable":true,"filterable":true,"resizable":true,"selectable":false,"autoHeight":false,"position":"absolute"}}
//         context={context}
//         fns={fns}
//       />
//   </div>

//   <div
//     style={{ {
//     "width": "1100px",
//     "height": "610px",
//     "border": "1px solid #cccccc",
//     "borderRadius": "4px",
//     "padding": "4px 8px",
//     "fontSize": "14px",
//     "resize": "none",
//     "position": "absolute",
//     "left": "740",
//     "top": "350",
//   } }}
//     data-primitive-id={"prim-1787650529305-t1ls7qlvf"}
//     data-primitive-name={"Многострочный текст"}
//   >
//       <textarea
//         placeholder={"Введите текст..."}
//         name={"Многострочный текст"}
//         style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
//       >
// {JSON.stringify(context)}
//       </textarea>
//   </div>
//       </form>
//     </div>
  );
}
