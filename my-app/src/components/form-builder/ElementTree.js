import React, { useState } from 'react';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Иерархическое дерево элементов формы.
 * Показывает структуру элементов (включая вложенные в контейнеры).
 * Клик по элементу дерева выделяет его на холсте.
 */
function ElementTree({ form, selectedElementId, onSelectElement, onRemoveElement }) {
  const [collapsed, setCollapsed] = useState({});

  const toggleCollapse = (id) => {
    setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelect = (id) => {
    onSelectElement(id);
  };

  const handleRemove = (e, id) => {
    e.stopPropagation();
    onRemoveElement(id);
  };

  // Рекурсивный рендер элемента дерева
  const renderTreeItem = (el, depth) => {
    const def = ELEMENT_TYPES[el.type];
    const isContainer = el.type === 'container';
    const isCollapsed = collapsed[el.id];
    const isSelected = el.id === selectedElementId;
    const hasChildren = el.children && el.children.length > 0;
    const isRoot = el.isRoot === true;

    return (
      <div key={el.id}>
        <div
          className={`element-tree-item ${isSelected ? 'selected' : ''}`}
          style={{ paddingLeft: `${depth * 20 + 8}px` }}
          onClick={() => handleSelect(el.id)}
        >
          <div className="element-tree-row">
            {isContainer ? (
              <button
                className="element-tree-toggle"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleCollapse(el.id);
                }}
              >
                {hasChildren ? (isCollapsed ? '▸' : '▾') : '•'}
              </button>
            ) : (
              <span className="element-tree-toggle-placeholder" />
            )}

            <span className="element-tree-icon">{def ? def.icon : '❓'}</span>
            <span className="element-tree-label">
              {el.label || el.name || (def ? def.label : el.type)}
            </span>
            <span className="element-tree-type">{def ? def.label : el.type}</span>

            {!isRoot && (
              <button
                className="element-tree-remove"
                onClick={(e) => handleRemove(e, el.id)}
                title="Удалить элемент"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {isContainer && hasChildren && !isCollapsed && (
          <div className="element-tree-children">
            {el.children.map((child) => renderTreeItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  if (!form.elements || form.elements.length === 0) {
    return (
      <div className="element-tree-empty">
        <p>Форма пуста</p>
        <p className="element-tree-hint">Добавьте элементы из палитры</p>
      </div>
    );
  }

  return (
    <div className="element-tree">
      {form.elements.map((el) => renderTreeItem(el, 0))}
    </div>
  );
}

export default ElementTree;