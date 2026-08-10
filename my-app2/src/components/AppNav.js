// Постоянное навигационное меню приложения
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useEditor } from '../state/EditorContext';
import { loadFormsWithData, normalizeFormId } from '../utils/formLoader';

function AppNav() {
  const [forms, setForms] = useState([]);
  const [expanded, setExpanded] = useState(false);
  const { loadForm } = useEditor();
  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  // Загрузка списка форм для меню
  useEffect(() => {
    let cancelled = false;
    loadFormsWithData()
      .then(list => {
        if (!cancelled) setForms(list);
      })
      .catch(e => console.warn('Не удалось загрузить формы для навигации:', e.message));
    return () => { cancelled = true; };
  }, []);

  // Закрытие выпадающего меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setExpanded(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Открытие формы в редакторе и переход на его маршрут
  const handleOpenInEditor = (formData) => {
    loadForm(formData);
    const id = normalizeFormId(formData.id);
    setExpanded(false);
    navigate(`/editor/${encodeURIComponent(id)}`);
  };

  // Открытие готовой формы (просмотр без редактора)
  const handleOpenForm = (formData) => {
    loadForm(formData);
    const id = normalizeFormId(formData.id);
    setExpanded(false);
    navigate(`/forms/${encodeURIComponent(id)}`);
  };

  return (
    <nav className="app-nav">
      <div className="app-nav-brand">
        <span className="app-nav-logo">📋</span>
        <span className="app-nav-title">Конструктор веб-форм</span>
      </div>

      <div className="app-nav-links">
        <NavLink
          to="/editor"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          title="Редактор веб-форм"
        >
          ✏️ Редактор форм
        </NavLink>

        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            className="nav-link nav-dropdown-toggle"
            onClick={() => setExpanded(!expanded)}
            title="Открыть спроектированные веб-формы"
          >
            🗂️ Веб-формы
            <span className="nav-dropdown-caret">▾</span>
          </button>

          {expanded && (
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-header">
                Спроектированные веб-формы
              </div>
              <div className="nav-dropdown-list">
                {forms.length === 0 && (
                  <div className="nav-dropdown-empty">Нет созданных форм</div>
                )}
                {forms.map(form => (
                  <div key={form.id} className="nav-dropdown-item">
                    <span className="nav-dropdown-name" title={form.name}>
                      📄 {form.name}
                    </span>
                    <div className="nav-dropdown-actions">
                      <button
                        className="btn btn-sm"
                        onClick={() => handleOpenForm(form.data)}
                        title={`Открыть форму «${form.name}» как готовую веб-страницу`}
                      >
                        Открыть
                      </button>
                      <button
                        className="btn btn-sm"
                        onClick={() => handleOpenInEditor(form.data)}
                        title={`Редактировать форму «${form.name}»`}
                      >
                        ✏️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <NavLink
          to="/"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          end
          title="Главная страница со списком форм"
        >
          🏠 Главная
        </NavLink>

        <NavLink
          to="/login"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          title="Сохранение логина и пароля для запросов к API"
        >
          🔐 Авторизация
        </NavLink>
      </div>
    </nav>
  );
}

export default AppNav;