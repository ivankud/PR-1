// React Context для редактора форм
import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { editorReducer, initialState } from './reducer';
import { loadJson } from '../utils/jsonUtils';

const EditorContext = createContext(null);

export function EditorProvider({ children }) {
  const [state, dispatch] = useReducer(editorReducer, initialState);

  // Загрузка шаблонов примитивов при монтировании
  useEffect(() => {
    const primitiveFiles = [
      'button', 'text', 'input', 'textarea', 'container',
      'image', 'checkbox', 'radio', 'select', 'table'
    ];

    Promise.all(
      primitiveFiles.map(file => loadJson(`/primitives/${file}.json`))
    )
      .then(primitives => {
        dispatch({ type: 'LOAD_PRIMITIVES', primitives });
      })
      .catch(err => {
        console.error('Ошибка загрузки примитивов:', err);
      });
  }, []);

  // Горячие клавиши
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Z - отмена
      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      }
      // Ctrl+Y или Ctrl+Shift+Z - повтор
      if ((e.ctrlKey && e.key === 'y') || (e.ctrlKey && e.shiftKey && e.key === 'z')) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      }
      // Delete - удалить
      if (e.key === 'Delete' && state.selectedIds.length > 0) {
        e.preventDefault();
        dispatch({ type: 'DELETE_SELECTED' });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedIds]);

  // Загрузка формы
  const loadForm = useCallback((form) => {
    dispatch({ type: 'LOAD_FORM', form });
  }, []);

  // Создание новой формы
  const createNewForm = useCallback((form) => {
    dispatch({ type: 'LOAD_FORM', form });
  }, []);

  const value = {
    state,
    dispatch,
    loadForm,
    createNewForm
  };

  return (
    <EditorContext.Provider value={value}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error('useEditor must be used within EditorProvider');
  }
  return context;
}