// Маршрут просмотра готовой веб-формы (по параметру formId)
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import FormPreview from './FormPreview';
import { useEditor } from '../state/EditorContext';
import { loadFormById } from '../utils/formLoader';

function FormPreviewRoute() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const { state, loadForm } = useEditor();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Загрузка формы по параметру
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!formId) {
        setError('Не указан ID формы');
        return;
      }
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

  if (loading) {
    return <div className="route-loading centered">Загрузка формы...</div>;
  }

  if (error) {
    return (
      <div className="route-empty">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/" className="btn btn-primary">🏠 На главную</Link>
      </div>
    );
  }

  if (!state.form) {
    return (
      <div className="route-empty">
        <h2>Форма не загружена</h2>
        <Link to="/" className="btn btn-primary">🏠 На главную</Link>
      </div>
    );
  }

  return (
    <FormPreview onBack={() => {
      const formIdParam = state.form?.id;
      if (formIdParam) {
        navigate(`/editor/${encodeURIComponent(formIdParam)}`);
      } else {
        navigate('/');
      }
    }} />
  );
}

export default FormPreviewRoute;