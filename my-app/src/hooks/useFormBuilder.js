import { useState, useCallback } from 'react';
import {
  createElement,
  createEmptyForm,
  ensureRootContainer,
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
  const [form, setForm] = useLocalStorage(
    'form-builder-form',
    () => ensureRootContainer(createEmptyForm())
  );
  const [selectedElementId, setSelectedElementIdState] = useState(null);
  const [selectedElementIds, setSelectedElementIds] = useState([]);
  const [previewMode, setPreviewMode] = useState(false);

  // Обёртка над setter'ом: одиночный выбор сбрасывает множественное выделение.
  const setSelectedElementId = useCallback((id) => {
    setSelectedElementIdState(id);
    setSelectedElementIds(id ? [id] : []);
  }, []);

  // Выбранный элемент (рекурсивный поиск по дереву)
  const selectedElement = selectedElementId
    ? findElementById(form.elements, selectedElementId)
    : null;
  // Все выбранные элементы (рекурсивный поиск по дереву)
  const selectedElements = selectedElementIds
    .map((id) => findElementById(form.elements, id))
    .filter(Boolean);

  // Установка выделенных элементов.
  // Массив ids синхронизируется с основным selectedElementId (первый элемент или null).
  const selectElements = useCallback(
    (elementIds) => {
      const uniqueIds = [...new Set(elementIds.filter(Boolean))];
      setSelectedElementIds(uniqueIds);
      setSelectedElementIdState(uniqueIds.length > 0 ? uniqueIds[0] : null);
    },
    []
  );

  // Добавление элемента (в выбранный контейнер или в корневой контейнер)
  const addElement = useCallback(
    (type, parentId = null) => {
      const el = createElement(type);
      if (!el) return;

      setForm((prev) => {
        // Определяем родителя: переданный контейнер или корневой контейнер
        let targetParentId = parentId;
        if (!targetParentId) {
          const root = prev.elements.find((e) => e.isRoot);
          targetParentId = root ? root.id : null;
        }

        // Если есть родительский контейнер, добавляем в него
        if (targetParentId) {
          return {
            ...prev,
            elements: updateElementInTree(prev.elements, targetParentId, (parent) => ({
              ...parent,
              children: [...(parent.children || []), el],
            })),
          };
        }
        // Иначе добавляем в корень списка
        return {
          ...prev,
          elements: [...prev.elements, el],
        };
      });
      setSelectedElementId(el.id);
    },
    [setForm, setSelectedElementId]
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
          // Синхронизация числовых width/height из CSS (если значение в px или %)
          if (cssUpdates.width && /^\d+px$/.test(cssUpdates.width)) {
            updates.width = parseInt(cssUpdates.width, 10);
            updates.widthUnit = 'px';
          } else if (cssUpdates.width && /^\d+%$/.test(cssUpdates.width)) {
            updates.width = parseInt(cssUpdates.width, 10);
            updates.widthUnit = '%';
          }
          if (cssUpdates.height && /^\d+px$/.test(cssUpdates.height)) {
            updates.height = parseInt(cssUpdates.height, 10);
            updates.heightUnit = 'px';
          } else if (cssUpdates.height && /^\d+%$/.test(cssUpdates.height)) {
            updates.height = parseInt(cssUpdates.height, 10);
            updates.heightUnit = '%';
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
  // Поддерживаются единицы измерения: px и %.
  const updateElementSize = useCallback(
    (elementId, width, height, widthUnit = 'px', heightUnit = 'px') => {
      setForm((prev) => ({
        ...prev,
        elements: updateElementInTree(prev.elements, elementId, (el) => ({
          ...el,
          width,
          height,
          widthUnit,
          heightUnit,
          css: {
            ...(el.css || {}),
            width: `${width}${widthUnit}`,
            height: `${height}${heightUnit}`,
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

  // Удаление элемента (рекурсивно).
  // Корневой контейнер удалить нельзя.
  const removeElement = useCallback(
    (elementId) => {
      setForm((prev) => {
        // Проверяем, является ли элемент корневым контейнером
        const isRoot = prev.elements.some((e) => e.id === elementId && e.isRoot);
        if (isRoot) return prev;

        return {
          ...prev,
          elements: removeElementFromTree(prev.elements, elementId),
        };
      });
      if (selectedElementId === elementId) {
        setSelectedElementId(null);
      }
    },
    [setForm, selectedElementId, setSelectedElementId]
  );

  // Удаление нескольких элементов.
  // Корневые контейнеры не удаляются.
  const removeElements = useCallback(
    (elementIds) => {
      const ids = [...new Set(elementIds.filter(Boolean))];
      if (ids.length === 0) return;

      setForm((prev) => {
        const isRootId = (id) => prev.elements.some((e) => e.id === id && e.isRoot);
        const removableIds = ids.filter((id) => !isRootId(id));
        if (removableIds.length === 0) return prev;

        let elements = prev.elements;
        removableIds.forEach((id) => {
          elements = removeElementFromTree(elements, id);
        });
        return { ...prev, elements };
      });
      // Сброс выделения
      setSelectedElementIds([]);
      setSelectedElementIdState(null);
    },
    [setForm]
  );

  // Дублирование элемента (рекурсивно).
  // Создаёт копию элемента с новым id и размещает её сразу после оригинала.
  const duplicateElement = useCallback(
    (elementId) => {
      const copyId = `${elementId}-copy-${Date.now()}`;
      setForm((prev) => {
        const duplicateInList = (elements) => {
          const index = elements.findIndex((el) => el.id === elementId);
          if (index === -1) {
            // Ищем во вложенных
            return elements.map((el) => {
              if (el.children && el.children.length > 0) {
                return { ...el, children: duplicateInList(el.children) };
              }
              return el;
            });
          }
          const original = elements[index];
          if (original.isRoot) return elements;

          const copy = JSON.parse(JSON.stringify(original));
          copy.id = copyId;
          copy.x = (original.x || 0) + 20;
          copy.y = (original.y || 0) + 20;
          if (copy.children) {
            copy.children = copy.children.map((child) => ({
              ...child,
              id: `${child.id}-copy-${Date.now()}`,
            }));
          }

          const newElements = [...elements];
          newElements.splice(index + 1, 0, copy);
          return newElements;
        };

        return { ...prev, elements: duplicateInList(prev.elements) };
      });
      // Выделяем копию
      setSelectedElementId(copyId);
    },
    [setForm, setSelectedElementId]
  );

  // Дублирование нескольких элементов.
  // Дублирует элемент с самым ранним индексом в дереве и выделяет созданные копии.
  const duplicateElements = useCallback(
    (elementIds) => {
      const ids = [...new Set(elementIds.filter(Boolean))];
      if (ids.length === 0) return;

      const copyIds = [];
      setForm((prev) => {
        let elements = prev.elements;
        ids.forEach((elementId) => {
          const copyId = `${elementId}-copy-${Date.now()}-${copyIds.length}`;
          copyIds.push(copyId);
          const duplicateInList = (list) => {
            const index = list.findIndex((el) => el.id === elementId);
            if (index === -1) {
              return list.map((el) => {
                if (el.children && el.children.length > 0) {
                  return { ...el, children: duplicateInList(el.children) };
                }
                return el;
              });
            }
            const original = list[index];
            if (original.isRoot) return list;

            const copy = JSON.parse(JSON.stringify(original));
            copy.id = copyId;
            copy.x = (original.x || 0) + 20;
            copy.y = (original.y || 0) + 20;
            if (copy.children) {
              copy.children = copy.children.map((child) => ({
                ...child,
                id: `${child.id}-copy-${Date.now()}`,
              }));
            }

            const newList = [...list];
            newList.splice(index + 1, 0, copy);
            return newList;
          };
          elements = duplicateInList(elements);
        });
        return { ...prev, elements };
      });
      // Выделяем созданные копии
      selectElements(copyIds);
    },
    [setForm, selectElements]
  );

  // Перемещение элемента вверх/вниз (в пределах его родителя)
  const moveElement = useCallback(
    (elementId, direction) => {
      setForm((prev) => {
        const moveInList = (elements) => {
          const index = elements.findIndex((el) => el.id === elementId);
          if (index === -1) {
            // Ищем во вложенных
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

  // Перемещение нескольких элементов вверх/вниз.
  const moveElements = useCallback(
    (elementIds, direction) => {
      const ids = [...new Set(elementIds.filter(Boolean))];
      if (ids.length === 0) return;
      ids.forEach((id) => moveElement(id, direction));
    },
    [moveElement]
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

  // Загрузка формы из JSON (с гарантией наличия корневого контейнера)
  const loadFormFromJson = useCallback(
    (newForm) => {
      setForm(ensureRootContainer(newForm));
      setSelectedElementId(null);
    },
    [setForm, setSelectedElementId]
  );

  // Создание новой формы
  const createNewForm = useCallback(() => {
    setForm(createEmptyForm());
    setSelectedElementId(null);
  }, [setForm, setSelectedElementId]);

  // Переключение режима предпросмотра
  const togglePreview = useCallback(() => {
    setPreviewMode((prev) => !prev);
    setSelectedElementId(null);
  }, [setSelectedElementId]);

  return {
    form,
    selectedElement,
    selectedElementId,
    selectedElementIds,
    selectedElements,
    previewMode,
    setSelectedElementId,
    selectElements,
    addElement,
    updateElement,
    updateElementCss,
    updateElementPosition,
    updateElementSize,
    updateElementEvent,
    updateFormEvent,
    removeElement,
    removeElements,
    duplicateElement,
    duplicateElements,
    moveElement,
    moveElements,
    updateFormName,
    updateCanvasSettings,
    loadFormFromJson,
    createNewForm,
    togglePreview,
  };
}