// Определения типов элементов формы и их дефолтные свойства

export const ELEMENT_TYPES = {
  text: {
    label: 'Текстовое поле',
    icon: '📝',
    defaults: {
      type: 'text',
      label: 'Текстовое поле',
      name: 'text_field',
      placeholder: '',
      required: false,
      value: '',
    },
  },
  textarea: {
    label: 'Многострочный текст',
    icon: '📄',
    defaults: {
      type: 'textarea',
      label: 'Многострочный текст',
      name: 'textarea_field',
      placeholder: '',
      required: false,
      rows: 4,
      value: '',
    },
  },
  number: {
    label: 'Число',
    icon: '🔢',
    defaults: {
      type: 'number',
      label: 'Число',
      name: 'number_field',
      placeholder: '',
      required: false,
      min: '',
      max: '',
      value: '',
    },
  },
  date: {
    label: 'Дата',
    icon: '📅',
    defaults: {
      type: 'date',
      label: 'Дата',
      name: 'date_field',
      required: false,
      value: '',
    },
  },
  select: {
    label: 'Выпадающий список',
    icon: '📋',
    defaults: {
      type: 'select',
      label: 'Выпадающий список',
      name: 'select_field',
      required: false,
      options: ['Вариант 1', 'Вариант 2', 'Вариант 3'],
      value: '',
    },
  },
  checkbox: {
    label: 'Чекбокс',
    icon: '☑️',
    defaults: {
      type: 'checkbox',
      label: 'Чекбокс',
      name: 'checkbox_field',
      required: false,
      checked: false,
    },
  },
  radio: {
    label: 'Радиокнопки',
    icon: '🔘',
    defaults: {
      type: 'radio',
      label: 'Радиокнопки',
      name: 'radio_field',
      required: false,
      options: ['Вариант 1', 'Вариант 2'],
      value: '',
    },
  },
  button: {
    label: 'Кнопка',
    icon: '🔘',
    defaults: {
      type: 'button',
      label: 'Кнопка',
      name: 'button_field',
      buttonText: 'Нажми меня',
      variant: 'primary',
    },
  },
};

// События, доступные для каждого типа элемента
export const EVENT_TYPES = {
  text: ['onChange', 'onFocus', 'onBlur', 'onKeyUp'],
  textarea: ['onChange', 'onFocus', 'onBlur', 'onKeyUp'],
  number: ['onChange', 'onFocus', 'onBlur', 'onKeyUp'],
  date: ['onChange', 'onFocus', 'onBlur'],
  select: ['onChange', 'onFocus', 'onBlur'],
  checkbox: ['onChange', 'onFocus', 'onBlur'],
  radio: ['onChange', 'onFocus', 'onBlur'],
  button: ['onClick', 'onFocus', 'onBlur'],
};

export const EVENT_LABELS = {
  onClick: 'Клик',
  onChange: 'Изменение значения',
  onFocus: 'Получение фокуса',
  onBlur: 'Потеря фокуса',
  onKeyUp: 'Отпускание клавиши',
  onSubmit: 'Отправка формы',
};

// Создание нового элемента с уникальным id
export function createElement(type) {
  const def = ELEMENT_TYPES[type];
  if (!def) return null;

  return {
    id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...JSON.parse(JSON.stringify(def.defaults)),
    events: {},
  };
}

// Создание пустой формы
export function createEmptyForm() {
  return {
    id: `form-${Date.now()}`,
    name: 'Новая форма',
    elements: [],
    events: {
      onSubmit: '',
    },
  };
}

// Валидация JSON-схемы формы
export function validateFormSchema(json) {
  try {
    const data = typeof json === 'string' ? JSON.parse(json) : json;
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'Данные должны быть объектом' };
    }
    if (!Array.isArray(data.elements)) {
      return { valid: false, error: 'Поле "elements" должно быть массивом' };
    }
    for (const el of data.elements) {
      if (!el.id || !el.type) {
        return { valid: false, error: 'Каждый элемент должен иметь id и type' };
      }
      if (!ELEMENT_TYPES[el.type]) {
        return { valid: false, error: `Неизвестный тип элемента: ${el.type}` };
      }
    }
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: `Ошибка парсинга JSON: ${e.message}` };
  }
}