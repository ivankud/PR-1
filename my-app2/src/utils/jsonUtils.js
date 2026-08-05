// Утилиты для работы с JSON данными

// Глубокое клонирование объекта
export function deepClone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

// Генерация уникального ID
export function generateId(prefix = 'prim') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Поиск примитива по id в дереве формы (рекурсивно)
export function findPrimitive(node, id) {
  if (!node) return null;
  if (node.id === id) return node;
  if (node.children) {
    for (const child of node.children) {
      const found = findPrimitive(child, id);
      if (found) return found;
    }
  }
  return null;
}

// Поиск родителя примитива по id
export function findParent(node, id, parent = null) {
  if (!node) return null;
  if (node.children) {
    for (const child of node.children) {
      if (child.id === id) return { parent: node, child };
      const found = findParent(child, id, node);
      if (found) return found;
    }
  }
  return null;
}

// Получение всех примитивов (плоский список) из дерева
export function flattenTree(node, result = []) {
  if (!node) return result;
  result.push(node);
  if (node.children) {
    for (const child of node.children) {
      flattenTree(child, result);
    }
  }
  return result;
}

// Загрузка JSON из файла (fetch)
export async function loadJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Ошибка загрузки ${url}: ${response.status}`);
  }
  return await response.json();
}

// Скачивание JSON как файла
export function downloadJson(data, filename) {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Получение значения по пути (например "user.name")
export function getValueByPath(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  return current;
}

// Установка значения по пути
export function setValueByPath(obj, path, value) {
  const parts = path.split('.');
  let current = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!current[parts[i]] || typeof current[parts[i]] !== 'object') {
      current[parts[i]] = {};
    }
    current = current[parts[i]];
  }
  current[parts[parts.length - 1]] = value;
}

// CSS объект -> CSS строка
export function cssObjectToString(cssObj) {
  if (!cssObj) return '';
  return Object.entries(cssObj)
    .map(([key, value]) => {
      // camelCase -> kebab-case
      const kebabKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
      return `${kebabKey}: ${value};`;
    })
    .join('\n');
}

// CSS строка -> CSS объект
export function cssStringToObject(cssString) {
  const result = {};
  if (!cssString) return result;
  const lines = cssString.split(';');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;
    const key = trimmed.substring(0, colonIndex).trim();
    const value = trimmed.substring(colonIndex + 1).trim();
    if (!key || !value) continue;
    // kebab-case -> camelCase
    const camelKey = key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    result[camelKey] = value;
  }
  return result;
}

// Создание новой пустой формы
export function createEmptyForm() {
  return {
    id: generateId('form'),
    type: 'form',
    name: 'Новая форма',
    canvas: {
      width: 800,
      height: 600,
      backgroundColor: '#ffffff',
      gridSize: 10,
      showGrid: true
    },
    context: {
      source: 'inline',
      url: '',
      inline: {}
    },
    onOpen: {
      type: 'loadContext',
      params: {}
    },
    children: []
  };
}