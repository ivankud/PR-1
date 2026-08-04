import React from 'react';

/**
 * Рендерит отдельный элемент формы на основе его конфигурации.
 * При срабатывании событий вызывает переданный обработчик.
 */
function ElementRenderer({ element, value, onChange, onEvent, disabled }) {
  const handleEvent = (eventName) => (event) => {
    if (onEvent) {
      onEvent(eventName, event);
    }
  };

  const commonProps = {
    name: element.name,
    disabled,
    onFocus: handleEvent('onFocus'),
    onBlur: handleEvent('onBlur'),
  };

  // Базовый стиль из CSS-настроек элемента.
  // Позиционные/габаритные свойства (position, left, top, width, height, margin)
  // относятся к обёртке (.form-renderer-field) и не должны применяться к самому
  // полю ввода — иначе поле "съезжает" относительно надписи в предпросмотре.
  const {
    position: _pos,
    left: _left,
    top: _top,
    right: _right,
    bottom: _bottom,
    width: _width,
    height: _height,
    margin: _margin,
    ...visualCss
  } = element.css || {};

  // Внутреннее содержимое растягивается на 100% по ширине и высоте родителя
  const style = {
    width: '100%',
    height: '100%',
    boxSizing: 'border-box',
    ...visualCss,
  };


  switch (element.type) {
    case 'text':
      return (
        <input
          type="text"
          className="form-element-input"
          style={style}
          placeholder={element.placeholder}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            handleEvent('onChange')(e);
          }}
          onKeyUp={handleEvent('onKeyUp')}
          {...commonProps}
        />
      );

    case 'textarea':
      return (
        <textarea
          className="form-element-input"
          style={style}
          placeholder={element.placeholder}
          rows={element.rows || 4}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            handleEvent('onChange')(e);
          }}
          onKeyUp={handleEvent('onKeyUp')}
          {...commonProps}
        />
      );

    case 'number':
      return (
        <input
          type="number"
          className="form-element-input"
          style={style}
          placeholder={element.placeholder}
          min={element.min}
          max={element.max}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            handleEvent('onChange')(e);
          }}
          onKeyUp={handleEvent('onKeyUp')}
          {...commonProps}
        />
      );

    case 'date':
      return (
        <input
          type="date"
          className="form-element-input"
          style={style}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            handleEvent('onChange')(e);
          }}
          {...commonProps}
        />
      );

    case 'select':
      return (
        <select
          className="form-element-input"
          style={style}
          value={value || ''}
          onChange={(e) => {
            if (onChange) onChange(e.target.value);
            handleEvent('onChange')(e);
          }}
          {...commonProps}
        >
          <option value="">— Выберите —</option>
          {(element.options || []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case 'checkbox':
      return (
        <label className="form-element-checkbox" style={style}>
          <input
            type="checkbox"
            checked={!!value}
            onChange={(e) => {
              if (onChange) onChange(e.target.checked);
              handleEvent('onChange')(e);
            }}
            {...commonProps}
          />
          <span>{element.label}</span>
        </label>
      );

    case 'radio':
      return (
        <div className="form-element-radio-group" style={style}>
          {(element.options || []).map((opt, i) => (
            <label key={i} className="form-element-radio">
              <input
                type="radio"
                name={element.name}
                value={opt}
                checked={value === opt}
                onChange={(e) => {
                  if (onChange) onChange(e.target.value);
                  handleEvent('onChange')(e);
                }}
                {...commonProps}
              />
              <span>{opt}</span>
            </label>
          ))}
        </div>
      );

    case 'button':
      return (
        <button
          type="button"
          className={`form-element-button btn-${element.variant || 'primary'}`}
          style={style}
          onClick={handleEvent('onClick')}
          {...commonProps}
        >
          {element.buttonText || element.label}
        </button>
      );

    default:
      return null;
  }
}

export default ElementRenderer;