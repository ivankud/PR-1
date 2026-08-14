// Форма свойств выбранного примитива
import React, { useState } from 'react';
import { useEditor } from '../../state/EditorContext';
import { getPrimitiveTemplate } from '../../utils/primitiveRenderer';
import { SIZE_UNITS } from '../../utils/sizeUtils';
import JsonDialog from './JsonDialog';

function PropertiesForm({ primitive }) {
  const { state, dispatch } = useEditor();
  const { primitives } = state;
  // Свойство, открытое в диалоговом окне JSON-редактора
  const [dialogProp, setDialogProp] = useState(null);

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

  // Рендер поля размера с выбором единицы измерения
  const renderSizeInput = (dimension, label) => {
    const unit = primitive[`${dimension}Unit`] || 'px';
    const value = primitive[dimension] !== undefined ? primitive[dimension] : (dimension === 'width' ? 100 : 40);

    return (
      <div className="property-row">
        <label className="property-label">{label}</label>
        <input
          type="number"
          value={value}
          disabled={unit === 'auto'}
          onChange={(e) => handleChange(dimension, parseFloat(e.target.value) || 0)}
        />
        <select
          className="size-unit-select"
          value={unit}
          onChange={(e) => handleChange(`${dimension}Unit`, e.target.value)}
          title="Единица измерения"
        >
          {SIZE_UNITS.map(u => (
            <option key={u} value={u}>{u}</option>
          ))}
        </select>
      </div>
    );
  };

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
      case 'json':
        // JSON-свойство: показываем кнопку-переключатель для открытия диалогового окна
        return (
          <div className="property-json-toggle">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => setDialogProp(prop)}
              title="Открыть редактор JSON"
            >
              ⚙ Открыть редактор
            </button>
          </div>
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
        {allProperties.map(prop => {
          // Для width и height используем специальный рендер с единицами измерения
          if (prop.name === 'width') return renderSizeInput('width', 'Ширина');
          if (prop.name === 'height') return renderSizeInput('height', 'Высота');
          return (
            <div key={prop.name} className="property-row">
              <label className="property-label">{prop.label || prop.name}</label>
              {renderInput(prop)}
            </div>
          );
        })}
      </div>

      {/* Диалоговое окно редактирования JSON-свойства */}
      {dialogProp && (
        <JsonDialog
          title={dialogProp.label || dialogProp.name}
          value={primitive[dialogProp.name] !== undefined ? primitive[dialogProp.name] : (dialogProp.default !== undefined ? dialogProp.default : '')}
          onSave={(newValue) => handleChange(dialogProp.name, newValue)}
          onClose={() => setDialogProp(null)}
        />
      )}

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