// Предпросмотр формы как отдельной страницы (без редактора)
import React, { useState, useEffect, useMemo } from 'react';
import { useEditor } from '../state/EditorContext';
import { renderPrimitive, getPrimitiveTemplate } from '../utils/primitiveRenderer';
import { loadJson } from '../utils/jsonUtils';
import { buildFunctions, buildEventHandlers, callFunction } from '../utils/functionRunner';

// Рендер примитива в режиме предпросмотра (без выделения и drag&drop)
function PreviewPrimitive({ primitive, primitives, context, fns }) {
  const template = getPrimitiveTemplate(primitives, primitive.type);

  const style = {
    position: 'absolute',
    left: primitive.left || 0,
    top: primitive.top || 0,
    width: primitive.width || 100,
    height: primitive.height || 40,
    ...(primitive.style || {})
  };

  // Для контейнеров
  if (primitive.children && primitive.children.length > 0) {
    style.overflow = 'visible';
  }

  // Обработчики событий для этого примитива (React-пропсы: onClick, onBlur и т.д.)
  const handlers = buildEventHandlers(primitive, fns, context);

  // Рендерим примитив и прикрепляем обработчики событий напрямую к элементу
  const rendered = renderPrimitive(primitive, template, context);
  const renderedWithHandlers = rendered && Object.keys(handlers).length > 0
    ? React.cloneElement(rendered, handlers)
    : rendered;

  return (
    <div
      style={style}
      data-primitive-id={primitive.id}
    >
      {renderedWithHandlers}
      {primitive.children && primitive.children.length > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {primitive.children.map(child => (
            <PreviewPrimitive
              key={child.id}
              primitive={child}
              primitives={primitives}
              context={context}
              fns={fns}
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

  // Обработка действия при открытии и загрузка контекста
  useEffect(() => {
    if (!form) return;

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

      // Вызов функции onOpen после загрузки контекста
      const openFn = form.events?.onOpen;
      if (openFn && data) {
        callFunction(fns, openFn, data);
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  // Обработка отправки формы
  const handleSubmit = (e) => {
    e.preventDefault();
    const submitFn = form?.events?.onSubmit;
    if (submitFn) {
      callFunction(fns, submitFn, contextData);
    }
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
            width: canvas.width,
            height: canvas.height,
            backgroundColor: canvas.backgroundColor,
            position: 'relative'
          }}
          onSubmit={handleSubmit}
        >
          {form.children && form.children.map(primitive => (
            <PreviewPrimitive
              key={primitive.id}
              primitive={primitive}
              primitives={primitives}
              context={contextData}
              fns={fns}
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