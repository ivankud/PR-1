// Утилита для рендера примитивов по шаблону
import React from 'react';
import { resolveTemplate } from './anchors';
import AGTable from '../components/AGTable';
import { getIconById, IconSvg } from './iconLibrary';

// Рендер примитива по шаблону
export function renderPrimitive(primitive, template, context) {
  if (!template || !template.render) return null;

  const render = template.render;
  const tag = render.tag || 'div';
  const attributes = {};

  // Специальный рендер для AGTable
  if (template.type === 'agtable') {
    // Стили передаём через primitive.style (уже применяются обёрткой)
    return React.createElement(AGTable, { primitive, context, key: primitive.id });
  }

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

  // Для input с пустым/отсутствующим типом устанавливаем 'text'
  if (tag === 'input' && (!attributes.type || attributes.type === '{{inputType}}')) {
    attributes.type = 'text';
  }

  // Поля ввода (input/textarea/select) заполняют весь контейнер примитива,
  // чтобы фактический размер совпадал с размерами, указанными в примитиве
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    attributes.style = {
      ...(attributes.style || {}),
      width: '100%',
      height: '100%',
      boxSizing: 'border-box'
    };
  }

  // Обработка специальных случаев для input/textarea
  if (tag === 'input' || tag === 'textarea') {
    // Если есть defaultValue и оно не пустое, удаляем value чтобы избежать конфликта
    // defaultValue используется для неконтролируемых полей (редактируемых)
    if (attributes.defaultValue !== undefined && attributes.defaultValue !== null && 
        String(attributes.defaultValue).trim() !== '' && String(attributes.defaultValue).startsWith('{{')) {
      delete attributes.value;
    }
    // Преобразуем readOnly строковое значение в булево для React
    if (typeof attributes.readOnly === 'string') {
      attributes.readOnly = attributes.readOnly.toLowerCase() === 'true';
    } else if (typeof attributes.readOnly !== 'boolean') {
      attributes.readOnly = false;
    }
    // Для input — не рендерим children как текст
    if (tag === 'input') {
      return React.createElement(tag, attributes);
    }
    // Для textarea — значение рендерится как текст внутри элемента (children), 
    // а не через атрибут value
    const textareaValue = resolveTemplate(
      primitive.value !== undefined ? primitive.value : (render.text !== undefined ? render.text : ''),
      primitive,
      context
    );
    // Для textarea значение рендерится как children (неконтролируемое поле, defaultValue).
    // Чтобы при изменении контекста (например, в предпросмотре, когда контекст загружается
    // уже после первого рендера) содержимое перерисовывалось, используем key на основе
    // вычисленного значения — React перемонтирует textarea при его изменении.
    return React.createElement(tag, { ...attributes, key: textareaValue }, textareaValue);
  }

  // Текст
  let children = [];
  if (render.text !== undefined) {
    const text = resolveTemplate(render.text, primitive, context);
    children.push(text);
  }

  // Иконка для кнопки (если указана)
  if (tag === 'button' && primitive.icon) {
    const icon = getIconById(primitive.icon);
    if (icon) {
      const iconSize = primitive.iconSize || 16;
      children.unshift(
        React.createElement(IconSvg, {
          key: 'icon',
          icon,
          size: iconSize,
          color: 'currentColor',
          className: 'button-icon'
        })
      );
    }
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
    visible: true, // видимость примитива на холсте (true — показывать, false — скрыть)
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