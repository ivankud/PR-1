// Главный компонент приложения с роутингом и постоянным меню
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import './App.css';
import { EditorProvider } from './state/EditorContext';
import AppNav from './components/AppNav';
import HomePage from './components/HomePage';
import FormEditorRoute from './components/FormEditorRoute';
import FormPreviewRoute from './components/FormPreviewRoute';

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

            {/* Все остальные маршруты → главная */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </EditorProvider>
  );
}

export default App;