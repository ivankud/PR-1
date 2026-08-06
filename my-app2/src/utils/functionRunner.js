// Утилиты для работы с пользовательскими функциями форм
import { getFormContext } from './anchors';

// Компиляция функций из form.functions в исполняемые функции
// Каждая функция получает объект context (данные формы)
export function buildFunctions(functions) {
  const map = {};
  for (const fn of (functions || [])) {
    try {
      // eslint-disable-next-line no-new-func
      map[fn.name] = new Function('context', fn.code || '');
    } catch (e) {
      console.warn(`Не удалось скомпилировать функцию "${fn.name}":`, e.message);
      map[fn.name] = () => null;
    }
  }
  return map;
}

// Вызов функции по имени с контекстом
export function callFunction(fns, fnName, context) {
  if (!fns || !fnName) return null;
  const fn = fns[fnName];
  if (!fn) {
    console.warn(`Функция "${fnName}" не определена`);
    return null;
  }
  try {
    return fn(context);
  } catch (e) {
    console.error(`Ошибка выполнения функции "${fnName}":`, e);
    return null;
  }
}

// Применение событий формы (onOpen, onSubmit и др.)
// Возвращает обработчики для примитива
export function buildEventHandlers(primitive, fns, context, getPrimitiveValue) {
  const handlers = {};
  const events = primitive?.events || {};
  if (!events) return handlers;

  for (const [eventName, fnName] of Object.entries(events)) {
    if (!fnName) continue;
    handlers[eventName] = (event) => {
      // Объединяем контекст + данные события + ссылку на сам примитив
      const eventContext = {
        ...context,
        event: {
          type: event?.type,
          target: event?.target,
          value: event?.target?.value
        },
        primitiveId: primitive?.id,
        primitiveName: primitive?.name
      };
      callFunction(fns, fnName, eventContext);
    };
  }
  return handlers;
}

// Применение событий формы при открытии
export function buildFormOpenHandler(fns, context) {
  return (event) => {
    const eventContext = {
      ...context,
      event: { type: 'open' }
    };
    callFunction(fns, 'onOpen', eventContext);
  };
}

// Получение контекста для выполнения функций
export function getFunctionContext(form, baseContext = {}) {
  return {
    ...getFormContext(form),
    ...baseContext
  };
}