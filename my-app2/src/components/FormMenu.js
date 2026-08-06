// Меню со списком форм и ссылкой на конструктор
import React, { useState, useEffect, useCallback } from 'react';
import { loadJson, createEmptyForm } from '../utils/jsonUtils';
import { getCanvasWidthValue, getCanvasHeightValue } from '../utils/sizeUtils';

// Получение списка JSON-файлов из манифеста /forms/index.json
async function getFormFiles() {
  try {
    const manifest = await loadJson(`/forms/index.json?t=${Date.now()}`);
    if (manifest && Array.isArray(manifest.forms)) {
      return manifest.forms;
    }
    return [];
  } catch (e) {
    console.warn('Не удалось загрузить манифест форм:', e.message);
    return [];
  }
}

function FormMenu({ onOpenForm, onCreateForm, onPreviewForm }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка списка форм из public/forms/
  const loadForms = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const formFiles = await getFormFiles();

      const results = await Promise.all(
        formFiles.map(async (file) => {
          try {
            // Добавляем timestamp для обхода кэша браузера
            const data = await loadJson(`/forms/${file}.json?t=${Date.now()}`);
            return {
              id: data.id || file,
              name: data.name || file,
              file: `${file}.json`,
              data,
              canvas: data.canvas || {}
            };
          } catch (e) {
            return null;
          }
        })
      );
      setForms(results.filter(Boolean));
    } catch (err) {
      setError('Ошибка загрузки форм: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Первичная загрузка
  useEffect(() => {
    loadForms();
  }, [loadForms]);

  const handleCreateNew = () => {
    const newForm = createEmptyForm();
    onCreateForm(newForm);
  };

  return (
    <div className="form-menu">
      <header className="form-menu-header">
        <h1>Редактор веб-форм</h1>
        <div className="form-menu-actions">
          <button
            className="btn btn-secondary"
            onClick={loadForms}
            disabled={loading}
            title="Обновить список форм из директории public/forms/"
          >
            🔄 Обновить
          </button>
          <button className="btn btn-primary" onClick={handleCreateNew}>
            ➕ Создать форму
          </button>
        </div>
      </header>

      {loading && <div className="form-menu-loading">Загрузка форм...</div>}
      {error && <div className="form-menu-error">{error}</div>}

      {!loading && !error && (
        <div className="form-list">
          {forms.length === 0 && (
            <div className="form-list-empty">
              Нет созданных форм. Нажмите «Создать форму».
            </div>
          )}
          {forms.map(form => {
            const canvas = form.canvas || {};
            const widthValue = getCanvasWidthValue(canvas);
            const heightValue = getCanvasHeightValue(canvas);
            return (
            <div key={form.id} className="form-card">
              <div className="form-card-icon">📋</div>
              <div className="form-card-info">
                <div className="form-card-name">{form.name}</div>
                <div className="form-card-meta">
                  {widthValue}×{heightValue}
                  {form.data.children ? ` · ${form.data.children.length} элементов` : ''}
                </div>
              </div>
              <div className="form-card-actions">
                <button
                  className="btn btn-secondary"
                  onClick={() => onOpenForm(form.data)}
                >
                  Открыть
                </button>
                {onPreviewForm && (
                  <button
                    className="btn btn-secondary"
                    onClick={() => onPreviewForm(form.data)}
                    title="Открыть форму как отдельную страницу"
                  >
                    👁 Просмотр
                  </button>
                )}
              </div>
            </div>
            );
          })}
        </div>
      )}

      <footer className="form-menu-footer">
        <p>
          Формы хранятся в <code>public/forms/*.json</code>.
          Список форм — в <code>public/forms/index.json</code>.
          Шаблоны примитивов — в <code>public/primitives/*.json</code>.
        </p>
      </footer>
    </div>
  );
}

export default FormMenu;