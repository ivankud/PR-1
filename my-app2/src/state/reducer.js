// Reducer для редактора форм
import { deepClone, generateId, findPrimitive, findParent } from '../utils/jsonUtils';
import { createPrimitiveFromTemplate } from '../utils/primitiveRenderer';
import { updateSize } from '../utils/sizeUtils';

const MAX_HISTORY = 100;

// Начальное состояние
export const initialState = {
  form: null,
  primitives: [],          // шаблоны примитивов
  selectedIds: [],         // выделенные примитивы
  zoom: 1,
  history: [],             // прошлые состояния формы
  historyIndex: -1,        // текущая позиция в истории
  isDirty: false
};

// Добавление состояния в историю
function pushHistory(state, form) {
  const newHistory = state.history.slice(0, state.historyIndex + 1);
  newHistory.push(deepClone(form));
  if (newHistory.length > MAX_HISTORY) {
    newHistory.shift();
  }
  return {
    ...state,
    history: newHistory,
    historyIndex: newHistory.length - 1
  };
}

// Обновление примитива в дереве (рекурсивно)
function updatePrimitiveInTree(node, id, updater) {
  if (!node) return node;
  if (node.id === id) {
    return updater(node);
  }
  if (node.children) {
    return {
      ...node,
      children: node.children.map(child => updatePrimitiveInTree(child, id, updater))
    };
  }
  return node;
}

// Удаление примитива из дерева
function removePrimitiveFromTree(node, id) {
  if (!node) return node;
  if (node.children) {
    const filtered = node.children.filter(child => child.id !== id);
    return {
      ...node,
      children: filtered.map(child => removePrimitiveFromTree(child, id))
    };
  }
  return node;
}

// Получение всех примитивов с детьми (для группировки)
function collectWithChildren(node, ids, result = []) {
  if (!node) return result;
  if (ids.includes(node.id)) {
    result.push(node);
    if (node.children) {
      for (const child of node.children) {
        collectWithChildren(child, ids, result);
      }
    }
  } else if (node.children) {
    for (const child of node.children) {
      collectWithChildren(child, ids, result);
    }
  }
  return result;
}

export function editorReducer(state, action) {
  switch (action.type) {
    case 'LOAD_FORM': {
      return {
        ...state,
        form: action.form,
        selectedIds: [],
        history: [deepClone(action.form)],
        historyIndex: 0,
        isDirty: false
      };
    }

    case 'LOAD_PRIMITIVES': {
      return { ...state, primitives: action.primitives };
    }

    case 'ADD_PRIMITIVE': {
      if (!state.form) return state;
      const primitiveType = action.primitiveType || action.type;
      const template = state.primitives.find(p => p.type === primitiveType);
      if (!template) return state;

      const newPrimitive = createPrimitiveFromTemplate(template, action.id || generateId());
      // Позиционируем в центре холста
      const canvas = state.form.canvas || { width: 800, height: 600 };
      newPrimitive.left = action.left !== undefined ? action.left : Math.round((canvas.width - newPrimitive.width) / 2);
      newPrimitive.top = action.top !== undefined ? action.top : Math.round((canvas.height - newPrimitive.height) / 2);

      const newForm = {
        ...state.form,
        children: [...(state.form.children || []), newPrimitive]
      };

      return pushHistory({
        ...state,
        form: newForm,
        selectedIds: [newPrimitive.id],
        isDirty: true
      }, newForm);
    }

    case 'MOVE_PRIMITIVES': {
      if (!state.form) return state;
      const { dx, dy } = action;
      let newForm = deepClone(state.form);

      for (const id of state.selectedIds) {
        newForm = updatePrimitiveInTree(newForm, id, (node) => ({
          ...node,
          left: (node.left || 0) + dx,
          top: (node.top || 0) + dy
        }));
      }

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    // Живое перемещение с абсолютным позиционированием (без записи в историю)
    case 'MOVE_PRIMITIVES_LIVE': {
      if (!state.form) return state;
      const { dx, dy } = action;

      // Если переданы absolute positions, используем их
      if (action.positions) {
        let newForm = deepClone(state.form);
        for (const [id, pos] of Object.entries(action.positions)) {
          newForm = updatePrimitiveInTree(newForm, id, (node) => ({
            ...node,
            left: pos.left,
            top: pos.top
          }));
        }
        return { ...state, form: newForm, isDirty: true };
      }

      // backward compatibility: инкрементальное смещение
      let newForm = deepClone(state.form);

      for (const id of state.selectedIds) {
        newForm = updatePrimitiveInTree(newForm, id, (node) => ({
          ...node,
          left: (node.left || 0) + dx,
          top: (node.top || 0) + dy
        }));
      }

      return { ...state, form: newForm, isDirty: true };
    }

    case 'RESIZE_PRIMITIVE': {
      if (!state.form) return state;
      const { id, width, height } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, (node) => {
        let updated = node;
        if (width !== undefined) updated = updateSize(updated, 'width', width);
        if (height !== undefined) updated = updateSize(updated, 'height', height);
        return updated;
      });

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    // Живой ресайз (без записи в историю)
    case 'RESIZE_PRIMITIVE_LIVE': {
      if (!state.form) return state;
      const { id, width, height, left, top } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, (node) => {
        let updated = node;
        if (width !== undefined) updated = updateSize(updated, 'width', width);
        if (height !== undefined) updated = updateSize(updated, 'height', height);
        if (left !== undefined) updated = { ...updated, left };
        if (top !== undefined) updated = { ...updated, top };
        return updated;
      });

      return { ...state, form: newForm, isDirty: true };
    }

    // Коммит текущего состояния в историю (после drag)
    case 'COMMIT_HISTORY': {
      if (!state.form) return state;
      return pushHistory(state, state.form);
    }

    case 'SELECT': {
      const { id, additive } = action;
      if (additive) {
        const selectedIds = state.selectedIds.includes(id)
          ? state.selectedIds.filter(sid => sid !== id)
          : [...state.selectedIds, id];
        return { ...state, selectedIds };
      }
      return { ...state, selectedIds: [id] };
    }

    case 'SELECT_MULTIPLE': {
      return { ...state, selectedIds: action.ids };
    }

    case 'CLEAR_SELECTION': {
      return { ...state, selectedIds: [] };
    }

    case 'DELETE_SELECTED': {
      if (!state.form || state.selectedIds.length === 0) return state;
      let newForm = deepClone(state.form);
      for (const id of state.selectedIds) {
        newForm = removePrimitiveFromTree(newForm, id);
      }

      return pushHistory({
        ...state,
        form: newForm,
        selectedIds: [],
        isDirty: true
      }, newForm);
    }

    case 'UPDATE_PROPERTY': {
      if (!state.form) return state;
      const { id, property, value } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, (node) => ({
        ...node,
        [property]: value
      }));

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'UPDATE_STYLE': {
      if (!state.form) return state;
      const { id, style } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, (node) => ({
        ...node,
        style: { ...(node.style || {}), ...style }
      }));

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'UPDATE_JSON': {
      if (!state.form) return state;
      const { id, json } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, () => json);

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'UPDATE_FORM': {
      if (!state.form) return state;
      const newForm = { ...state.form, ...action.updates };
      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'GROUP': {
      if (!state.form || state.selectedIds.length < 2) return state;
      const newForm = deepClone(state.form);

      // Собираем все выбранные примитивы вместе с детьми
      const toGroup = collectWithChildren(newForm, state.selectedIds);

      // Создаём контейнер
      const container = {
        id: generateId('group'),
        type: 'container',
        name: 'Группа',
        width: 0,
        height: 0,
        left: Infinity,
        top: Infinity,
        style: {
          border: '1px dashed #999999',
          backgroundColor: 'rgba(0, 123, 255, 0.05)',
          borderRadius: '4px'
        },
        customProperties: {},
        children: []
      };

      // Вычисляем границы группы
      for (const prim of toGroup) {
        container.left = Math.min(container.left, prim.left || 0);
        container.top = Math.min(container.top, prim.top || 0);
        container.width = Math.max(container.width, (prim.left || 0) + (prim.width || 0));
        container.height = Math.max(container.height, (prim.top || 0) + (prim.height || 0));
      }
      container.width = container.width - container.left;
      container.height = container.height - container.top;

      // Перемещаем примитивы в контейнер (с учётом смещения)
      const groupIds = toGroup.map(p => p.id);
      for (const prim of toGroup) {
        const moved = {
          ...prim,
          left: (prim.left || 0) - container.left,
          top: (prim.top || 0) - container.top
        };
        container.children.push(moved);
      }

      // Удаляем выбранные из корня и добавляем контейнер
      let rootChildren = newForm.children || [];
      rootChildren = rootChildren.filter(child => !groupIds.includes(child.id));
      rootChildren.push(container);
      newForm.children = rootChildren;

      return pushHistory({
        ...state,
        form: newForm,
        selectedIds: [container.id],
        isDirty: true
      }, newForm);
    }

    case 'UNGROUP': {
      if (!state.form) return state;
      const newForm = deepClone(state.form);

      // Находим контейнеры среди выбранных
      const containers = state.selectedIds
        .map(id => findPrimitive(newForm, id))
        .filter(p => p && p.children && p.children.length > 0);

      if (containers.length === 0) return state;

      for (const container of containers) {
        // Перемещаем детей в родителя контейнера
        const parentInfo = findParent(newForm, container.id);
        if (parentInfo) {
          const { parent } = parentInfo;
          const children = container.children.map(child => ({
            ...child,
            left: (child.left || 0) + (container.left || 0),
            top: (child.top || 0) + (container.top || 0)
          }));
          parent.children = parent.children
            .filter(c => c.id !== container.id)
            .concat(children);
        }
      }

      return pushHistory({
        ...state,
        form: newForm,
        selectedIds: [],
        isDirty: true
      }, newForm);
    }

    case 'ALIGN': {
      if (!state.form || state.selectedIds.length < 2) return state;
      const { align } = action;
      const newForm = deepClone(state.form);

      const selected = state.selectedIds
        .map(id => findPrimitive(newForm, id))
        .filter(Boolean);

      if (selected.length < 2) return state;

      // Вычисляем границы
      let minLeft = Infinity, minTop = Infinity, maxRight = -Infinity, maxBottom = -Infinity;
      for (const prim of selected) {
        minLeft = Math.min(minLeft, prim.left || 0);
        minTop = Math.min(minTop, prim.top || 0);
        maxRight = Math.max(maxRight, (prim.left || 0) + (prim.width || 0));
        maxBottom = Math.max(maxBottom, (prim.top || 0) + (prim.height || 0));
      }

      const centerX = minLeft + (maxRight - minLeft) / 2;
      const centerY = minTop + (maxBottom - minTop) / 2;

      for (const prim of selected) {
        let newLeft = prim.left;
        let newTop = prim.top;

        switch (align) {
          case 'left':
            newLeft = minLeft;
            break;
          case 'center-h':
            newLeft = centerX - (prim.width || 0) / 2;
            break;
          case 'right':
            newLeft = maxRight - (prim.width || 0);
            break;
          case 'top':
            newTop = minTop;
            break;
          case 'center-v':
            newTop = centerY - (prim.height || 0) / 2;
            break;
          case 'bottom':
            newTop = maxBottom - (prim.height || 0);
            break;
          default:
            break;
        }

        updatePrimitiveInTree(newForm, prim.id, (node) => ({
          ...node,
          left: Math.round(newLeft),
          top: Math.round(newTop)
        }));
      }

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'DISTRIBUTE': {
      if (!state.form || state.selectedIds.length < 3) return state;
      const { direction } = action;
      const newForm = deepClone(state.form);

      const selected = state.selectedIds
        .map(id => findPrimitive(newForm, id))
        .filter(Boolean)
        .sort((a, b) => direction === 'horizontal' ? (a.left || 0) - (b.left || 0) : (a.top || 0) - (b.top || 0));

      if (selected.length < 3) return state;

      if (direction === 'horizontal') {
        const first = selected[0];
        const last = selected[selected.length - 1];
        const totalWidth = (last.left || 0) + (last.width || 0) - (first.left || 0);
        const sumWidths = selected.reduce((sum, p) => sum + (p.width || 0), 0);
        const gap = (totalWidth - sumWidths) / (selected.length - 1);

        let currentX = first.left || 0;
        const positions = selected.map(prim => {
          const pos = currentX;
          currentX += (prim.width || 0) + gap;
          return pos;
        });
        selected.forEach((prim, i) => {
          updatePrimitiveInTree(newForm, prim.id, (node) => ({
            ...node,
            left: Math.round(positions[i])
          }));
        });
      } else {
        const first = selected[0];
        const last = selected[selected.length - 1];
        const totalHeight = (last.top || 0) + (last.height || 0) - (first.top || 0);
        const sumHeights = selected.reduce((sum, p) => sum + (p.height || 0), 0);
        const gap = (totalHeight - sumHeights) / (selected.length - 1);

        let currentY = first.top || 0;
        const positions = selected.map(prim => {
          const pos = currentY;
          currentY += (prim.height || 0) + gap;
          return pos;
        });
        selected.forEach((prim, i) => {
          updatePrimitiveInTree(newForm, prim.id, (node) => ({
            ...node,
            top: Math.round(positions[i])
          }));
        });
      }

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const historyIndex = state.historyIndex - 1;
      return {
        ...state,
        form: deepClone(state.history[historyIndex]),
        historyIndex,
        isDirty: true
      };
    }

    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const historyIndex = state.historyIndex + 1;
      return {
        ...state,
        form: deepClone(state.history[historyIndex]),
        historyIndex,
        isDirty: true
      };
    }

    case 'SET_ZOOM': {
      return { ...state, zoom: Math.max(0.2, Math.min(3, action.zoom)) };
    }

    case 'SET_DIRTY': {
      return { ...state, isDirty: action.isDirty };
    }

    // ===== Пользовательские функции =====
    case 'ADD_FUNCTION': {
      if (!state.form) return state;
      const functions = state.form.functions || [];
      const newForm = {
        ...state.form,
        functions: [...functions, action.func]
      };
      return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
    }

    case 'UPDATE_FUNCTION': {
      if (!state.form) return state;
      const functions = (state.form.functions || []).map(fn =>
        fn.id === action.func.id ? { ...fn, ...action.func } : fn
      );
      const newForm = { ...state.form, functions };
      return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
    }

    case 'DELETE_FUNCTION': {
      if (!state.form) return state;
      const functions = (state.form.functions || []).filter(fn => fn.id !== action.id);

      // Убираем ссылки на удалённую функцию из событий формы
      const deletedFn = (state.form.functions || []).find(fn => fn.id === action.id);
      const events = { ...(state.form.events || {}) };
      if (deletedFn) {
        for (const [eventName, fnName] of Object.entries(events)) {
          if (fnName === deletedFn.name) delete events[eventName];
        }
      }

      const newForm = { ...state.form, functions, events };
      return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
    }

    // ===== События формы =====
    case 'UPDATE_FORM_EVENT': {
      if (!state.form) return state;
      const events = { ...(state.form.events || {}) };
      if (action.fnName) {
        events[action.eventName] = action.fnName;
      } else {
        delete events[action.eventName];
      }
      const newForm = { ...state.form, events };
      return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
    }

    // ===== События примитива =====
    case 'UPDATE_PRIMITIVE_EVENT': {
      if (!state.form) return state;
      const { id, eventName, fnName } = action;
      const newForm = updatePrimitiveInTree(deepClone(state.form), id, (node) => {
        const events = { ...(node.events || {}) };
        if (fnName) {
          events[eventName] = fnName;
        } else {
          delete events[eventName];
        }
        return { ...node, events };
      });

      return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
    }

    default:
      return state;
  }
}
