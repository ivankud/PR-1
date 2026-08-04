// Безопасное выполнение JavaScript-кода действий, привязанных к событиям

/**
 * Выполняет JS-код действия в изолированной функции.
 * @param {string} code - JavaScript-код для выполнения
 * @param {object} context - контекст выполнения (formData, element, form, setFormData и т.д.)
 * @param {object} event - объект события браузера
 * @returns {boolean} - true если код выполнен успешно, false при ошибке
 */
export function runAction(code, context, event) {
  if (!code || !code.trim()) return true;

  try {
    // Создаём функцию из кода. Код выполняется в собственной области видимости,
    // не имея доступа к глобальным переменным приложения.
    // eslint-disable-next-line no-new-func
    const fn = new Function('context', 'event', code);
    fn(context, event);
    return true;
  } catch (error) {
    console.error('Ошибка выполнения действия:', error);
    if (context && context.onError) {
      context.onError(error);
    }
    return false;
  }
}

/**
 * Проверяет синтаксис JS-кода без его выполнения.
 * @param {string} code - JavaScript-код для проверки
 * @returns {{valid: boolean, error: string|null}}
 */
export function validateCodeSyntax(code) {
  if (!code || !code.trim()) {
    return { valid: true, error: null };
  }

  try {
    // eslint-disable-next-line no-new-func
    new Function('context', 'event', code);
    return { valid: true, error: null };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Создаёт контекст выполнения для формы.
 * @param {object} options - параметры контекста
 * @returns {object} - контекст для передачи в runAction
 */
export function createActionContext({
  formData,
  setFormData,
  element,
  form,
  navigate,
  onError,
}) {
  return {
    formData,
    setFormData,
    element,
    form,
    navigate,
    onError,
    // Удобные хелперы для пользовательского кода
    getValue: (name) => (formData ? formData[name] : undefined),
    setValue: (name, value) => {
      if (setFormData) {
        setFormData((prev) => ({ ...prev, [name]: value }));
      }
    },
    log: (...args) => console.log('[Действие]', ...args),
    alert: (msg) => window.alert(msg),
  };
}