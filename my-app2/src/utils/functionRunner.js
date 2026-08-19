// Утилиты для работы с пользовательскими функциями форм
import { getFormContext } from './anchors';

// Глобальная функция поиска примитива по имени.
// Доступна во всех пользовательских функциях форм (компилируются через new Function,
// поэтому имеют доступ к глобальной области видимости).
if (typeof window !== 'undefined' && !window.getElementByName) {
  window.getElementByName = function (name) {
    return document.querySelector('[data-primitive-name="' + name + '"]');
  };
}

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

// Преобразование имени события в React-проп (click → onClick, mouseenter → onMouseEnter)
function toReactEventName(eventName) {
  if (eventName.startsWith('on')) return eventName;
  return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
}

// Применение событий формы (onOpen, onSubmit и др.)
// Возвращает обработчики для примитива (React-пропсы: onClick, onChange и т.д.)
export function buildEventHandlers(primitive, fns, context, onUpdateContext) {
  const handlers = {};
  const events = primitive?.events || {};
  if (!events) return handlers;

  for (const [eventName, fnName] of Object.entries(events)) {
    if (!fnName) continue;
    const reactEventName = toReactEventName(eventName);
    handlers[reactEventName] = (event) => {
      // Объединяем контекст + данные события + ссылку на сам примитив
      const eventContext = {
        ...JSON.parse(JSON.stringify(context)),
        event: {
          type: event?.type,
          target: event?.target,
          value: event?.target?.value
        },
        primitiveId: primitive?.id,
        primitiveName: primitive?.name
      };
      const result = callFunction(fns, fnName, eventContext);
      // Если функция вернула обновленный контекст, применяем его
      if (onUpdateContext && result && typeof result === 'object') {
        onUpdateContext(result);
      }
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

// Создание обработчиков событий с использованием ref для доступа к актуальному контексту
export function buildEventHandlersWithRef(primitive, fns, contextRef, onUpdateContext) {
  const handlers = {};
  const events = primitive?.events || {};
  if (!events) return handlers;

  for (const [eventName, fnName] of Object.entries(events)) {
    if (!fnName) continue;
    const reactEventName = toReactEventName(eventName);
    handlers[reactEventName] = (event) => {
      // Получаем актуальный контекст из ref
      const currentContext = contextRef.current || {};
      
      // Клонируем контекст чтобы не мутировать
      const eventContext = JSON.parse(JSON.stringify(currentContext));
      
      // Добавляем данные события
      eventContext.event = {
        type: event?.type,
        target: event?.target,
        value: event?.target?.value
      };
      eventContext.primitiveId = primitive?.id;
      eventContext.primitiveName = primitive?.name;
      
      // Вызываем функцию
      const result = callFunction(fns, fnName, eventContext);
      
      // Если функция вернула обновленный объект контекста (не содержащий event), применяем его
      if (onUpdateContext && result && typeof result === 'object' && !result.event) {
        onUpdateContext(result);
      }
    };
  }
  return handlers;
}

// Создание обработчиков событий с возможностью обновления контекста
export function buildEventHandlersWithUpdate(primitive, fns, context, onUpdateContext) {
  const handlers = {};
  const events = primitive?.events || {};
  if (!events) return handlers;

  for (const [eventName, fnName] of Object.entries(events)) {
    if (!fnName) continue;
    const reactEventName = toReactEventName(eventName);
    handlers[reactEventName] = (event) => {
      // Клонируем контекст чтобы не мутировать
      const eventContext = JSON.parse(JSON.stringify(context));
      
      // Добавляем данные события
      eventContext.event = {
        type: event?.type,
        target: event?.target,
        value: event?.target?.value,
        // Для AG Grid: данные строки, по которой произошёл клик
        data: event?.data,
        rowIndex: event?.rowIndex,
        node: event?.node
      };
      eventContext.primitiveId = primitive?.id;
      eventContext.primitiveName = primitive?.name;
      
      // Вызываем функцию
      const result = callFunction(fns, fnName, eventContext);
      
      // Если функция вернула обновленный объект контекста, применяем его
      // (служебные поля event/primitiveId/primitiveName отфильтруются в handleContextUpdate)
      if (onUpdateContext && result && typeof result === 'object') {
        onUpdateContext(result);
      }
    };
  }
  return handlers;
}
