// Маршрут редактора форм (оборачивает FormEditor и загружает форму по параметру)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import FormEditor from './FormEditor';
import { useEditor } from '../state/EditorContext';
import { loadFormById, normalizeFormId } from '../utils/formLoader';

function FormEditorRoute() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { state, loadForm } = useEditor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Если в URL есть formId — загружаем форму
  useEffect(() => {
    if (!formId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadFormById(formId);
        if (!cancelled) loadForm(data);
      } catch (e) {
        if (!cancelled) setError('Не удалось загрузить форму: ' + e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [formId, loadForm]);

  // Если нет формы — показываем заглушку
  if (!state.form && !loading) {
    return (
      <div className="route-empty">
        <h2>Форма не загружена</h2>
        <p>Создайте новую форму или выберите существующую из меню.</p>
        <button className="btn btn-primary" onClick={() => navigate('/')}>
          🏠 На главную
        </button>
      </div>
    );
  }

  return (
    <div className="route-page">
      {loading && <div className="route-loading">Загрузка формы...</div>}
      {error && <div className="route-error">{error}</div>}
      {!loading && !error && (
        <FormEditor
          onBack={() => navigate('/')}
          onPreview={() => {
            const id = normalizeFormId(state.form?.id);
            if (id && state.form?.id) {
              navigate(`/forms/${encodeURIComponent(id)}`);
            }
          }}
        />
      )}
    </div>
  );
}

export default FormEditorRoute;