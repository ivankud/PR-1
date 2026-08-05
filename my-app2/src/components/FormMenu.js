// Меню со списком форм и ссылкой на конструктор
import React, { useState, useEffect } from 'react';
import { loadJson, createEmptyForm } from '../utils/jsonUtils';

function FormMenu({ onOpenForm, onCreateForm }) {
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Загрузка списка форм из public/forms/
  useEffect(() => {
    const formFiles = [
      'example-form'
    ];

    Promise.all(
      formFiles.map(async (file) => {
        try {
          const data = await loadJson(`/forms/${file}.json`);
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
    ).then(results => {
      setForms(results.filter(Boolean));
      setLoading(false);
    }).catch(err => {
      setError('Ошибка загрузки форм: ' + err.message);
      setLoading(false);
    });
  }, []);

  const handleCreateNew = () => {
    const newForm = createEmptyForm();
    onCreateForm(newForm);
  };

  return (
    <div className="form-menu">
      <header className="form-menu-header">
        <h1>Редактор веб-форм</h1>
        <button className="btn btn-primary" onClick={handleCreateNew}>
          ➕ Создать форму
        </button>
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
          {forms.map(form => (
            <div key={form.id} className="form-card">
              <div className="form-card-icon">📋</div>
              <div className="form-card-info">
                <div className="form-card-name">{form.name}</div>
                <div className="form-card-meta">
                  {form.canvas.width}×{form.canvas.height}px
                  {form.data.children ? ` · ${form.data.children.length} элементов` : ''}
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => onOpenForm(form.data)}
              >
                Открыть
              </button>
            </div>
          ))}
        </div>
      )}

      <footer className="form-menu-footer">
        <p>
          Формы хранятся в <code>public/forms/*.json</code>.
          Шаблоны примитивов — в <code>public/primitives/*.json</code>.
        </p>
      </footer>
    </div>
  );
}

export default FormMenu;