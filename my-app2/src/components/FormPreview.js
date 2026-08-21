// Предпросмотр формы как отдельной страницы (без редактора)
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useEditor } from '../state/EditorContext';
import { renderPrimitive, getPrimitiveTemplate } from '../utils/primitiveRenderer';
import { resolveCondition, resolveConditionalValue } from '../utils/anchors';
import { loadJson } from '../utils/jsonUtils';
import { buildFunctions, callFunction, buildEventHandlersWithUpdate } from '../utils/functionRunner';
import { getSizeStyle, getCanvasSizeStyle } from '../utils/sizeUtils';

// Рендер примитива в режиме предпросмотра (без выделения и drag&drop)
function PreviewPrimitive({ primitive, primitives, context, fns, onUpdateContext }) {
  const template = getPrimitiveTemplate(primitives, primitive.type);

  // Условие видимости: настраивается в блоке "Свои свойства" (customProperties)
  // через ключ visibility — логическое выражение с ссылками на контекст {{path}}.
  // Пример: "{{rowT1}} != null" — примитив виден, когда переменная rowT1 существует в контексте.
  const visibilityCondition = primitive.customProperties?.visibility;
  const isVisible = resolveCondition(visibilityCondition, context);

  const style = {
    ...getSizeStyle(primitive),
    ...(primitive.style || {})
  };

  // Свойство position задаётся только если оно указано (не пустое).
  // Если position пустой/не задан — удаляем из стиля, чтобы использовался
  // стандартный поток документа (static).
  if (primitive.position) {
    style.position = primitive.position;
  } else {
    delete style.position;
  }

  // Свойства left/top задаются только если они указаны (не пустые)
  if (primitive.left !== undefined && primitive.left !== null && primitive.left !== '') {
    style.left = primitive.left;
  }
  if (primitive.top !== undefined && primitive.top !== null && primitive.top !== '') {
    style.top = primitive.top;
  }
  // Если left/top не заданы и нет в стилях — удаляем, чтобы использовать поток документа
  if (style.left === undefined || style.left === '') {
    delete style.left;
  }
  if (style.top === undefined || style.top === '') {
    delete style.top;
  }

  // Условные стили из настраиваемых свойств (customProperties).
  // Если ключ совпадает с CSS-свойством (например fontSize) и значение —
  // объект с conditions, вычисляем значение по контексту и применяем к стилю.
  const customProps = primitive.customProperties || {};
  for (const [key, value] of Object.entries(customProps)) {
    if (key === 'visibility') continue; // видимость обрабатывается отдельно
    if (typeof value === 'object' && value !== null && Array.isArray(value.conditions)) {
      const resolved = resolveConditionalValue(value, context);
      if (resolved !== undefined) {
        style[key] = resolved;
      }
    }
  }

  // Если условие видимости не выполнено — скрываем примитив
  if (!isVisible) {
    style.display = 'none';
  }

  // Для контейнеров
  if (primitive.children && primitive.children.length > 0) {
    style.overflow = 'visible';
  }

  // Если контейнер использует flex-раскладку, передаём её вложенному контейнеру детей,
  // чтобы дочерние примитивы корректно располагались (горизонтально/вертикально)
  const childrenStyle = {};
  if (primitive.style?.display === 'flex') {
    childrenStyle.display = 'flex';
    childrenStyle.flexDirection = primitive.style.flexDirection || 'row';
    childrenStyle.gap = primitive.style.gap;
    childrenStyle.justifyContent = primitive.style.justifyContent;
    childrenStyle.alignItems = primitive.style.alignItems;
  }

  // Создаем обработчики событий с callback для обновления контекста
  const handlers = useMemo(() => {
    if (!fns || !primitive?.events) return {};

    // Клонируем контекст для каждого обработчика
    const ctxClone = JSON.parse(JSON.stringify(context));
    return buildEventHandlersWithUpdate(primitive, fns, ctxClone, onUpdateContext);
  }, [primitive?.id, primitive?.events, context, fns, onUpdateContext]);

  // Обработчик событий из ячеек AGTable (кнопки в колонках с cellRenderer: 'custom')
  // Вызывает функцию формы по имени события, указанному в конфигурации кнопки
  const handleCellEvent = useMemo(() => {
    if (!fns || !primitive?.events) return undefined;
    return (cellParams) => {
      const { data, rowIndex, node, eventName } = cellParams || {};
      const fnName = primitive.events[eventName];
      if (!fnName || !fns[fnName]) return;

      // Клонируем контекст чтобы не мутировать
      const eventContext = JSON.parse(JSON.stringify(context));
      eventContext.event = {
        type: eventName,
        data,
        rowIndex,
        node
      };
      eventContext.primitiveId = primitive?.id;
      eventContext.primitiveName = primitive?.name;

      const result = callFunction(fns, fnName, eventContext);
      if (onUpdateContext && result && typeof result === 'object') {
        onUpdateContext(result);
      }
    };
  }, [primitive?.id, primitive?.events, primitive?.name, context, fns, onUpdateContext]);

  // Рендерим примитив и прикрепляем обработчики событий напрямую к элементу
  const rendered = renderPrimitive(primitive, template, context);
  const renderedWithHandlers = rendered && (Object.keys(handlers).length > 0 || handleCellEvent)
    ? React.cloneElement(rendered, { ...handlers, onCellEvent: handleCellEvent })
    : rendered;

  return (
    <div
      style={style}
      data-primitive-id={primitive.id}
      data-primitive-name={primitive.name}
    >
      {renderedWithHandlers}
      {primitive.children && primitive.children.length > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, ...childrenStyle }}>
          {primitive.children.map(child => (
            <PreviewPrimitive
              key={child.id}
              primitive={child}
              primitives={primitives}
              context={context}
              fns={fns}
              onUpdateContext={onUpdateContext}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function FormPreview({ onBack }) {
  const { state } = useEditor();
  const { form, primitives } = state;

  const [contextData, setContextData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Компиляция функций формы
  const fns = useMemo(() => buildFunctions(form?.functions), [form?.functions]);

  // Защита от повторного вызова onOpen/onLoad.
  // React.StrictMode в dev-режиме вызывает useEffect дважды (mount → unmount → mount),
  // из-за чего события onOpen/onLoad срабатывали бы два раза.
  // Храним id уже обработанной формы, чтобы выполнить события только один раз.
  const processedFormRef = useRef(null);

  // Обработка действия при открытии и загрузка контекста
  useEffect(() => {
    if (!form) return;
    // Если эта форма уже обработана (например, повторный вызов эффекта из StrictMode) — пропускаем
    if (processedFormRef.current === form.id) return;
    processedFormRef.current = form.id;

    const loadData = async () => {
      setLoading(false);
      setError(null);

      const source = form.context?.source;
      let data = {};

      if (source === 'inline') {
        data = form.context.inline || {};
        setContextData(data);
      } else if (source === 'url') {
        if (form.context?.loadedData) {
          data = form.context.loadedData;
          setContextData(data);
        } else {
          setLoading(true);
          try {
            data = await loadJson(form.context.url);
            setContextData(data);
          } catch (e) {
            setError('Ошибка загрузки контекста: ' + e.message);
          } finally {
            setLoading(false);
          }
        }
      } else {
        setContextData({});
      }

      // Вызов функции onOpen после загрузки контекста.
      // Если функция вернула обновлённый контекст — применяем его.
      const openFn = form.events?.onOpen;
      if (openFn && data) {
        const openResult = callFunction(fns, openFn, data);
        if (openResult && typeof openResult === 'object') {
          data = { ...data, ...openResult };
          setContextData(data);
        }
      }

      // Вызов функции onLoad после onOpen (событие загрузки формы).
      // Если функция вернула обновлённый контекст — применяем его.
      const loadFn = form.events?.onLoad;
      if (loadFn && data) {
        const loadResult = callFunction(fns, loadFn, data);
        if (loadResult && typeof loadResult === 'object') {
          data = { ...data, ...loadResult };
          setContextData(data);
        }
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Обработка отправки формы и обновления контекста из событий
  const handleContextUpdate = (newContext) => {
    if (!newContext || typeof newContext !== 'object') return;
    // Убираем служебные поля (event, primitiveId, primitiveName), чтобы они не попали в контекст
    const { event, primitiveId, primitiveName, ...cleanContext } = newContext;
    setContextData(prev => ({ ...prev, ...cleanContext }));
  };

  if (!form) {
    return (
      <div className="form-preview">
        <div className="preview-empty">Форма не загружена</div>
      </div>
    );
  }

  const canvas = form.canvas || {
    width: 800,
    height: 600,
    backgroundColor: '#ffffff',
    gridSize: 10,
    showGrid: true
  };

  const canvasSizeStyle = getCanvasSizeStyle(canvas);

  return (
    <div className="form-preview">
      <div className="preview-bar">
        <button className="btn btn-secondary" onClick={onBack} title="Вернуться к редактированию">
          ← Назад
        </button>
        <span className="preview-title">📋 {form.name}</span>
        <span className="preview-badge">Предпросмотр</span>
        {form.functions?.length > 0 && (
          <span className="preview-functions-count" title="Пользовательские функции">
            ⚙️ {form.functions.length}
          </span>
        )}
      </div>

      <div className="preview-container">
        {error && <div className="preview-error">{error}</div>}
        {loading && <div className="preview-loading">Загрузка контекста...</div>}

        {/* Форма как отдельная веб-страница */}
        <form
          className="preview-form"
          style={{
            ...canvasSizeStyle,
            backgroundColor: canvas.backgroundColor,
            position: 'relative'
          }}
          onSubmit={(e) => {
            e.preventDefault();
            const submitFn = form?.events?.onSubmit;
            if (submitFn) {
              const submitResult = callFunction(fns, submitFn, contextData);
              // Если функция вернула обновлённый контекст — применяем его
              if (submitResult && typeof submitResult === 'object') {
                handleContextUpdate(submitResult);
              }
            }
          }}
        >
          {form.children && form.children.map(primitive => (
            <PreviewPrimitive
              key={primitive.id}
              primitive={primitive}
              primitives={primitives}
              context={contextData}
              fns={fns}
              onUpdateContext={handleContextUpdate}
            />
          ))}
        </form>

        <div className="preview-footer">
          Статус: {loading ? 'загрузка контекста...' : error ? 'ошибка загрузки' : 'форма отображается'}
        </div>
      </div>
    </div>
  );
}

export default FormPreview;