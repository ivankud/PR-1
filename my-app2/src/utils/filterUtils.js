// Утилиты для работы с фильтрами AGTable
// Модель фильтров определяет доступные фильтры для запроса данных через API

// Соответствие оператора и его краткого обозначения
export const OPERATOR_LABELS = {
  equal: '=',
  notequal: '!=',
  less: '<',
  more: '>',
  notmore: '<=',
  notless: '>=',
  between: 'между',
  in: 'в списке',
  notin: 'вне списка',
  contain: 'содержит'
};

// Русские наименования операторов
export const OPERATOR_NAMES = {
  equal: 'Равно',
  notequal: 'Не равно',
  less: 'Меньше',
  more: 'Больше',
  notmore: 'Не больше',
  notless: 'Не меньше',
  between: 'В интервале',
  in: 'В списке',
  notin: 'Вне списка',
  contain: 'Содержит'
};

// Соответствие типа поля и допустимых операторов по умолчанию
export const OPERATORS_BY_TYPE = {
  numeric: ['equal', 'notequal', 'less', 'more', 'notmore', 'notless', 'between', 'in', 'notin'],
  string: ['equal', 'notequal', 'in', 'notin', 'contain'],
  boolean: ['equal', 'notequal'],
  date: ['equal', 'notequal', 'less', 'more', 'notmore', 'notless', 'between'],
  timestamp: ['equal', 'notequal', 'less', 'more', 'notmore', 'notless', 'between'],
  time: ['equal', 'notequal', 'less', 'more', 'notmore', 'notless', 'between']
};

// Нормализация типа (учёт опечатки "numeic")
export function normalizeType(type) {
  if (!type) return 'string';
  const t = String(type).toLowerCase();
  if (t === 'numeic' || t === 'number' || t === 'integer' || t === 'float' || t === 'double') return 'numeric';
  return t;
}

// Получение допустимых операторов для фильтра (с учётом явно заданных или по типу)
export function getOperatorsForFilter(filter) {
  if (filter && Array.isArray(filter.operators) && filter.operators.length > 0) {
    // Фильтруем операторы до допустимых для типа, но разрешаем явно заданные
    return filter.operators;
  }
  const type = normalizeType(filter && filter.type);
  return OPERATORS_BY_TYPE[type] || OPERATORS_BY_TYPE.string;
}

// Краткое обозначение оператора
export function getOperatorLabel(operator) {
  return OPERATOR_LABELS[operator] || operator || '';
}

// Русское наименование оператора
export function getOperatorName(operator) {
  return OPERATOR_NAMES[operator] || operator || '';
}

// Формирование значения фильтра для запроса в API.
// Возвращает строку в формате "оператор:значение" (для between — "оператор:от,до")
// или null, если фильтр не активен
export function buildFilterParam(filterState) {
  if (!filterState || filterState.disabled) return null;
  const op = filterState.operator;
  const value = filterState.value;
  if (!op) return null;

  // Для операторов in/notin значение — список через запятую
  if (op === 'in' || op === 'notin') {
    const list = Array.isArray(value)
      ? value.join(',')
      : String(value || '').split(',').map(s => s.trim()).filter(Boolean).join(',');
    if (!list) return null;
    return `${op}:${list}`;
  }

  // Для between значение — диапазон "от,до"
  if (op === 'between') {
    const parts = Array.isArray(value)
      ? value
      : String(value || '').split(',').map(s => s.trim());
    if (parts.length < 2 || (!parts[0] && !parts[1])) return null;
    const from = parts[0] || '';
    const to = parts[1] || '';
    if (!from && !to) return null;
    return `${op}:${from},${to}`;
  }

  if (value === '' || value === null || value === undefined) return null;
  return `${op}:${value}`;
}

// Формирование массива фильтров для запроса в API.
// Каждый элемент: { name, datatype, operator, val }
// name — значение из поля field модели фильтра
// datatype — тип поля
// operator — выбранный оператор
// val — значение фильтра
export function buildFilterParams(filterModel, activeFilters) {
  const filters = [];
  if (!Array.isArray(filterModel) || !activeFilters) return filters;

  for (const filter of filterModel) {
    const state = activeFilters[filter.field];
    if (!state || state.disabled) continue;
    const param = buildFilterParam(state);
    if (param) {
      filters.push({
        name: filter.field,
        datatype: normalizeType(filter.type),
        operator: state.operator,
        val: state.value
      });
    }
  }
  return filters;
}

// Построение строки запроса с фильтрами. Добавляется к существующему URL.
// Параметр filter — JSON-массив объектов { name, datatype, operator, val }.
export function appendFilterParamsToUrl(baseUrl, filterArray) {
  if (!baseUrl || !Array.isArray(filterArray) || filterArray.length === 0) return baseUrl;
  const separator = baseUrl.includes('?') ? '&' : '?';
  const json = JSON.stringify(filterArray);
  return `${baseUrl}${separator}filter=${encodeURIComponent(json)}`;
}
