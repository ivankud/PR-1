import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ELEMENT_TYPES } from '../../utils/formSchema';

/**
 * Холст формы с сеткой и позиционированием элементов.
 * Поддерживает drag & drop перемещение, resize, контейнеры с вложенными элементами.
 */
function FormCanvas({
  form,
  selectedElementId,
  onSelectElement,
  onRemoveElement,
  onDuplicateElement,
  onMoveElement,
  onUpdateElementPosition,
  onUpdateElementSize,
  onAddElement,
  onUpdateCanvasSettings,
}) {
  const workspaceRef = useRef(null);
  const [dragState, setDragState] = useState(null); // { id, startX, startY, origX, origY, type: 'move' | 'resize' }
  const [hoverContainerId, setHoverContainerId] = useState(null);

  const canvas = form.canvas || { width: 800, height: 600, gridSize: 20, showGrid: true };
  const gridSize = canvas.gridSize || 20;
  // Размеры невидимой рабочей области вокруг страницы
  const workspaceSize = 2000;
  // Корневой контейнер — белая область холста (расположен в (0, 0))
  const pageOffsetX = 0;
  const pageOffsetY = 0;

  // Центрирование прокрутки рабочей области на странице при монтировании
  useEffect(() => {
    const ws = workspaceRef.current;
    if (ws) {
      ws.scrollLeft = pageOffsetX - 40;
      ws.scrollTop = pageOffsetY - 40;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Привязка к сетке
  const snapToGrid = useCallback(
    (value) => {
      return Math.round(value / gridSize) * gridSize;
    },
    [gridSize]
  );

  // Начало перетаскивания
  const handleDragStart = useCallback(
    (e, element) => {
      e.stopPropagation();
      setDragState({
        id: element.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x || 0,
        origY: element.y || 0,
        type: 'move',
      });
    },
    []
  );

  // Начало изменения размера
  const handleResizeStart = useCallback(
    (e, element, parentSize) => {
      e.stopPropagation();
      setDragState({
        id: element.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x || 0,
        origY: element.y || 0,
        origWidth: element.width || 200,
        origHeight: element.height || 40,
        widthUnit: element.widthUnit || 'px',
        heightUnit: element.heightUnit || 'px',
        parentSize: parentSize || { width: 800, height: 600 },
        type: 'resize',
      });
    },
    []
  );

  // Обработка движения мыши
  const handleMouseMove = useCallback(
    (e) => {
      if (!dragState) return;

      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;

      if (dragState.type === 'move') {
        const newX = snapToGrid(dragState.origX + dx);
        const newY = snapToGrid(dragState.origY + dy);
        onUpdateElementPosition(dragState.id, newX, newY);
      } else if (dragState.type === 'resize') {
        const parentW = dragState.parentSize.width || 800;
        const parentH = dragState.parentSize.height || 600;

        // Если единица измерения — %, конвертируем исходное значение в px,
        // добавляем смещение и конвертируем обратно в %
        let newWidth;
        let newHeight;
        if (dragState.widthUnit === '%') {
          const origWidthPx = (dragState.origWidth / 100) * parentW;
          const newWidthPx = Math.max(20, snapToGrid(origWidthPx + dx));
          newWidth = Math.round((newWidthPx / parentW) * 100);
        } else {
          newWidth = Math.max(20, snapToGrid(dragState.origWidth + dx));
        }

        if (dragState.heightUnit === '%') {
          const origHeightPx = (dragState.origHeight / 100) * parentH;
          const newHeightPx = Math.max(20, snapToGrid(origHeightPx + dy));
          newHeight = Math.round((newHeightPx / parentH) * 100);
        } else {
          newHeight = Math.max(20, snapToGrid(dragState.origHeight + dy));
        }

        onUpdateElementSize(
          dragState.id,
          newWidth,
          newHeight,
          dragState.widthUnit,
          dragState.heightUnit
        );
      }
    },
    [dragState, snapToGrid, onUpdateElementPosition, onUpdateElementSize]
  );

  // Завершение перетаскивания
  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setHoverContainerId(null);
  }, []);

  // Выбранный элемент (для панели операций)
  const selectedElement = selectedElementId
    ? (function findInList(elements) {
        for (const el of elements) {
          if (el.id === selectedElementId) return el;
          if (el.children && el.children.length > 0) {
            const found = findInList(el.children);
            if (found) return found;
          }
        }
        return null;
      })(form.elements)
    : null;

  const isSelectedRoot = selectedElement?.isRoot === true;
  const hasSelection = !!selectedElement && !isSelectedRoot;

  // Рендер элемента на холсте.
  // isInContainer определяет, рендерится ли элемент внутри контейнера.
  // parentSize — размер родителя (страница или контейнер), нужен для resize в %.
  // Для корневых элементов позиции рассчитываются относительно страницы
  // (с учётом смещения страницы внутри рабочей области).
  const renderElement = (element, isInContainer = false, parentSize = null) => {
    const def = ELEMENT_TYPES[element.type];
    const isSelected = element.id === selectedElementId;
    const isContainer = element.type === 'container';
    const isRoot = element.isRoot === true;

    // Размер родителя: для корневых элементов — страница, для вложенных — контейнер
    const effectiveParentSize =
      parentSize || { width: canvas.width || 800, height: canvas.height || 600 };

    // Смещение: корневые элементы — относительно страницы,
    // элементы внутри контейнера — относительно контейнера (0, 0)
    const offsetX = isInContainer ? 0 : pageOffsetX;
    const offsetY = isInContainer ? 0 : pageOffsetY;

    // Позиция определяется из CSS (left/top), по умолчанию absolute
    const css = element.css || {};
    const position = css.position || 'absolute';
    const cssLeft = css.left ? parseInt(css.left, 10) || 0 : (element.x || 0);
    const cssTop = css.top ? parseInt(css.top, 10) || 0 : (element.y || 0);

    const widthUnit = element.widthUnit || 'px';
    const heightUnit = element.heightUnit || 'px';

    const style = {
      position,
      left: `${offsetX + cssLeft}px`,
      top: `${offsetY + cssTop}px`,
      width: `${element.width || 200}${widthUnit}`,
      height: isContainer ? `${element.height || 200}${heightUnit}` : `${element.height || 40}${heightUnit}`,
      minHeight: isContainer ? '60px' : 'auto',
      ...css,
    };

    // Для контейнера используем числовые значения width/height из data,
    // а CSS width/height не переопределяют их
    if (isContainer) {
      style.width = `${element.width || 300}${widthUnit}`;
      style.height = `${element.height || 200}${heightUnit}`;
    }

    return (
      <div
        key={element.id}
        className={`canvas-element ${isSelected ? 'selected' : ''} ${
          isContainer ? 'container' : ''
        } ${hoverContainerId === element.id ? 'hover-container' : ''}`}
        style={style}
        onClick={(e) => {
          e.stopPropagation();
          onSelectElement(element.id);
        }}
        onMouseDown={(e) => {
          if (isContainer) {
            // Для контейнера перетаскивание по заголовку
            if (e.target.closest('.canvas-element-header')) {
              handleDragStart(e, element);
            }
          } else {
            handleDragStart(e, element);
          }
        }}
        onMouseEnter={() => isContainer && setHoverContainerId(element.id)}
        onMouseLeave={() => isContainer && setHoverContainerId(null)}
      >
        <div className="canvas-element-header">
          <span className="canvas-element-icon">{def ? def.icon : '❓'}</span>
          <span className="canvas-element-type">{def ? def.label : element.type}</span>
          <span className="canvas-element-name">{element.name}</span>
          <div className="canvas-element-actions">
            {!isRoot && !isInContainer && (
              <>
                <button
                  className="canvas-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, -1);
                  }}
                  title="Переместить вверх"
                >
                  ↑
                </button>
                <button
                  className="canvas-action-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onMoveElement(element.id, 1);
                  }}
                  title="Переместить вниз"
                >
                  ↓
                </button>
              </>
            )}
            {!isRoot && (
              <button
                className="canvas-action-btn danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveElement(element.id);
                }}
                title="Удалить элемент"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        <div className="canvas-element-preview">
          {isContainer ? (
            <div className="canvas-container-content">
              <div className="canvas-container-hint">
                <span>📦 Контейнер</span>
                <span className="canvas-container-count">
                  {element.children ? element.children.length : 0} элементов
                </span>
              </div>
              {element.children && element.children.length > 0 ? (
                <div className="canvas-container-children">
                  {element.children.map((child) =>
                    renderElement(child, true, {
                      width: element.width || 300,
                      height: element.height || 200,
                    })
                  )}
                </div>
              ) : (
                <div className="canvas-container-empty">
                  Перетащите элементы сюда или добавьте через палитру
                </div>
              )}
            </div>
          ) : element.type === 'button' ? (
            <span className="canvas-preview-button">
              {element.buttonText || element.label}
            </span>
          ) : element.type === 'checkbox' ? (
            <label className="canvas-preview-checkbox">
              <input type="checkbox" disabled />
              <span>{element.label}</span>
              {element.required && <span className="required-mark">*</span>}
            </label>
          ) : element.type === 'radio' ? (
            <div className="canvas-preview-radio-group">
              <div className="canvas-preview-label">
                {element.label}
                {element.required && <span className="required-mark">*</span>}
              </div>
              {(element.options || []).map((opt, i) => (
                <label key={i} className="canvas-preview-radio">
                  <input type="radio" disabled />
                  <span>{opt}</span>
                </label>
              ))}
            </div>
          ) : element.type === 'select' ? (
            <div className="canvas-preview-field">
              <div className="canvas-preview-label">
                {element.label}
                {element.required && <span className="required-mark">*</span>}
              </div>
              <select className="canvas-preview-input" disabled>
                <option>— Выберите —</option>
                {(element.options || []).map((opt, i) => (
                  <option key={i}>{opt}</option>
                ))}
              </select>
            </div>
          ) : element.type === 'textarea' ? (
            <div className="canvas-preview-field">
              <div className="canvas-preview-label">
                {element.label}
                {element.required && <span className="required-mark">*</span>}
              </div>
              <textarea
                className="canvas-preview-input canvas-preview-textarea"
                placeholder={element.placeholder || ''}
                rows={element.rows || 4}
                disabled
              />
            </div>
          ) : (
            // Поля ввода: text, number, date — подпись над полем, а не как значение
            <div className="canvas-preview-field">
              <div className="canvas-preview-label">
                {element.label}
                {element.required && <span className="required-mark">*</span>}
              </div>
              <input
                type={element.type === 'number' ? 'number' : element.type === 'date' ? 'date' : 'text'}
                className="canvas-preview-input"
                placeholder={element.placeholder || ''}
                disabled
              />
            </div>
          )}
        </div>

        {element.events && Object.keys(element.events).length > 0 && (
          <div className="canvas-element-events">
            {Object.entries(element.events)
              .filter(([, code]) => code && code.trim())
              .map(([eventName]) => (
                <span key={eventName} className="canvas-event-badge">
                  ⚡ {eventName}
                </span>
              ))}
          </div>
        )}

        {/* Ручка изменения размера (не для корневого контейнера) */}
        {isSelected && !isRoot && (
          <div
            className="canvas-resize-handle"
            onMouseDown={(e) => handleResizeStart(e, element, effectiveParentSize)}
            title="Изменить размер"
          />
        )}
      </div>
    );
  };

  return (
    <div className="canvas">
      <div className="canvas-header">
        <h3 className="canvas-title">{form.name || 'Форма'}</h3>
        <div className="canvas-header-right">
          <span className="canvas-count">
            {form.elements.length}{' '}
            {form.elements.length === 1 ? 'элемент' : 'элементов'}
          </span>
          <span className="canvas-grid-info">Сетка: {gridSize}px</span>
        </div>
      </div>

      {/* Панель операций над выбранным элементом */}
      <div className="canvas-operations-bar">
        <span className="canvas-operations-label">Операции:</span>
        <button
          className="canvas-operation-btn"
          disabled={!hasSelection}
          onClick={() => onDuplicateElement(selectedElementId)}
          title="Дублировать элемент"
        >
          ⧉ Дублировать
        </button>
        <button
          className="canvas-operation-btn"
          disabled={!hasSelection}
          onClick={() => onMoveElement(selectedElementId, -1)}
          title="Переместить вверх"
        >
          ↑ Вверх
        </button>
        <button
          className="canvas-operation-btn"
          disabled={!hasSelection}
          onClick={() => onMoveElement(selectedElementId, 1)}
          title="Переместить вниз"
        >
          ↓ Вниз
        </button>
        <button
          className="canvas-operation-btn danger"
          disabled={!hasSelection}
          onClick={() => onRemoveElement(selectedElementId)}
          title="Удалить элемент"
        >
          ✕ Удалить
        </button>
      </div>

      {/* Рабочая область вокруг страницы (невидимая часть холста) */}
      <div
        ref={workspaceRef}
        className={`canvas-workspace ${canvas.showGrid ? 'show-grid' : ''}`}
        style={{
          width: `${workspaceSize}px`,
          height: `${workspaceSize}px`,
          backgroundSize: `${gridSize}px ${gridSize}px`,
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={() => onSelectElement(null)}
      >
        {/* Элементы формы (корневой контейнер и вложенные) */}
        {form.elements.length > 0 ? (
          form.elements.map((el) => renderElement(el, false))
        ) : (
          <div className="canvas-empty">
            <div className="canvas-empty-icon">📋</div>
            <p>Форма пуста</p>
            <p className="canvas-empty-hint">
              Добавьте элементы из палитры слева
            </p>
          </div>
        )}
      </div>

      <div className="canvas-footer">
        <div className="canvas-footer-left">
          <span>💡 Перетаскивайте элементы мышью для перемещения</span>
          <span>Выделите элемент и тяните за угол для изменения размера</span>
        </div>
        <div className="canvas-footer-actions">
          <button
            className={`builder-btn canvas-settings-btn ${canvas.showGrid ? 'active' : ''}`}
            onClick={() =>
              onUpdateCanvasSettings({ showGrid: !canvas.showGrid })
            }
            title="Показать/скрыть сетку"
          >
            ⊞ Сетка
          </button>
          <select
            className="canvas-grid-select"
            value={gridSize}
            onChange={(e) =>
              onUpdateCanvasSettings({ gridSize: parseInt(e.target.value) || 20 })
            }
            title="Размер сетки"
          >
            <option value={10}>10px</option>
            <option value={20}>20px</option>
            <option value={30}>30px</option>
            <option value={40}>40px</option>
            <option value={50}>50px</option>
          </select>
        </div>
      </div>
    </div>
  );
}

export default FormCanvas;