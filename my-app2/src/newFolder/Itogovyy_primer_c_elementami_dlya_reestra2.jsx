// ===========================================================================
// Запечённая форма: Итоговый пример c элементами для реестра2
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
  alert('onLoadHandler');
  return context;
}

function onSubmitHandler(context) {
  console.log('Событие onSubmit: форма отправлена');
  context.eventLog = (context.eventLog || '') + 'onSubmit; ';
  context.onSubmitMessage = 'Событие onSubmit выполнено при отправке формы';
  alert('onSubmitHandler');
  return context;
}

// Объект-карта функций (нужен AGTable с dataSource = "function")
const fns = {
  onOpenHandler,
  onLoadHandler,
  onSubmitHandler,
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
    let cancelled = false;
    (async () => {
      let data = INITIAL_CONTEXT;
      // onOpen
      if (typeof fns["onOpenHandler"] === 'function') {
        const r = fns["onOpenHandler"](data);
        if (r && typeof r === 'object') data = { ...data, ...r };
      }

      // onLoad
      if (typeof fns["onLoadHandler"] === 'function') {
        const r = fns["onLoadHandler"](data);
        if (r && typeof r === 'object') data = { ...data, ...r };
      }

      if (!cancelled && data !== INITIAL_CONTEXT) setContext(data);
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="form-preview">
      {error && <div className="preview-error">{error}</div>}
      {loading && <div className="preview-loading">Загрузка контекста...</div>}
      <form className="preview-form" style={{"width":"100%","height":"100%","backgroundColor":"#ffffff","position":"relative"}} onSubmit={(e) => {
        e.preventDefault();
        if (typeof fns["onSubmitHandler"] === 'function') {
          const r = fns["onSubmitHandler"](context);
          if (r && typeof r === 'object') handleContextUpdate(r);
        }
      }}>
  <div
    style={{
    "width": "500px",
    "height": "30px",
    "fontSize": "16px",
    "color": "#1a1a2e",
    "fontFamily": "Arial, sans-serif",
    "fontWeight": "bold",
    "left": 30,
    "top": 110,
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
    "top": 167,
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
    "top": 311,
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
    "left": 40,
    "top": 395,
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
    "left": 80,
    "top": 459,
  }}
    data-primitive-id={"prim-events-log"}
    data-primitive-name={"Журнал событий"}
  >
      <label>
{resolveTemplate("Журнал: {{eventLog}}", {"id":"prim-events-log","type":"text","name":"Журнал событий","width":500,"height":30,"widthUnit":"px","heightUnit":"px","left":80,"top":459,"style":{"fontSize":"13px","color":"#666666","fontFamily":"Consolas, monospace"},"customProperties":{},"visible":true,"text":"Журнал: {{eventLog}}"}, context)}
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
    "color": "#fffff3",
    "border": "none",
    "borderRadius": "4px",
    "fontSize": "14px",
    "cursor": "pointer",
    "left": 620,
    "top": 73,
  }}
    data-primitive-id={"prim-events-submit-btn"}
    data-primitive-name={"Отправить форму"}
  >
      <button
        type={"button"}
      >
{"1111Отправить657 форму (onSubmit)"}
      </button>
  </div>

  <div
    style={{
    "width": "1330px",
    "height": "450px",
    "border": "1px solid #cccccc",
    "borderRadius": "4px",
    "padding": "4px 8px",
    "fontSize": "14px",
    "resize": "none",
    "left": 80,
    "top": 580,
  }}
    data-primitive-id={"prim-1787228533224-76cik9ahe"}
    data-primitive-name={"Многострочный текст"}
  >
      <textarea
        placeholder={""}
        name={"Многострочный текст"}
        style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}
      >
{JSON.stringify(context)}
      </textarea>
  </div>
      </form>
    </div>
  );
}
