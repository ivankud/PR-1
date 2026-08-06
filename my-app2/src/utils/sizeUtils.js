// Утилиты для работы с размерами примитивов и единицами измерения

// Доступные единицы измерения
export const SIZE_UNITS = ['px', '%', 'vw', 'vh', 'auto'];

// Получение CSS-значения ширины с учётом единицы измерения
export function getWidthValue(primitive) {
  const unit = primitive.widthUnit || 'px';
  if (unit === 'auto') return 'auto';
  const value = primitive.width !== undefined ? primitive.width : 100;
  return `${value}${unit}`;
}

// Получение CSS-значения высоты с учётом единицы измерения
export function getHeightValue(primitive) {
  const unit = primitive.heightUnit || 'px';
  if (unit === 'auto') return 'auto';
  const value = primitive.height !== undefined ? primitive.height : 40;
  return `${value}${unit}`;
}

// Получение объекта style с шириной и высотой
export function getSizeStyle(primitive) {
  return {
    width: getWidthValue(primitive),
    height: getHeightValue(primitive)
  };
}

// Проверка, является ли размер в пикселях (для ресайза)
export function isPxSize(primitive, dimension) {
  const unit = dimension === 'width' ? primitive.widthUnit : primitive.heightUnit;
  return !unit || unit === 'px';
}

// Получение числового значения размера (для ресайза)
export function getNumericSize(primitive, dimension) {
  return dimension === 'width'
    ? (primitive.width !== undefined ? primitive.width : 100)
    : (primitive.height !== undefined ? primitive.height : 40);
}

// Обновление размера с сохранением единицы измерения
export function updateSize(primitive, dimension, value) {
  const unit = dimension === 'width' ? primitive.widthUnit : primitive.heightUnit;
  if (unit && unit !== 'px') {
    // Для не-px единиц просто обновляем числовое значение
    return { ...primitive, [dimension]: value };
  }
  return { ...primitive, [dimension]: Math.max(10, value) };
}

// ===== Функции для корневого элемента (формы/холста) =====

// Получение CSS-значения ширины холста с учётом единицы измерения
export function getCanvasWidthValue(canvas) {
  const unit = canvas.widthUnit || 'px';
  if (unit === 'auto') return 'auto';
  const value = canvas.width !== undefined ? canvas.width : 800;
  return `${value}${unit}`;
}

// Получение CSS-значения высоты холста с учётом единицы измерения
export function getCanvasHeightValue(canvas) {
  const unit = canvas.heightUnit || 'px';
  if (unit === 'auto') return 'auto';
  const value = canvas.height !== undefined ? canvas.height : 600;
  return `${value}${unit}`;
}

// Получение объекта style с шириной и высотой холста
export function getCanvasSizeStyle(canvas) {
  return {
    width: getCanvasWidthValue(canvas),
    height: getCanvasHeightValue(canvas)
  };
}
