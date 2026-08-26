// ===========================================================================
// Запечённая форма: Итоговый пример c элементами для реестра
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


  const vis_prim_1787118741241_01cwscqda = resolveCondition("{{rowT1}}", context);
  const vis_prim_1787120880874_bm8yigqgz = resolveCondition("{{rowT1.id}} !=6", context);
  const css_prim_1787147417868_2qn32xi3c_fontSize = resolveConditionalValue({"default":"14px","conditions":[{"when":"{{rowT1.id}} === 2","value":"20px"},{"when":"{{rowT1.id}} === 3","value":"40px"}]}, context);
  const css_prim_1787221882708_gg973e6bx_display = resolveConditionalValue({"default":"inline-flex","conditions":[{"when":"{{rowT1.id}}===1","value":"inline-flex"},{"when":"{{rowT1.id}}===2","value":"none"}]}, context);
  return (
    <div className="form-preview">
      {error && <div className="preview-error">{error}</div>}
      {loading && <div className="preview-loading">Загрузка контекста...</div>}
      <form className="preview-form" style={{"width":"100%","height":"100%","backgroundColor":"#ffffff","position":"relative"}} onSubmit={(e) => {
        e.preventDefault();
      }}>
  <div
    style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "fontWeight": "bold",
    "left": 20,
    "top": 160,
  }}
    data-primitive-id={"prim-label-2"}
    data-primitive-name={"Переменная 2"}
  >
      <label>
{context.field2.value}
      </label>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "fontWeight": "bold",
    "left": 20,
    "top": 210,
  }}
    data-primitive-id={"prim-label-3"}
    data-primitive-name={"Переменная 3"}
  >
      <label>
{context.field3.value}
      </label>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "40px",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 30,
    "top": 270,
  }}
    data-primitive-id={"prim-button-show-context"}
    data-primitive-name={"Показать контекст"}
  >
      <button
        type={"button"}
        onClick={(e) => {
      const c = {
        ...context,
        event: {
          type: e && e.type,
          target: e && e.target,
          value: e && e.target ? e.target.value : undefined,
          data: e && e.data,
          rowIndex: e && e.rowIndex,
          node: e && e.node
        },
        primitiveId: 'prim-button-show-context',
        primitiveName: "Показать контекст"
      };
      const result = showContext(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      >
{"Показать контекст"}
      </button>
  </div>

  <div
    style={{
    "width": "770px",
    "height": "260px",
    "border": "1px solid #cccccc",
    "borderRadius": "4px",
    "padding": "4px 8px",
    "fontSize": "14px",
    "resize": "none",
    "left": 40,
    "top": 1000,
  }}
    data-primitive-id={"prim-1787037632587-zodz3tbkm"}
    data-primitive-name={"Многострочный текст"}
  >
      <textarea
        placeholder={context.placeholder}
        name={"Многострочный текст"}
        style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
      >
{JSON.stringify(context)}
      </textarea>
  </div>

  <div
    style={{
    "width": "99%",
    "height": "60px",
    "border": "1px solid #ccc",
    "backgroundColor": "#f9f9f9",
    "borderRadius": "14px",
    "display": "flex",
    "flexDirection": "row",
    "gap": "20px",
    "justifyContent": "center",
    "alignItems": "center",
    "padding": "20px",
    "left": 10,
    "top": 20,
    "overflow": "visible",
  }}
    data-primitive-id={"prim-1786961305657-8hz2kz75l"}
    data-primitive-name={"Контейнер"}
  >
      <div>
    <div
      style={{
    "width": "120px",
    "height": "40px",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "position": "static",
    "display": "inline-flex",
    "alignItems": "center",
    "left": 0,
    "top": 0,
  }}
      data-primitive-id={"prim-1786963788167-l7sefqwis"}
      data-primitive-name={"Кнопка1"}
    >
        <button
          type={"button"}
          onClick={(e) => {
        const c = {
          ...context,
          event: {
            type: e && e.type,
            target: e && e.target,
            value: e && e.target ? e.target.value : undefined,
            data: e && e.data,
            rowIndex: e && e.rowIndex,
            node: e && e.node
          },
          primitiveId: 'prim-1786963788167-l7sefqwis',
          primitiveName: "Кнопка1"
        };
        const result = exampleFunction(c);
        if (result && typeof result === 'object') handleContextUpdate(result);
        }}
        >
          <IconSvg icon={"home"} size={16} color="currentColor" className="button-icon" />
{"новый контекст"}
        </button>
    </div>
    <div
      style={{
    "width": "120px",
    "height": "40px",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "position": "static",
    "left": 270,
    "top": 100,
  }}
      data-primitive-id={"prim-1786963803409-3hldh350h"}
      data-primitive-name={"Кнопка2"}
    >
        <button
          type={"button"}
        >
{"Кнопка2"}
        </button>
    </div>
    <div
      style={{
    "width": "120px",
    "height": "40px",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "position": "static",
    "left": 130,
    "top": 140,
  }}
      data-primitive-id={"prim-1786965629978-4vfz51td1"}
      data-primitive-name={"Кнопка3"}
    >
        <button
          type={"button"}
        >
{"Кнопка3"}
        </button>
    </div>
      </div>
  </div>

  <div
    style={{
    "width": "800px",
    "height": "35px",
    "border": "1px dashed #999999",
    "backgroundColor": "rgba(0, 123, 255, 0.05)",
    "borderRadius": "4px",
    "left": 10,
    "top": 99,
    "overflow": "visible",
  }}
    data-primitive-id={"group-1787041212990-r9b0eba6o"}
    data-primitive-name={"Группа"}
  >
      <div>
    <div
      style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "fontWeight": "bold",
    "left": 0,
    "top": 3,
  }}
      data-primitive-id={"prim-label-1"}
      data-primitive-name={"Переменная 1"}
    >
        <label>
{context.field1.value}
        </label>
    </div>
    <div
      style={{
    "width": "200px",
    "height": "35px",
    "border": "1px solid #cccccc",
    "borderRadius": "4px",
    "padding": "4px 8px",
    "fontSize": "14px",
    "left": 600,
    "top": 0,
  }}
      data-primitive-id={"prim-input-1"}
      data-primitive-name={"Поле ввода"}
    >
        <input
          type={"text"}
          placeholder={"Введите значение"}
          defaultValue={context.field1.value}
          value={context.field1.value}
          readOnly={false}
          name={"Поле ввода"}
          style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
          onChange={(e) => {
        const c = {
          ...context,
          event: {
            type: e && e.type,
            target: e && e.target,
            value: e && e.target ? e.target.value : undefined,
            data: e && e.data,
            rowIndex: e && e.rowIndex,
            node: e && e.node
          },
          primitiveId: 'prim-input-1',
          primitiveName: "Поле ввода"
        };
        const result = updateField1(c);
        if (result && typeof result === 'object') handleContextUpdate(result);
        }}
          onInput={(e) => {
        const c = {
          ...context,
          event: {
            type: e && e.type,
            target: e && e.target,
            value: e && e.target ? e.target.value : undefined,
            data: e && e.data,
            rowIndex: e && e.rowIndex,
            node: e && e.node
          },
          primitiveId: 'prim-input-1',
          primitiveName: "Поле ввода"
        };
        const result = updateField1(c);
        if (result && typeof result === 'object') handleContextUpdate(result);
        }}
         />
    </div>
      </div>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "140px",
    "border": "1px dashed #999999",
    "backgroundColor": "rgba(0, 123, 255, 0.05)",
    "borderRadius": "4px",
    "left": 250,
    "top": 185,
    "overflow": "visible",
  }}
    data-primitive-id={"group-1787048262752-wr4wqd4ln"}
    data-primitive-name={"Группа"}
  >
      <div>
    <div
      style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 0,
    "top": 0,
  }}
      data-primitive-id={"prim-1787048193367-5caupspwl"}
      data-primitive-name={"Текст (label)"}
    >
        <label>
{context.var1}
        </label>
    </div>
    <div
      style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 0,
    "top": 55,
  }}
      data-primitive-id={"prim-1787048195656-8a2cuw95c"}
      data-primitive-name={"Текст (label)"}
    >
        <label>
{context.var2}
        </label>
    </div>
    <div
      style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 0,
    "top": 110,
  }}
      data-primitive-id={"prim-1787048200328-aq345nrjc"}
      data-primitive-name={"Текст (label)"}
    >
        <label>
{context.var3}
        </label>
    </div>
      </div>
  </div>

  <div
    style={{
    "width": "95%",
    "height": "300px",
    "border": "1px solid #ccc",
    "borderRadius": "4px",
    "left": 30,
    "top": 320,
  }}
    data-primitive-id={"prim-1786340816100-kmkof9wze"}
    data-primitive-name={"AGTable4"}
  >
      <AGTable
        primitive={{"id":"prim-1786340816100-kmkof9wze","type":"agtable","name":"AGTable4","width":95,"height":300,"widthUnit":"%","heightUnit":"px","left":30,"top":320,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"visible":true,"dataSource":"function","functionName":"fetchFilteredData","useAuth":true,"serverPagination":true,"apiDataPath":"content","columnDefs":"[\n\t{\n        \"field\": \"id\",\n        \"headerName\": \"ID\"\n    },\n\t{\n        \"field\": \"smnemocode\",\n        \"headerName\": \"Код\",\n        \"width\": 500, \n        \"notFiltered\": true,\n        \"notSorted\": true\n    },\n\t{\n        \"field\": \"scaption\",\n        \"headerName\": \"Наименование\"\n    },\n\t{\n        \"field\": \"action\",\n        \"headerName\": \"123\",\n        \"width\": 100,\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"button\",\n        \"buttonText\": \"Hello\"\n    },\n\t{\n        \"field\": \"actions\",\n        \"headerName\": \"Действия\",\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"custom\",\n        \"cellContent\": [\n            {\n                \"type\": \"text\",\n                \"text\": \"Операции:\",\n                \"style\": {\n                    \"fontWeight\": \"bold\",\n                    \"marginRight\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн1\",\n                \"event\": \"cellButtonClick\",\n                \"style\": {\n                    \"backgroundColor\": \"#007bff\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн2\",\n                \"event\": \"cellButtonClick2\",\n                \"style\": {\n                    \"backgroundColor\": \"#28a745\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            }\n        ]\n    },\n\t{\n        \"field\": \"nactive\",\n        \"headerName\": \"Используется\"\n    }\n]","rowData":"","filterModel":"[\n\t{\n\t\t\"field\": \"id\",\n\t\t\"headerName\": \"ID\",\n\t\t\"type\":\"numeric\"\n\t},\n\t{\n\t\t\"field\": \"smnemocode\",\n\t\t\"headerName\": \"Код\",\n\t\t\"type\":\"string\"\n\t},\n\t{\n\t\t\"field\": \"scaption\",\n\t\t\"headerName\": \"Наименование\",\n\t\t\"type\":\"string\"\n\t}\n]","paginationPageSize":10,"selectable":false}}
        context={context}
        fns={fns}
        onCellButtonClick={(event) => {
      const c = {
        event: {
          data: event && event.data,
          rowIndex: event && event.rowIndex,
          node: event && event.node
        },
        primitiveId: 'prim-1786340816100-kmkof9wze',
        primitiveName: "AGTable4"
      };
      const result = showHello(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      />
  </div>

  <div
    style={{
    "width": "600px",
    "height": "300px",
    "border": "1px solid #ccc",
    "borderRadius": "4px",
    "left": 630,
    "top": 670,
  }}
    data-primitive-id={"prim-1786102930144-q2nldz6fu"}
    data-primitive-name={"AGTable2"}
  >
      <AGTable
        primitive={{"id":"prim-1786102930144-q2nldz6fu","type":"agtable","name":"AGTable2","width":600,"height":300,"widthUnit":"px","heightUnit":"px","left":630,"top":670,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"title":"Таблица 2 с кликом","apiUrl":"","rowData":"[\n\t{\n        \"id\": 1,\n        \"name\": \"Иван\"\n    }, \n\t{\n        \"id\": 2,\n        \"name\": \"Пётр2\"\n    }, \n\t{\n        \"id\": 3,\n        \"name\": \"Пётр3\"\n    }, \n\t{\n        \"id\": 4,\n        \"name\": \"Пётр4\"\n    }, \n\t{\n        \"id\": 5,\n        \"name\": \"Пётр5\"\n    }, \n\t{\n        \"id\": 6,\n        \"name\": \"Пётр6\"\n    }, \n\t{\n        \"id\": 7,\n        \"name\": \"Пётр7\"\n    }, \n\t{\n        \"id\": 8,\n        \"name\": \"Пётр8\"\n    }, \n\t{\n        \"id\": 9,\n        \"name\": \"Пётр9\"\n    }, \n\t{\n        \"id\": 10,\n        \"name\": \"Пётр10\"\n    }, \n\t{\n        \"id\": 11,\n        \"name\": \"Пётр11\"\n    },\n\t{\n        \"id\": 12,\n        \"name\": \"Иван12\"\n    }, \n\t{\n        \"id\": 13,\n        \"name\": \"Пётр13\"\n    }, \n\t{\n        \"id\": 14,\n        \"name\": \"Пётр14\"\n    }, \n\t{\n        \"id\": 15,\n        \"name\": \"Пётр15\"\n    }, \n\t{\n        \"id\": 16,\n        \"name\": \"Пётр16\"\n    }, \n\t{\n        \"id\": 17,\n        \"name\": \"Пётр17\"\n    }, \n\t{\n        \"id\": 18,\n        \"name\": \"Пётр18\"\n    }, \n\t{\n        \"id\": 19,\n        \"name\": \"Пётр19\"\n    }, \n\t{\n        \"id\": 20,\n        \"name\": \"Пётр20\"\n    }, \n\t{\n        \"id\": 31,\n        \"name\": \"Пётр31\"\n    }\n]\n"}}
        context={context}
        fns={fns}
        onRowClicked={(event) => {
      const c = {
        event: {
          data: event && event.data,
          rowIndex: event && event.rowIndex,
          node: event && event.node
        },
        primitiveId: 'prim-1786102930144-q2nldz6fu',
        primitiveName: "AGTable2"
      };
      const result = logRowClick(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      />
  </div>

  <div
    style={{
    "width": "600px",
    "height": "300px",
    "border": "1px solid #ccc",
    "borderRadius": "4px",
    "left": 30,
    "top": 670,
  }}
    data-primitive-id={"prim-1786339822648-9c5zd1t9p"}
    data-primitive-name={"AGTable1"}
  >
      <AGTable
        primitive={{"id":"prim-1786339822648-9c5zd1t9p","type":"agtable","name":"AGTable1","width":600,"height":300,"widthUnit":"px","heightUnit":"px","left":30,"top":670,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"title":"Таблица 1 подгрузка по апи из открытого источника","dataSource":"api","apiUrl":"https://jsonplaceholder.typicode.com/posts","columnDefs":"[\t{\n        \"field\": \"id\",\n        \"headerName\": \"ID\"\n    },\n\t{\n        \"field\": \"title\",\n        \"headerName\": \"Заголовок\"\n    },\n\t{\n        \"field\": \"body\",\n        \"headerName\": \"Текст\"\n    }\n]\n"}}
        context={context}
        fns={fns}
        onRowClicked={(event) => {
      const c = {
        event: {
          data: event && event.data,
          rowIndex: event && event.rowIndex,
          node: event && event.node
        },
        primitiveId: 'prim-1786339822648-9c5zd1t9p',
        primitiveName: "AGTable1"
      };
      const result = logRowClickT1(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      />
  </div>

  <div
    style={{
    "width": "600px",
    "height": "300px",
    "border": "1px solid #ccc",
    "borderRadius": "4px",
    "left": 1230,
    "top": 670,
  }}
    data-primitive-id={"prim-1786340816100-kmkof9wzc"}
    data-primitive-name={"AGTable3"}
  >
      <AGTable
        primitive={{"id":"prim-1786340816100-kmkof9wzc","type":"agtable","name":"AGTable3","width":600,"height":300,"widthUnit":"px","heightUnit":"px","left":1230,"top":670,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"title":"Таблица 3 подгрузка по апи из сваггер","dataSource":"api","apiUrl":"http://172.16.50.42:9977/app/api/1.0/auditprograms","useAuth":true,"serverPagination":true,"apiDataPath":"content","columnDefs":"[\n\t{\n        \"field\": \"id\",\n        \"headerName\": \"ID\"\n    },\n\t{\n        \"field\": \"smnemocode\",\n        \"headerName\": \"Код\"\n    },\n\t{\n        \"field\": \"scaption\",\n        \"headerName\": \"Наименование\"\n    },\n\t{\n        \"field\": \"nactive\",\n        \"headerName\": \"Используется\"\n    }\n]","rowData":"","paginationPageSize":10,"selectable":false}}
        context={context}
        fns={fns}
      />
  </div>

  <div
    style={{
    "width": "60px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 700,
    "top": 260,
  }}
    data-primitive-id={"prim-1787053217339-00kwzx4px"}
    data-primitive-name={"Кнопка222"}
  >
      <button
        type={"button"}
      >
        <IconSvg icon={"users"} size={16} color="currentColor" className="button-icon" />
{"333"}
      </button>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 250,
    "top": 155,
  }}
    data-primitive-id={"prim-1787117214473-4rt8dfbkj"}
    data-primitive-name={"Текст (label)"}
  >
      <label>
{"Еще не определенный контекст"}
      </label>
  </div>

  <div
    style={{
    "width": "320px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 1180,
    "top": 100,
  }}
    data-primitive-id={"prim-1787117307848-vn1u0hivu"}
    data-primitive-name={"label42"}
  >
      <label>
{"Пример одна кнопка скрывает другую"}
      </label>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 1180,
    "top": 120,
  }}
    data-primitive-id={"prim-1787117392064-uz61qe4dq"}
    data-primitive-name={"Button42"}
  >
      <button
        type={"button"}
        onClick={(e) => {
      const c = {
        ...context,
        event: {
          type: e && e.type,
          target: e && e.target,
          value: e && e.target ? e.target.value : undefined,
          data: e && e.data,
          rowIndex: e && e.rowIndex,
          node: e && e.node
        },
        primitiveId: 'prim-1787117392064-uz61qe4dq',
        primitiveName: "Button42"
      };
      const result = hideButton2(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      >
{"Button1"}
      </button>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 1360,
    "top": 120,
  }}
    data-primitive-id={"prim-1787117394680-c26kooe06"}
    data-primitive-name={"Button2"}
  >
      <button
        type={"button"}
      >
{"Button2"}
      </button>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 1230,
    "top": 630,
  }}
    data-primitive-id={"prim-1787118733529-fqtyyhewk"}
    data-primitive-name={"ButtonHT3"}
  >
      <button
        type={"button"}
        onClick={(e) => {
      const c = {
        ...context,
        event: {
          type: e && e.type,
          target: e && e.target,
          value: e && e.target ? e.target.value : undefined,
          data: e && e.data,
          rowIndex: e && e.rowIndex,
          node: e && e.node
        },
        primitiveId: 'prim-1787118733529-fqtyyhewk',
        primitiveName: "ButtonHT3"
      };
      const result = hideHideTable3(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      >
{"HideTable3"}
      </button>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 630,
    "top": 630,
  }}
    data-primitive-id={"prim-1787118737256-gw5kymsqd"}
    data-primitive-name={"ButtonHT2"}
  >
      <button
        type={"button"}
        onClick={(e) => {
      const c = {
        ...context,
        event: {
          type: e && e.type,
          target: e && e.target,
          value: e && e.target ? e.target.value : undefined,
          data: e && e.data,
          rowIndex: e && e.rowIndex,
          node: e && e.node
        },
        primitiveId: 'prim-1787118737256-gw5kymsqd',
        primitiveName: "ButtonHT2"
      };
      const result = hideHideTable2(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      >
{"HideTable2"}
      </button>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 30,
    "top": 630,
  ...(vis_prim_1787118741241_01cwscqda ? {} : { display: 'none' })
  }}
    data-primitive-id={"prim-1787118741241-01cwscqda"}
    data-primitive-name={"ButtonHT1"}
  >
      <button
        type={"button"}
        onClick={(e) => {
      const c = {
        ...context,
        event: {
          type: e && e.type,
          target: e && e.target,
          value: e && e.target ? e.target.value : undefined,
          data: e && e.data,
          rowIndex: e && e.rowIndex,
          node: e && e.node
        },
        primitiveId: 'prim-1787118741241-01cwscqda',
        primitiveName: "ButtonHT1"
      };
      const result = hideHideTable1(c);
      if (result && typeof result === 'object') handleContextUpdate(result);
      }}
      >
{"HideTable1"}
      </button>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 160,
    "top": 630,
  ...(vis_prim_1787120880874_bm8yigqgz ? {} : { display: 'none' })
  }}
    data-primitive-id={"prim-1787120880874-bm8yigqgz"}
    data-primitive-name={"ButtonST1"}
  >
      <button
        type={"button"}
      >
{"ShowRowT1"}
      </button>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 820,
    "top": 1005,
    fontSize: css_prim_1787147417868_2qn32xi3c_fontSize,
  }}
    data-primitive-id={"prim-1787147417868-2qn32xi3c"}
    data-primitive-name={"testlabel"}
  >
      <label>
{context.text}
      </label>
  </div>

  <div
    style={{
    "width": "490px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#333333",
    "fontFamily": "Arial, sans-serif",
    "left": 1180,
    "top": 180,
  }}
    data-primitive-id={"prim-1787221772309-9y9rokypq"}
    data-primitive-name={"label43"}
  >
      <label>
{"Меняется отображение кнопки в зависимости от условия по Таблице 1"}
      </label>
  </div>

  <div
    style={{
    "width": "120px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#007bff",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 1180,
    "top": 210,
    display: css_prim_1787221882708_gg973e6bx_display,
  }}
    data-primitive-id={"prim-1787221882708-gg973e6bx"}
    data-primitive-name={"ButtonCHC"}
  >
      <button
        type={"button"}
      >
{"ButtonCHC"}
      </button>
  </div>

  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "16px",
    "color": "#1a1a2e",
    "fontFamily": "Arial, sans-serif",
    "fontWeight": "bold",
    "left": 30,
    "top": 1330,
  }}
    data-primitive-id={"prim-events-title"}
    data-primitive-name={"Заголовок событий"}
  >
      <label>
{"Иллюстрация событий формы: onOpen, onLoad, onSubmit"}
      </label>
  </div>

  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#007bff",
    "fontFamily": "Arial, sans-serif",
    "left": 30,
    "top": 1370,
  }}
    data-primitive-id={"prim-events-onopen"}
    data-primitive-name={"Результат onOpen"}
  >
      <label>
{context.onOpenMessage}
      </label>
  </div>

  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#28a745",
    "fontFamily": "Arial, sans-serif",
    "left": 30,
    "top": 1410,
  }}
    data-primitive-id={"prim-events-onload"}
    data-primitive-name={"Результат onLoad"}
  >
      <label>
{context.onLoadMessage}
      </label>
  </div>

  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "14px",
    "color": "#dc3545",
    "fontFamily": "Arial, sans-serif",
    "left": 30,
    "top": 1450,
  }}
    data-primitive-id={"prim-events-onsubmit"}
    data-primitive-name={"Результат onSubmit"}
  >
      <label>
{context.onSubmitMessage}
      </label>
  </div>

  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "13px",
    "color": "#666666",
    "fontFamily": "Consolas, monospace",
    "left": 30,
    "top": 1490,
  }}
    data-primitive-id={"prim-events-log"}
    data-primitive-name={"Журнал событий"}
  >
      <label>
{resolveTemplate("Журнал: {{eventLog}}", {"id":"prim-events-log","type":"text","name":"Журнал событий","width":500,"height":30,"widthUnit":"px","heightUnit":"px","left":30,"top":1490,"style":{"fontSize":"13px","color":"#666666","fontFamily":"Consolas, monospace"},"customProperties":{},"text":"Журнал: {{eventLog}}"}, context)}
      </label>
  </div>

  <div
    style={{
    "width": "200px",
    "height": "40px",
    "display": "inline-flex",
    "alignItems": "center",
    "justifyContent": "center",
    "backgroundColor": "#28a745",
    "color": "#ffffff",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 30,
    "top": 1530,
  }}
    data-primitive-id={"prim-events-submit-btn"}
    data-primitive-name={"Отправить форму"}
  >
      <button
        type={"button"}
      >
{"Отправить форму (onSubmit)"}
      </button>
  </div>
      </form>
    </div>
  );
}
