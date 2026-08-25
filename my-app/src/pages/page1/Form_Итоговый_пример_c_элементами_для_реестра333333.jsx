// Запечённая форма: Итоговый пример c элементами для реестра333333 (сгенерирована редактором форм)
// Примитивы записаны явно. Контекст/функции/события — в form-data.json
// (гибридный режим), якоря {{path}} резолвятся в рантайме через R().
import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  R, ms, containerChildStyle, bakedTableRows,
  getCanvasSizeStyle, getInitialContext, buildFunctions, callFunction,
  buildEventHandlers as ev, cellEvent, IconBaked, BakedAGTable
} from './baked-runtime';
import FORM_DATA_RAW from './form-data.json';

const FORM_DATA = FORM_DATA_RAW;

function BakedForm({ initialContext, onReady }) {
  const [context, setContext] = useState(() => initialContext || getInitialContext(FORM_DATA));
  const fns = useMemo(() => buildFunctions(FORM_DATA.functions), []);
  const doneRef = useRef(false);

  const updateContext = (next) => {
    if (!next || typeof next !== 'object') return;
    const clean = {};
    for (const k in next) {
      if (Object.prototype.hasOwnProperty.call(next, k) &&
          ['event', 'primitiveId', 'primitiveName'].indexOf(k) < 0) {
        clean[k] = next[k];
      }
    }
    setContext((prev) => ({ ...prev, ...clean }));
  };

  useEffect(() => {
    if (doneRef.current) return;
    doneRef.current = true;
    let data = initialContext || getInitialContext(FORM_DATA);
    const openFn = FORM_DATA.events && FORM_DATA.events.onOpen;
    if (openFn) {
      const r = callFunction(fns, openFn, data);
      if (r && typeof r === 'object') { data = { ...data, ...r }; setContext(data); }
    }
    const loadFn = FORM_DATA.events && FORM_DATA.events.onLoad;
    if (loadFn && data) {
      const lr = callFunction(fns, loadFn, data);
      if (lr && typeof lr === 'object') { data = { ...data, ...lr }; setContext(data); }
    }
    if (onReady) onReady({ context: data });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSubmit = (event) => {
    if (event) event.preventDefault();
    const submitFn = FORM_DATA.events && FORM_DATA.events.onSubmit;
    if (submitFn) {
      const r = callFunction(fns, submitFn, context);
      if (r && typeof r === 'object') updateContext(r);
    }
  };

  const ctx = context;
  const __p0 = {"id":"prim-1786340816100-kmkof9wze","type":"agtable","name":"AGTable4","width":95,"height":300,"widthUnit":"%","heightUnit":"px","left":30,"top":320,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"dataSource":"function","rowData":"","columnDefs":"[\n\t{\n        \"field\": \"id\",\n        \"headerName\": \"ID\"\n    },\n\t{\n        \"field\": \"smnemocode\",\n        \"headerName\": \"Код\",\n        \"width\": 500, \n        \"notFiltered\": true,\n        \"notSorted\": true\n    },\n\t{\n        \"field\": \"scaption\",\n        \"headerName\": \"Наименование\"\n    },\n\t{\n        \"field\": \"action\",\n        \"headerName\": \"123\",\n        \"width\": 100,\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"button\",\n        \"buttonText\": \"Hello\"\n    },\n\t{\n        \"field\": \"actions\",\n        \"headerName\": \"Действия\",\n        \"resizable\": false,\n        \"notFiltered\": true,\n        \"notSorted\": true,\n        \"cellRenderer\": \"custom\",\n        \"cellContent\": [\n            {\n                \"type\": \"text\",\n                \"text\": \"Операции:\",\n                \"style\": {\n                    \"fontWeight\": \"bold\",\n                    \"marginRight\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн1\",\n                \"event\": \"cellButtonClick\",\n                \"style\": {\n                    \"backgroundColor\": \"#007bff\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            },\n            {\n                \"type\": \"button\",\n                \"text\": \"Кн2\",\n                \"event\": \"cellButtonClick2\",\n                \"style\": {\n                    \"backgroundColor\": \"#28a745\",\n                    \"color\": \"#ffffff\",\n                    \"border\": \"none\",\n                    \"borderRadius\": \"4px\"\n                }\n            }\n        ]\n    },\n\t{\n        \"field\": \"nactive\",\n        \"headerName\": \"Используется\"\n    }\n]","useAuth":true,"apiDataPath":"content","paginationPageSize":10,"serverPagination":true,"selectable":false,"events":{"cellButtonClick":"showHello","cellButtonClick2":"showHello2"},"filterModel":"[\n\t{\n\t\t\"field\": \"id\",\n\t\t\"headerName\": \"ID\",\n\t\t\"type\":\"numeric\"\n\t},\n\t{\n\t\t\"field\": \"smnemocode\",\n\t\t\"headerName\": \"Код\",\n\t\t\"type\":\"string\"\n\t},\n\t{\n\t\t\"field\": \"scaption\",\n\t\t\"headerName\": \"Наименование\",\n\t\t\"type\":\"string\"\n\t}\n]","visible":true,"functionName":"fetchFilteredData"};
  const __p1 = {"id":"prim-1787650426945-luxax84j9","type":"agtable","name":"AGTable","visible":true,"position":"absolute","width":600,"height":300,"widthUnit":"px","heightUnit":"px","left":110,"top":350,"style":{"border":"1px solid #ccc","borderRadius":"4px"},"customProperties":{},"title":"Таблица","dataSource":"function","functionName":"fetchFilteredData","apiUrl":"","apiMethod":"GET","apiHeaders":"{}","useAuth":true,"serverPagination":true,"apiDataPath":"content","columnDefs":"[\n  // Первичный ключ\n  { field: 'id', headerName: 'ID', width: 80 },\n  // Основное имя\n  { field: 'name', headerName: 'Имя' }\n]","rowData":"[\n  { id: 1, name: 'Иван' },\n  { id: 2, name: 'Пётр' }\n]","filterModel":"[]","pagination":true,"paginationPageSize":10,"sortable":true,"filterable":true,"resizable":true,"selectable":false,"autoHeight":false};
  const __p2 = {"id":"prim-1787650529305-t1ls7qlvf","type":"textarea","name":"Многострочный текст","visible":true,"position":"absolute","width":1100,"height":610,"widthUnit":"px","heightUnit":"px","left":740,"top":350,"style":{"border":"1px solid #cccccc","borderRadius":"4px","padding":"4px 8px","fontSize":"14px","resize":"none"},"customProperties":{},"placeholder":"Введите текст...","value":"{{.}}"};

  const canvasStyle = getCanvasSizeStyle({"width":100,"height":100,"widthUnit":"%","heightUnit":"%","backgroundColor":"#ffffff","gridSize":10,"showGrid":true});
  return (
    <form
      className="baked-form"
      style={{ ...canvasStyle, backgroundColor: "#ffffff", position: 'relative' }}
      onSubmit={onSubmit}
    >
<div style={ms(__p0, ctx)} data-primitive-id={__p0.id} data-primitive-name={__p0.name}>
  <BakedAGTable primitive={__p0} context={ctx} fns={fns} onCellEvent={cellEvent(__p0, fns, ctx, updateContext)} />
</div>
<div style={ms(__p1, ctx)} data-primitive-id={__p1.id} data-primitive-name={__p1.name}>
  <BakedAGTable primitive={__p1} context={ctx} fns={fns} onCellEvent={cellEvent(__p1, fns, ctx, updateContext)} />
</div>
<div style={ms(__p2, ctx)} data-primitive-id={__p2.id} data-primitive-name={__p2.name}>
  <textarea placeholder={"Введите текст..."} name={"Многострочный текст"} style={{ width: "100%", height: "100%", boxSizing: "border-box", ...(__p2.style || {}) }} {...ev(__p2, fns, ctx, updateContext)}>{R("{{.}}", __p2, ctx)}</textarea>
</div>
    </form>
  );
}

export default BakedForm;
