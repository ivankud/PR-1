// Главный компонент приложения с роутингом и постоянным меню
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';
import { EditorProvider } from './state/EditorContext';
import AppNav from './components/AppNav';
import HomePage from './components/HomePage';
import FormEditorRoute from './components/FormEditorRoute';
import FormPreviewRoute from './components/FormPreviewRoute';
import LoginPage from './components/LoginPage';
import IconsPage from './components/IconsPage';
import BakedForm from './newFolder/Itogovyy_primer_c_elementami_dlya_reestra2';

// Общий макет с постоянным навигационным меню
function AppLayout() {
  return (
    <div className="app">
      <AppNav />
      <main className="app-content">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            {/* Главная страница — список форм */}
            <Route path="/" element={<HomePage />} />

            {/* Редактор веб-форм */}
            <Route path="/editor" element={<FormEditorRoute />} />
            <Route path="/editor/:formId" element={<FormEditorRoute />} />

            {/* Готовые спроектированные веб-формы */}
            <Route path="/forms/:formId" element={<FormPreviewRoute />} />

            {/* Страница авторизации — сохранение логина/пароля для API */}
            <Route path="/login" element={<LoginPage />} />

            {/* Страница библиотеки иконок */}
            <Route path="/icons" element={<IconsPage />} />

            {/* Все остальные маршруты → главная */}
            <Route path="*" element={<Navigate to="/" replace />} />

            
            <Route path="/backedform" element={<BakedForm />} />

          </Route>
        </Routes>
      </BrowserRouter>
    </EditorProvider>
  );
}

export default App;