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

// Абсолютная позиция примитива на холсте (с учётом всех родителей-контейнеров)
function getAbsolutePosition(node, id, accLeft = 0, accTop = 0) {
  if (!node) return null;
  const curLeft = accLeft + (node.left || 0);
  const curTop = accTop + (node.top || 0);
  if (node.id === id) return { left: curLeft, top: curTop };
  if (node.children) {
    for (const child of node.children) {
      const found = getAbsolutePosition(child, id, curLeft, curTop);
      if (found) return found;
    }
  }
  return null;
}

// Абсолютная позиция родителя примитива (смещение контейнера относительно холста)
// Используется для пересчёта абсолютных координат в локальные относительно родителя
function getParentAbsolutePosition(node, id) {
  const find = (cur, targetId, accLeft = 0, accTop = 0) => {
    if (!cur) return null;
    const curLeft = accLeft + (cur.left || 0);
    const curTop = accTop + (cur.top || 0);
    if (cur.children) {
      for (const child of cur.children) {
        if (child.id === targetId) {
          return { left: curLeft, top: curTop };
        }
        const found = find(child, targetId, curLeft, curTop);
        if (found) return found;
      }
    }
    return null;
  };
  return find(node, id) || { left: 0, top: 0 };
}

// Пересчёт абсолютной позиции примитива в локальную относительно его родителя
function toLocalPosition(newForm, primId, absLeft, absTop) {
  const parentAbs = getParentAbsolutePosition(newForm, primId);
  return {
    left: Math.round(absLeft - parentAbs.left),
    top: Math.round(absTop - parentAbs.top)
  };
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

      // Определяем родителя: если передан parentId — ищем контейнер, иначе корень формы
      let parent = null;
      if (action.parentId) {
        parent = findPrimitive(state.form, action.parentId);
      }

      // Позиционирование нового примитива
      if (action.left !== undefined && action.top !== undefined) {
        // Позиция передана явно (например, из drag&drop) — уже в координатах родителя
        newPrimitive.left = action.left;
        newPrimitive.top = action.top;
      } else if (parent) {
        // Добавление по клику внутрь контейнера — в левый верхний угол контейнера
        newPrimitive.left = 0;
        newPrimitive.top = 0;
      } else {
        // Центрирование относительно холста
        const canvasWidth = state.form.canvas?.width || 800;
        const canvasHeight = state.form.canvas?.height || 600;
        newPrimitive.left = Math.round((canvasWidth - newPrimitive.width) / 2);
        newPrimitive.top = Math.round((canvasHeight - newPrimitive.height) / 2);
      }

      let newForm;
      if (parent) {
        // Добавляем примитив внутрь контейнера
        newForm = updatePrimitiveInTree(deepClone(state.form), parent.id, (node) => ({
          ...node,
          children: [...(node.children || []), newPrimitive]
        }));
      } else {
        // Добавляем в корень формы
        newForm = {
          ...state.form,
          children: [...(state.form.children || []), newPrimitive]
        };
      }

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
      if (!state.form) return state;
      const { align } = action;
      let newForm = deepClone(state.form);

      // Определяем целевые примитивы:
      // - если выбран один контейнер с детьми — применяем к его детям (1 уровень вложенности);
      // - если выбрано 2+ примитивов — применяем к выбранным.
      let selectors;
      if (state.selectedIds.length === 1) {
        const single = findPrimitive(newForm, state.selectedIds[0]);
        if (single && single.children && single.children.length >= 2) {
          selectors = { childOf: single.id };
        } else {
          return state;
        }
      } else if (state.selectedIds.length >= 2) {
        selectors = state.selectedIds;
      } else {
        return state;
      }

      // Получаем целевые примитивы
      let targets;
      if (selectors.childOf) {
        const container = findPrimitive(newForm, selectors.childOf);
        if (!container || !container.children || container.children.length === 0) return state;
        targets = container.children;
      } else {
        targets = selectors
          .map(id => findPrimitive(newForm, id))
          .filter(Boolean);
      }

      if (targets.length < 2) return state;

      // У всех целей должен быть один и тот же родитель (контейнер)
      const parentId = targets.length > 0 ? (findParent(newForm, targets[0].id)?.parent?.id || null) : null;
      const sameParent = targets.every(prim =>
        (findParent(newForm, prim.id)?.parent?.id || null) === parentId
      );
      if (!sameParent) return state;

      // Рабочая область = область родительского контейнера (или форма)
      const parent = parentId ? findPrimitive(newForm, parentId) : newForm;
      const workLeft = 0;
      const workTop = 0;
      const workWidth = parent.width || (newForm.canvas?.width || 800);
      const workHeight = parent.height || (newForm.canvas?.height || 600);

      // Собираем абсолютные позиции целевых примитивов
      const absolute = targets.map(prim => ({
        prim,
        abs: getAbsolutePosition(newForm, prim.id) || { left: 0, top: 0 }
      }));

      for (const { prim, abs } of absolute) {
        let newAbsLeft = abs.left;
        let newAbsTop = abs.top;
        const w = prim.width || 0;
        const h = prim.height || 0;

        switch (align) {
          case 'left':
            newAbsLeft = workLeft;
            break;
          case 'center-h':
            newAbsLeft = workLeft + (workWidth - w) / 2;
            break;
          case 'right':
            newAbsLeft = workLeft + workWidth - w;
            break;
          case 'top':
            newAbsTop = workTop;
            break;
          case 'center-v':
            newAbsTop = workTop + (workHeight - h) / 2;
            break;
          case 'bottom':
            newAbsTop = workTop + workHeight - h;
            break;
          default:
            break;
        }

        // Пересчитываем абсолютную позицию в локальную относительно родителя и ограничиваем границами контейнера
        const local = toLocalPosition(newForm, prim.id, newAbsLeft, newAbsTop);
        const clampedLeft = Math.max(0, Math.min(local.left, workWidth - w));
        const clampedTop = Math.max(0, Math.min(local.top, workHeight - h));
        newForm = updatePrimitiveInTree(newForm, prim.id, (node) => ({
          ...node,
          left: clampedLeft,
          top: clampedTop
        }));
      }

      return pushHistory({
        ...state,
        form: newForm,
        isDirty: true
      }, newForm);
    }

    case 'DISTRIBUTE': {
      if (!state.form) return state;
      const { direction } = action;
      let newForm = deepClone(state.form);

      // Определяем целевые примитивы (аналогично ALIGN)
      let selectors;
      if (state.selectedIds.length === 1) {
        const single = findPrimitive(newForm, state.selectedIds[0]);
        if (single && single.children && single.children.length >= 3) {
          selectors = { childOf: single.id };
        } else {
          return state;
        }
      } else if (state.selectedIds.length >= 3) {
        selectors = state.selectedIds;
      } else {
        return state;
      }

      let targets;
      if (selectors.childOf) {
        const container = findPrimitive(newForm, selectors.childOf);
        if (!container || !container.children || container.children.length < 3) return state;
        targets = container.children;
      } else {
        targets = selectors
          .map(id => findPrimitive(newForm, id))
          .filter(Boolean);
      }

      if (targets.length < 3) return state;

      // У всех целей должен быть один и тот же родитель
      const parentId = targets.length > 0 ? (findParent(newForm, targets[0].id)?.parent?.id || null) : null;
      const sameParent = targets.every(prim =>
        (findParent(newForm, prim.id)?.parent?.id || null) === parentId
      );
      if (!sameParent) return state;

      // Абсолютные позиции целей
      const absolute = targets.map(prim => ({
        prim,
        abs: getAbsolutePosition(newForm, prim.id) || { left: 0, top: 0 }
      }));

      // Определяем крайние положения:
      // - при распределении детей контейнера — границы самого контейнера (в абсолютных координатах);
      // - при распределении выбранных примитивов — их собственные крайние положения.
      const container = selectors.childOf ? findPrimitive(newForm, selectors.childOf) : null;
      const useContainerBounds = !!container;
      const containerAbs = container
        ? (getAbsolutePosition(newForm, container.id) || { left: 0, top: 0 })
        : { left: 0, top: 0 };
      const containerWidth = container ? (container.width || 0) : 0;
      const containerHeight = container ? (container.height || 0) : 0;

      // Вычисляем новые позиции заранее, используя исходные абсолютные координаты,
      // чтобы избежать накопления ошибок при обновлении newForm в цикле.
      const updates = [];

      if (direction === 'horizontal') {
        const sorted = [...absolute].sort((a, b) => a.abs.left - b.abs.left);
        // Крайние положения (в абсолютных координатах)
        const minLeft = useContainerBounds
          ? containerAbs.left
          : Math.min(...sorted.map(({ abs }) => abs.left));
        const maxRight = useContainerBounds
          ? containerAbs.left + containerWidth
          : Math.max(...sorted.map(({ prim, abs }) => abs.left + (prim.width || 0)));
        const totalWidth = maxRight - minLeft;
        const sumWidths = sorted.reduce((sum, { prim }) => sum + (prim.width || 0), 0);
        const gap = (totalWidth - sumWidths) / (sorted.length - 1);

        let currentX = minLeft;
        for (const { prim, abs } of sorted) {
          const local = toLocalPosition(newForm, prim.id, currentX, abs.top);
          updates.push({ id: prim.id, left: local.left });
          currentX += (prim.width || 0) + gap;
        }
      } else {
        const sorted = [...absolute].sort((a, b) => a.abs.top - b.abs.top);
        // Крайние положения (в абсолютных координатах)
        const minTop = useContainerBounds
          ? containerAbs.top
          : Math.min(...sorted.map(({ abs }) => abs.top));
        const maxBottom = useContainerBounds
          ? containerAbs.top + containerHeight
          : Math.max(...sorted.map(({ prim, abs }) => abs.top + (prim.height || 0)));
        const totalHeight = maxBottom - minTop;
        const sumHeights = sorted.reduce((sum, { prim }) => sum + (prim.height || 0), 0);
        const gap = (totalHeight - sumHeights) / (sorted.length - 1);

        let currentY = minTop;
        for (const { prim, abs } of sorted) {
          const local = toLocalPosition(newForm, prim.id, abs.left, currentY);
          updates.push({ id: prim.id, top: local.top });
          currentY += (prim.height || 0) + gap;
        }
      }

      // Применяем все обновления
      for (const upd of updates) {
        newForm = updatePrimitiveInTree(newForm, upd.id, (node) => ({
          ...node,
          ...(upd.left !== undefined ? { left: upd.left } : {}),
          ...(upd.top !== undefined ? { top: upd.top } : {})
        }));
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
