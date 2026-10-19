// Постоянное навигационное меню приложения
import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useEditor } from '../state/EditorContext';
import { loadFormsWithData, normalizeFormId } from '../utils/formLoader';
import { listBakedPages } from '../baked/pagesRegistry';

function AppNav() {
  const [forms, setForms] = useState([]);
  // Сгенерированные страницы (src/baked) — синхронный реестр из каталога
  const [bakedPages] = useState(() => {
    try {
      return listBakedPages();
    } catch (e) {
      console.warn('Не удалось получить список сгенерированных страниц:', e.message);
      return [];
    }
  });
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
        {/* <span className="app-nav-logo">📋</span> */}
        <span className="app-nav-title">Конструктор 🛁</span>
      </div>

      <div className="app-nav-links">
        <NavLink
          to="/editor"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          title="Редактор веб-форм"
        >
          ✏️ Редактор форм
        </NavLink>

        {/* Раздел «Мои формы»: исходные формы + сгенерированные страницы */}
        <div className="nav-dropdown" ref={dropdownRef}>
          <button
            className="nav-link nav-dropdown-toggle"
            onClick={() => setExpanded(!expanded)}
            title="Мои формы: исходные формы и сгенерированные страницы"
          >
            🗂️ Мои формы
            <span className="nav-dropdown-caret">▾</span>
          </button>

          {expanded && (
            <div className="nav-dropdown-menu">
              <div className="nav-dropdown-header">
                Исходные формы
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

              {/* Сгенерированные страницы (src/baked/{n}/) */}
              <div className="nav-dropdown-header">
                <Link to="/pages" className="nav-dropdown-header-link" onClick={() => setExpanded(false)}>
                  Сгенерированные страницы →
                </Link>
              </div>
              <div className="nav-dropdown-list">
                {bakedPages.length === 0 && (
                  <div className="nav-dropdown-empty">Нет сгенерированных страниц</div>
                )}
                {bakedPages.map(page => (
                  <div key={page.folder} className="nav-dropdown-item">
                    <span className="nav-dropdown-name" title={`src/baked/${page.folder}/`}>
                      📦 {page.name}
                    </span>
                    <div className="nav-dropdown-actions">
                      <Link
                        to={`/pages/${encodeURIComponent(page.folder)}`}
                        className="btn btn-sm"
                        onClick={() => setExpanded(false)}
                        title={`Открыть сгенерированную страницу «${page.name}»`}
                      >
                        Открыть
                      </Link>
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
          to="/icons"
          className={({ isActive }) => 'nav-link' + (isActive ? ' active' : '')}
          title="Библиотека SVG-иконок"
        >
          🎨 Иконки
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