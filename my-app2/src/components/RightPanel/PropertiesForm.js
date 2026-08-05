// Форма свойств выбранного примитива
import React from 'react';
import { useEditor } from '../../state/EditorContext';
import { getPrimitiveTemplate } from '../../utils/primitiveRenderer';

function PropertiesForm({ primitive }) {
  const { state, dispatch } = useEditor();
  const { primitives } = state;

  const template = getPrimitiveTemplate(primitives, primitive.type);

  const handleChange = (property, value) => {
    dispatch({ type: 'UPDATE_PROPERTY', id: primitive.id, property, value });
  };

  const handleStyleChange = (styleProp, value) => {
    dispatch({ type: 'UPDATE_STYLE', id: primitive.id, style: { [styleProp]: value } });
  };

  // Базовые свойства (всегда доступны)
  const baseProperties = [
    { name: 'name', label: 'Имя', type: 'string' },
    { name: 'width', label: 'Ширина', type: 'number' },
    { name: 'height', label: 'Высота', type: 'number' },
    { name: 'left', label: 'X (left)', type: 'number' },
    { name: 'top', label: 'Y (top)', type: 'number' }
  ];

  // Свойства из шаблона
  const templateProperties = template?.properties || [];

  // Объединяем, убирая дубликаты
  const allProperties = [...baseProperties];
  for (const prop of templateProperties) {
    if (!allProperties.find(p => p.name === prop.name)) {
      allProperties.push(prop);
    }
  }

  const renderInput = (prop) => {
    const value = primitive[prop.name] !== undefined ? primitive[prop.name] : (prop.default !== undefined ? prop.default : '');

    switch (prop.type) {
      case 'number':
        return (
          <input
            type="number"
            value={value}
            onChange={(e) => handleChange(prop.name, parseFloat(e.target.value) || 0)}
          />
        );
      case 'boolean':
        return (
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => handleChange(prop.name, e.target.checked)}
          />
        );
      case 'textarea':
        return (
          <textarea
            value={value}
            onChange={(e) => handleChange(prop.name, e.target.value)}
            rows={3}
          />
        );
      default:
        return (
          <input
            type="text"
            value={value}
            onChange={(e) => handleChange(prop.name, e.target.value)}
          />
        );
    }
  };

  return (
    <div className="properties-form">
      <div className="properties-section">
        <div className="properties-section-title">Основные свойства</div>
        {allProperties.map(prop => (
          <div key={prop.name} className="property-row">
            <label className="property-label">{prop.label || prop.name}</label>
            {renderInput(prop)}
          </div>
        ))}
      </div>

      <div className="properties-section">
        <div className="properties-section-title">Стиль</div>
        {primitive.style && Object.entries(primitive.style).map(([key, value]) => (
          <div key={key} className="property-row">
            <label className="property-label">{key}</label>
            <input
              type="text"
              value={value}
              onChange={(e) => handleStyleChange(key, e.target.value)}
            />
          </div>
        ))}
        {(!primitive.style || Object.keys(primitive.style).length === 0) && (
          <div className="property-empty">Нет стилей. Добавьте через CSS-редактор.</div>
        )}
      </div>

      {template && template.anchors && template.anchors.length > 0 && (
        <div className="properties-section">
          <div className="properties-section-title">Якоря (контекст)</div>
          {template.anchors.map(anchor => (
            <div key={anchor.name} className="property-row">
              <label className="property-label" title={anchor.description}>
                {anchor.name}
              </label>
              <span className="anchor-path">{anchor.path}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default PropertiesForm;