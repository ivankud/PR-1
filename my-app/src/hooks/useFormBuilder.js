import { useState, useCallback } from 'react';
import {
  createElement,
  createEmptyForm,
  findElementById,
  updateElementInTree,
  removeElementFromTree,
} from '../utils/formSchema';
import { useLocalStorage } from './useLocalStorage';

/**
 * Хук управления состоянием конструктора форм.
 * Управляет элементами (включая вложенные в контейнеры), выбором,
 * позиционированием и сохраняет всё в localStorage.
 */
export function useFormBuilder() {
  const [form, setForm] = useLocalStorage('form-builder-form', createEmptyForm);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);

  // Выбранный элемент (рекурсивный поиск по дереву)
  const selectedElement = selectedElementId
    ? findElementById(form.elements, selectedElementId)
    : null;

  // Добавление элемента (в корень или в выбранный контейнер)
  const addElement = useCallback(
    (type, parentId = null) => {
      const el = createElement(type);
      if (!el) return;

      setForm((prev) => {
        // Если есть родительский контейнер, добавляем в него
        if (parentId) {
          return {
            ...prev,
            elements: updateElementInTree(prev.elements, parentId, (parent) => ({
              ...parent,
              children: [...(parent.children || []), el],
            })),
          };
        }
        // Иначе добавляем в корень
        return {
          ...prev,
          elements: [...prev.elements, el],
        };
      });
      setSelectedElementId(el.id);
    },
    [setForm]
  );

  // Обновление элемента (рекурсивно)
  const updateElement = useCallback(
    (elementId, updates) => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => ({
          ...el,
          ...updates,
        })),
      }));
    },
    [setForm]
  );

  // Обновление CSS-свойств элемента
  // Если изменяются width/height/left/top в CSS, синхронизируем числовые значения
  const updateElementCss = useCallback(
    (elementId, cssUpdates) => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => {
          const newCss = {
            ...(el.css || {}),
            ...cssUpdates,
          };
          const updates = { css: newCss };
          // Синхронизация числовых width/height из CSS (если значение в px)
          if (cssUpdates.width && /^\d+px$/.test(cssUpdates.width)) {
            updates.width = parseInt(cssUpdates.width, 10);
          }
          if (cssUpdates.height && /^\d+px$/.test(cssUpdates.height)) {
            updates.height = parseInt(cssUpdates.height, 10);
          }
          // Синхронизация числовых x/y из CSS left/top (если значение в px)
          if (cssUpdates.left && /^-?\d+px$/.test(cssUpdates.left)) {
            updates.x = parseInt(cssUpdates.left, 10);
          }
          if (cssUpdates.top && /^-?\d+px$/.test(cssUpdates.top)) {
            updates.y = parseInt(cssUpdates.top, 10);
          }
          return { ...el, ...updates };
        }),
      }));
    },
    [setForm]
  );

  // Обновление позиции элемента.
  // Изменение позиции также прописывается в CSS-стили (left/top).
  const updateElementPosition = useCallback(
    (elementId, x, y) => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => ({
          ...el,
          x,
          y,
          css: {
            ...(el.css || {}),
            left: `${x}px`,
            top: `${y}px`,
          },
        })),
      }));
    },
    [setForm]
  );

  // Обновление размера элемента.
  // Изменение размера также прописывается в CSS-стили элемента.
  const updateElementSize = useCallback(
    (elementId, width, height) => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => ({
          ...el,
          width,
          height,
          css: {
            ...(el.css || {}),
            width: `${width}px`,
            height: `${height}px`,
          },
        })),
      }));
    },
    [setForm]
  );

  // Обновление события элемента
  const updateElementEvent = useCallback(
    (elementId, eventName, code) => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => ({
          ...el,
          events: {
            ...(el.events || {}),
            [eventName]: code,
          },
        })),
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
          ...(prev.events || {}),
          [eventName]: code,
        },
      }));
    },
    [setForm]
  );

  // Удаление элемента (рекурсивно)
  const removeElement = useCallback(
    (elementId) => {
      setForm((prev) => ({
        ...prev,
        elements: removeElementFromTree(prev.elements, elementId),
      }));
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [setForm, selectedElementId]
  );

  // Перемещение элемента вверх/вниз (в пределах его родителя)
  const moveElement = useCallback(
    (elementId, direction) => {
      setForm((prev) => {
        const moveInList = (elements) => {
          const index = elements.findIndex((el) => el.id === elementId);
          if (index === -1) {
            // Ищем в вложенных
            return elements.map((el) => {
              if (el.children && el.children.length > 0) {
                return { ...el, children: moveInList(el.children) };
              }
              return el;
            });
          }
          const newIndex = index + direction;
          if (newIndex < 0 || newIndex >= elements.length) return elements;
          const newElements = [...elements];
          const [el] = newElements.splice(index, 1);
          newElements.splice(newIndex, 0, el);
          return newElements;
        };

        return { ...prev, elements: moveInList(prev.elements) };
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

  // Обновление настроек холста
  const updateCanvasSettings = useCallback(
    (settings) => {
      setForm((prev) => ({
        ...prev,
        canvas: {
          ...(prev.canvas || {}),
          ...settings,
        },
      }));
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
    updateElementCss,
    updateElementPosition,
    updateElementSize,
    updateElementEvent,
    updateFormEvent,
    removeElement,
    moveElement,
    updateFormName,
    updateCanvasSettings,
    loadFormFromJson,
    createNewForm,
    togglePreview,
  };
}