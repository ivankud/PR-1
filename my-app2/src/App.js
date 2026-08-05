// Главный компонент приложения
import React, { useState } from 'react';
import './App.css';
import { EditorProvider, useEditor } from './state/EditorContext';
import FormMenu from './components/FormMenu';
import FormEditor from './components/FormEditor';
import FormPreview from './components/FormPreview';

function AppContent() {
  const [view, setView] = useState('menu'); // 'menu' | 'editor' | 'preview'
  const { loadForm } = useEditor();

  const handleOpenForm = (form) => {
    loadForm(form);
    setView('editor');
  };

  const handleCreateForm = (form) => {
    loadForm(form);
    setView('editor');
  };

  const handleBack = () => {
    setView('menu');
  };

  const handlePreview = () => {
    setView('preview');
  };

  const handlePreviewBack = () => {
    setView('editor');
  };

  const handlePreviewFromMenu = (form) => {
    loadForm(form);
    setView('preview');
  };

  return (
    <div className="app">
      {view === 'menu' && (
        <FormMenu
          onOpenForm={handleOpenForm}
          onCreateForm={handleCreateForm}
          onPreviewForm={handlePreviewFromMenu}
        />
      )}
      {view === 'editor' && (
        <FormEditor onBack={handleBack} onPreview={handlePreview} />
      )}
      {view === 'preview' && (
        <FormPreview onBack={handlePreviewBack} />
      )}
    </div>
  );
}

function App() {
  return (
    <EditorProvider>
      <AppContent />
    </EditorProvider>
  );
}

export default App;