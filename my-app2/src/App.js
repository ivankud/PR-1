// Главный компонент приложения
import React, { useState } from 'react';
import './App.css';
import { EditorProvider, useEditor } from './state/EditorContext';
import FormMenu from './components/FormMenu';
import FormEditor from './components/FormEditor';

function AppContent() {
  const [view, setView] = useState('menu'); // 'menu' | 'editor'
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

  return (
    <div className="app">
      {view === 'menu' ? (
        <FormMenu
          onOpenForm={handleOpenForm}
          onCreateForm={handleCreateForm}
        />
      ) : (
        <FormEditor onBack={handleBack} />
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