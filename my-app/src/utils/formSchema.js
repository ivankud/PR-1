// Определения типов элементов формы и их дефолтные свойства

// Базовые CSS-свойства по умолчанию для всех элементов
export const DEFAULT_CSS = {
  position: 'relative',
  left: '0px',
  top: '0px',
  width: '100%',
  height: 'auto',
  margin: '0',
  padding: '0',
  fontSize: '14px',
  color: '#333333',
  backgroundColor: 'transparent',
  border: '1px solid #cccccc',
  borderRadius: '4px',
  textAlign: 'left',
  fontWeight: 'normal',
};

// CSS-свойства, доступные для редактирования
export const CSS_PROPERTIES = [
  { key: 'position', label: 'Вид позиции (position)', type: 'select', options: ['absolute', 'relative', 'static', 'fixed', 'sticky'] },
  { key: 'left', label: 'Позиция X (left)', type: 'text', placeholder: '0px' },
  { key: 'top', label: 'Позиция Y (top)', type: 'text', placeholder: '0px' },
  { key: 'width', label: 'Ширина', type: 'text', placeholder: '100%' },
  { key: 'height', label: 'Высота', type: 'text', placeholder: 'auto' },
  { key: 'margin', label: 'Отступы (margin)', type: 'text', placeholder: '0' },
  { key: 'padding', label: 'Внутренние отступы (padding)', type: 'text', placeholder: '0' },
  { key: 'fontSize', label: 'Размер шрифта', type: 'text', placeholder: '14px' },
  { key: 'color', label: 'Цвет текста', type: 'color', placeholder: '#333333' },
  { key: 'backgroundColor', label: 'Цвет фона', type: 'color', placeholder: 'transparent' },
  { key: 'border', label: 'Граница', type: 'text', placeholder: '1px solid #ccc' },
  { key: 'borderRadius', label: 'Скругление углов', type: 'text', placeholder: '4px' },
  { key: 'textAlign', label: 'Выравнивание текста', type: 'select', options: ['left', 'center', 'right', 'justify'] },
  { key: 'fontWeight', label: 'Жирность шрифта', type: 'select', options: ['normal', 'bold', 'lighter', 'bolder'] },
];

export const ELEMENT_TYPES = {
  container: {
    label: 'Контейнер',
    icon: '📦',
    defaults: {
      type: 'container',
      label: 'Контейнер',
      name: 'container',
      x: 0,
      y: 0,
      width: 300,
      height: 200,
      children: [],
      css: {
        ...DEFAULT_CSS,
        width: '300px',
        height: '200px',
        backgroundColor: '#f8f9fa',
        border: '2px dashed #61dafb',
      },
    },
  },
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
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 100,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 40,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 30,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 200,
      height: 60,
      css: { ...DEFAULT_CSS },
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
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      css: { ...DEFAULT_CSS },
    },
  },
};

// События, доступные для каждого типа элемента
export const EVENT_TYPES = {
  container: ['onClick', 'onFocus', 'onBlur'],
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

// Создание нового элемента с уникальным id.
// CSS-размеры width/height синхронизируются с числовыми значениями.
export function createElement(type) {
  const def = ELEMENT_TYPES[type];
  if (!def) return null;

  const el = {
    id: `el-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    ...JSON.parse(JSON.stringify(def.defaults)),
    events: {},
  };

  // Согласование CSS width/height/left/top с числовыми значениями
  el.css = {
    ...(el.css || {}),
    width: `${el.width}px`,
    height: `${el.height}px`,
    left: `${el.x || 0}px`,
    top: `${el.y || 0}px`,
  };

  return el;
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
    canvas: {
      width: 800,
      height: 600,
      gridSize: 20,
      showGrid: true,
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

// Рекурсивный поиск элемента по id (включая вложенные в контейнеры)
export function findElementById(elements, id) {
  for (const el of elements) {
    if (el.id === id) return el;
    if (el.children && el.children.length > 0) {
      const found = findElementById(el.children, id);
      if (found) return found;
    }
  }
  return null;
}

// Рекурсивное обновление элемента по id
export function updateElementInTree(elements, id, updater) {
  return elements.map((el) => {
    if (el.id === id) {
      return updater(el);
    }
    if (el.children && el.children.length > 0) {
      return {
        ...el,
        children: updateElementInTree(el.children, id, updater),
      };
    }
    return el;
  });
}

// Рекурсивное удаление элемента по id
export function removeElementFromTree(elements, id) {
  return elements
    .filter((el) => el.id !== id)
    .map((el) => {
      if (el.children && el.children.length > 0) {
        return {
          ...el,
          children: removeElementFromTree(el.children, id),
        };
      }
      return el;
    });
}

// Получение всех элементов (плоский список) для дерева
export function flattenElements(elements, depth = 0, parentId = null) {
  const result = [];
  for (const el of elements) {
    result.push({ ...el, depth, parentId });
    if (el.children && el.children.length > 0) {
      result.push(...flattenElements(el.children, depth + 1, el.id));
    }
  }
  return result;
}