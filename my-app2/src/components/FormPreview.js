// Предпросмотр формы как отдельной страницы (без редактора)
import React, { useState, useEffect } from 'react';
import { useEditor } from '../state/EditorContext';
import { renderPrimitive, getPrimitiveTemplate } from '../utils/primitiveRenderer';
import { loadJson } from '../utils/jsonUtils';

// Рендер примитива в режиме предпросмотра (без выделения и drag&drop)
function PreviewPrimitive({ primitive, primitives, context }) {
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

  return (
    <div style={style}>
      {renderPrimitive(primitive, template, context)}
      {primitive.children && primitive.children.length > 0 && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
          {primitive.children.map(child => (
            <PreviewPrimitive
              key={child.id}
              primitive={child}
              primitives={primitives}
              context={context}
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

  // Обработка действия при открытии и загрузка контекста
  useEffect(() => {
    if (!form) return;

    const loadData = async () => {
      setLoading(false);
      setError(null);

      const source = form.context?.source;
      if (source === 'inline') {
        setContextData(form.context.inline || {});
      } else if (source === 'url') {
        if (form.context?.loadedData) {
          // Уже загруженные данные
          setContextData(form.context.loadedData);
          return;
        }
        setLoading(true);
        try {
          const data = await loadJson(form.context.url);
          setContextData(data);
        } catch (e) {
          setError('Ошибка загрузки контекста: ' + e.message);
        } finally {
          setLoading(false);
        }
      } else {
        setContextData({});
      }
    };

    loadData();
  }, [form]);

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
      </div>

      <div className="preview-container">
        {error && <div className="preview-error">{error}</div>}
        {loading && <div className="preview-loading">Загрузка контекста...</div>}

        {/* Форма как отдельная веб-страница */}
        <div
          className="preview-form"
          style={{
            width: canvas.width,
            height: canvas.height,
            backgroundColor: canvas.backgroundColor,
            position: 'relative'
          }}
        >
          {form.children && form.children.map(primitive => (
            <PreviewPrimitive
              key={primitive.id}
              primitive={primitive}
              primitives={primitives}
              context={contextData}
            />
          ))}
        </div>

        <div className="preview-footer">
          Статус: {loading ? 'загрузка контекста...' : error ? 'ошибка загрузки' : 'форма отображается'}
        </div>
      </div>
    </div>
  );
}

export default FormPreview;