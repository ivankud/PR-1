// Утилиты для работы с якорями (подстановка данных из контекста)
import { getValueByPath } from './jsonUtils';

// Замена {{path}} в строке на значение из контекста
export function resolveTemplate(template, primitive, context) {
  if (template === undefined || template === null) return '';
  if (typeof template !== 'string') return template;

  return template.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const trimmedPath = path.trim();
    // Сначала ищем в свойствах примитива
    if (primitive && primitive[trimmedPath] !== undefined) {
      return String(primitive[trimmedPath]);
    }
    // Затем в контексте
    const contextValue = getValueByPath(context, trimmedPath);
    if (contextValue !== undefined) {
      return typeof contextValue === 'object' ? JSON.stringify(contextValue) : String(contextValue);
    }
    return '';
  });
}

// Получение контекста формы (inline или загруженный)
export function getFormContext(form) {
  if (!form || !form.context) return {};
  if (form.context.source === 'inline') {
    return form.context.inline || {};
  }
  return form.context.loadedData || {};
}

// Получение списка якорей для примитива
export function getAnchorsForPrimitive(primitive, primitiveTemplate) {
  if (!primitiveTemplate || !primitiveTemplate.anchors) return [];
  return primitiveTemplate.anchors;
}

// Применение якорей: возвращает объект с подставленными значениями
export function applyAnchors(primitive, primitiveTemplate, context) {
  const result = {};
  if (!primitiveTemplate || !primitiveTemplate.anchors) return result;
  for (const anchor of primitiveTemplate.anchors) {
    const value = getValueByPath(context, anchor.path);
    if (value !== undefined) {
      result[anchor.name] = value;
    }
  }
  return result;
}