// Утилита для рендера примитивов по шаблону
import React from 'react';
import { resolveTemplate } from './anchors';

// Рендер примитива по шаблону
export function renderPrimitive(primitive, template, context) {
  if (!template || !template.render) return null;

  const render = template.render;
  const tag = render.tag || 'div';
  const attributes = {};

  // Резолвим атрибуты
  if (render.attributes) {
    for (const [key, value] of Object.entries(render.attributes)) {
      attributes[key] = resolveTemplate(value, primitive, context);
    }
  }

  // Стили
  if (primitive.style) {
    attributes.style = primitive.style;
  }

  // Обработка специальных случаев
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    // Для input/textarea/select не рендерим children как текст
    return React.createElement(tag, attributes);
  }

  // Текст
  let children = [];
  if (render.text !== undefined) {
    const text = resolveTemplate(render.text, primitive, context);
    children.push(text);
  }

  // Дочерние элементы (например checkbox: input внутри label)
  if (render.children) {
    for (const childRender of render.children) {
      const childAttrs = {};
      if (childRender.attributes) {
        for (const [key, value] of Object.entries(childRender.attributes)) {
          childAttrs[key] = resolveTemplate(value, primitive, context);
        }
      }
      children.push(React.createElement(childRender.tag, childAttrs));
    }
  }

  // Опции для select
  if (tag === 'select' && render.options) {
    const optionsStr = resolveTemplate(render.options, primitive, context);
    let options = [];
    try {
      if (Array.isArray(optionsStr)) {
        options = optionsStr;
      } else if (typeof optionsStr === 'string') {
        options = optionsStr.split(',').map(s => s.trim()).filter(Boolean);
      }
    } catch (e) {
      options = [];
    }
    children = options.map((opt, i) =>
      React.createElement('option', { key: i, value: opt }, opt)
    );
  }

  // Таблица
  if (tag === 'table' && render.table) {
    const rows = parseInt(resolveTemplate(render.table.rows, primitive, context)) || 3;
    const cols = parseInt(resolveTemplate(render.table.cols, primitive, context)) || 3;
    const dataStr = resolveTemplate(render.table.data, primitive, context);
    let data = null;
    try {
      if (Array.isArray(dataStr)) {
        data = dataStr;
      } else if (typeof dataStr === 'string' && dataStr.startsWith('[')) {
        data = JSON.parse(dataStr);
      }
    } catch (e) {
      data = null;
    }

    const tableRows = [];
    for (let r = 0; r < rows; r++) {
      const cells = [];
      for (let c = 0; c < cols; c++) {
        const cellValue = data && data[r] ? data[r][c] : '';
        cells.push(
          React.createElement(
            'td',
            { key: c, style: { border: '1px solid #ccc', padding: '4px 8px' } },
            cellValue !== undefined && cellValue !== null ? String(cellValue) : ''
          )
        );
      }
      tableRows.push(React.createElement('tr', { key: r }, cells));
    }
    children = tableRows;
  }

  return React.createElement(tag, attributes, children);
}

// Получение шаблона примитива по типу
export function getPrimitiveTemplate(primitives, type) {
  if (!primitives) return null;
  return primitives.find(p => p.type === type) || null;
}

// Создание нового примитива из шаблона
export function createPrimitiveFromTemplate(template, id) {
  if (!template) return null;
  const defaults = template.defaults || {};
  return {
    id,
    type: template.type,
    name: template.name,
    width: defaults.width || 100,
    height: defaults.height || 40,
    widthUnit: 'px',
    heightUnit: 'px',
    left: defaults.left || 0,
    top: defaults.top || 0,
    style: { ...(defaults.style || {}) },
    customProperties: {},
    children: template.isContainer ? [] : undefined,
    ...defaults
  };
}
