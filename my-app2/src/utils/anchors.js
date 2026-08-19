// Утилиты для работы с якорями (подстановка данных из контекста)
import { getValueByPath } from './jsonUtils';

// Замена {{path}} в строке на значение из контекста (многопроходная,
// чтобы можно было подставлять шаблоны, ведущие к другим шаблонам)
export function resolveTemplate(template, primitive, context) {
  if (template === undefined || template === null) return '';
  if (typeof template !== 'string') return template;

  const MAX_PASSES = 10;
  let result = template;

  for (let pass = 0; pass < MAX_PASSES; pass++) {
    if (!/\{\{([^}]+)\}\}/.test(result)) break;

    result = result.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const trimmedPath = path.trim();
      // Специальный случай: {{.}} или {{}} — весь контекст целиком
      if (trimmedPath === '.' || trimmedPath === '') {
        return typeof context === 'object' ? JSON.stringify(context, null, 2) : String(context);
      }
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

  return result;
}

// Оценка логического условия с ссылками на контекст.
// Выражение может содержать шаблоны {{path}}, которые заменяются на JS-выражения
// доступа к контексту (например {{rowT1}} -> context.rowT1, {{rowT1.id}} -> context.rowT1.id).
// Примеры: "{{rowT1}} != null", "{{rowT1.id}} > 0", "{{field1.value}} === 'Иван'"
export function resolveCondition(expression, context) {
  if (expression === undefined || expression === null) return true;
  if (typeof expression !== 'string') return Boolean(expression);

  const trimmed = expression.trim();
  if (trimmed === '') return true;

  // Заменяем {{path}} на JS-выражение доступа к контексту
  const jsExpr = trimmed.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
    const parts = path.trim().split('.').filter(Boolean);
    if (parts.length === 0) return 'undefined';
    // Экранируем ключи, чтобы безопасно строить путь доступа
    const access = parts.map(p => /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p) ? `.${p}` : `[${JSON.stringify(p)}]`).join('');
    return `context${access}`;
  });

  try {
    // eslint-disable-next-line no-new-func
    const fn = new Function('context', `return (${jsExpr});`);
    return Boolean(fn(context));
  } catch (e) {
    // Если выражение не удалось вычислить — считаем условие невыполненным
    return false;
  }
}

// Вычисление условного значения из настраиваемого свойства.
// Формат значения в customProperties:
// {
//   "default": "14px",
//   "conditions": [
//     { "when": "{{rowT1.id}} === 2", "value": "20px" },
//     { "when": "{{rowT1.id}} === 3", "value": "40px" }
//   ]
// }
// Возвращает значение первого истинного условия, иначе default.
export function resolveConditionalValue(value, context) {
  if (value === undefined || value === null) return undefined;
  // Если значение не объект с условиями — возвращаем как есть
  if (typeof value !== 'object' || !Array.isArray(value.conditions)) {
    return value;
  }

  // Проверяем условия по порядку
  for (const cond of value.conditions) {
    if (cond && cond.when && resolveCondition(cond.when, context)) {
      return cond.value;
    }
  }

  // Если ни одно условие не выполнено — возвращаем default
  return value.default !== undefined ? value.default : undefined;
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