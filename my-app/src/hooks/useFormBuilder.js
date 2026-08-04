import { useState, useCallback } from 'react';
import { createElement, createEmptyForm } from '../utils/formSchema';
import { useLocalStorage } from './useLocalStorage';

/**
 * Хук управления состоянием конструктора форм.
 * Управляет элементами формы, выбором, и сохраняет всё в localStorage.
 */
export function useFormBuilder() {
  const [form, setForm] = useLocalStorage('form-builder-form', createEmptyForm);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Выбранный элемент
  const selectedElement = form.elements.find((el) => el.id === selectedElementId) || null;

  // Добавление элемента
  const addElement = useCallback(
    (type) => {
      const el = createElement(type);
      if (!el) return;
      setForm((prev) => ({
        ...prev,
        elements: [...prev.elements, el],
      }));
      setSelectedElementId(el.id);
    },
    [setForm]
  );

  // Обновление элемента
  const updateElement = useCallback(
    (elementId, updates) => {
      setForm((prev) => ({
        ...prev,
        elements: prev.elements.map((el) =>
          el.id === elementId ? { ...el, ...updates } : el
        ),
      }));
    },
    [setForm]
  );

  // Обновление события элемента
  const updateElementEvent = useCallback(
    (elementId, eventName, code) => {
      setForm((prev) => ({
        ...prev,
        elements: prev.elements.map((el) => {
          if (el.id !== elementId) return el;
          return {
            ...el,
            events: {
              ...el.events,
              [eventName]: code,
            },
          };
        }),
      }));
    },
    [setForm]
  );

  // Обновление события формы
  const updateFormEvent = useCallback(
    (eventName, code) => {
      setForm((prev) => ({
        ...prev,
        events: {
          ...prev.events,
          [eventName]: code,
        },
      }));
    },
    [setForm]
  );

  // Удаление элемента
  const removeElement = useCallback(
    (elementId) => {
      setForm((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.id !== elementId),
      }));
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [setForm, selectedElementId]
  );

  // Перемещение элемента вверх/вниз
  const moveElement = useCallback(
    (elementId, direction) => {
      setForm((prev) => {
        const index = prev.elements.findIndex((el) => el.id === elementId);
        if (index === -1) return prev;
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= prev.elements.length) return prev;

        const newElements = [...prev.elements];
        const [el] = newElements.splice(index, 1);
        newElements.splice(newIndex, 0, el);
        return { ...prev, elements: newElements };
      });
    },
    [setForm]
  );

  // Обновление имени формы
  const updateFormName = useCallback(
    (name) => {
      setForm((prev) => ({ ...prev, name }));
    },
    [setForm]
  );

  // Загрузка формы из JSON
  const loadFormFromJson = useCallback(
    (newForm) => {
      setForm(newForm);
      setSelectedElementId(null);
    },
    [setForm]
  );

  // Создание новой формы
  const createNewForm = useCallback(() => {
    setForm(createEmptyForm());
    setSelectedElementId(null);
  }, [setForm]);

  // Переключение режима предпросмотра
  const togglePreview = useCallback(() => {
    setPreviewMode((prev) => !prev);
    setSelectedElementId(null);
  }, []);

  return {
    form,
    selectedElement,
    selectedElementId,
    previewMode,
    setSelectedElementId,
    addElement,
    updateElement,
    updateElementEvent,
    updateFormEvent,
    removeElement,
    moveElement,
    updateFormName,
    loadFormFromJson,
    createNewForm,
    togglePreview,
  };
}