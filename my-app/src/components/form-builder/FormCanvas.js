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
  onMoveElement,
  onUpdateElementPosition,
  onUpdateElementSize,
  onAddElement,
  onUpdateCanvasSettings,
}) {
  const canvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const [dragState, setDragState] = useState(null); // { id, startX, startY, origX, origY, type: 'move' | 'resize' }
  const [hoverContainerId, setHoverContainerId] = useState(null);

  const canvas = form.canvas || { width: 800, height: 600, gridSize: 20, showGrid: true };
  const gridSize = canvas.gridSize || 20;
  // Размеры невидимой рабочей области вокруг страницы
  const workspaceSize = 2000;
  // Размеры видимой страницы
  const pageWidth = canvas.width || 800;
  const pageHeight = canvas.height || 600;
  // Смещение страницы внутри рабочей области (центрирование)
  const pageOffsetX = (workspaceSize - pageWidth) / 2;
  const pageOffsetY = (workspaceSize - pageHeight) / 2;

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
      const rect = canvasRef.current.getBoundingClientRect();
      setDragState({
        id: element.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x || 0,
        origY: element.y || 0,
        type: 'move',
        canvasRect: rect,
      });
    },
    []
  );

  // Начало изменения размера
  const handleResizeStart = useCallback(
    (e, element) => {
      e.stopPropagation();
      const rect = canvasRef.current.getBoundingClientRect();
      setDragState({
        id: element.id,
        startX: e.clientX,
        startY: e.clientY,
        origX: element.x || 0,
        origY: element.y || 0,
        origWidth: element.width || 200,
        origHeight: element.height || 40,
        type: 'resize',
        canvasRect: rect,
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
        const newWidth = Math.max(20, snapToGrid(dragState.origWidth + dx));
        const newHeight = Math.max(20, snapToGrid(dragState.origHeight + dy));
        onUpdateElementSize(dragState.id, newWidth, newHeight);
      }
    },
    [dragState, snapToGrid, onUpdateElementPosition, onUpdateElementSize]
  );

  // Завершение перетаскивания
  const handleMouseUp = useCallback(() => {
    setDragState(null);
    setHoverContainerId(null);
  }, []);

  // Рендер элемента на холсте.
  // isInContainer определяет, рендерится ли элемент внутри контейнера.
  // Для корневых элементов позиции рассчитываются относительно страницы
  // (с учётом смещения страницы внутри рабочей области).
  const renderElement = (element, isInContainer = false) => {
    const def = ELEMENT_TYPES[element.type];
    const isSelected = element.id === selectedElementId;
    const isContainer = element.type === 'container';

    // Смещение: корневые элементы — относительно страницы,
    // элементы внутри контейнера — относительно контейнера (0, 0)
    const offsetX = isInContainer ? 0 : pageOffsetX;
    const offsetY = isInContainer ? 0 : pageOffsetY;

    // Позиция определяется из CSS (left/top), по умолчанию absolute
    const css = element.css || {};
    const position = css.position || 'absolute';
    const cssLeft = css.left ? parseInt(css.left, 10) || 0 : (element.x || 0);
    const cssTop = css.top ? parseInt(css.top, 10) || 0 : (element.y || 0);

    const style = {
      position,
      left: `${offsetX + cssLeft}px`,
      top: `${offsetY + cssTop}px`,
      width: `${element.width || 200}px`,
      height: isContainer ? `${element.height || 200}px` : 'auto',
      minHeight: isContainer ? '60px' : 'auto',
      ...css,
    };

    // Для контейнера используем числовые значения width/height из data,
    // а CSS width/height не переопределяют их
    if (isContainer) {
      style.width = `${element.width || 300}px`;
      style.height = `${element.height || 200}px`;
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
            {!isInContainer && (
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
                  {element.children.map((child) => renderElement(child, true))}
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
          ) : (
            <span className="canvas-preview-label">
              {element.label}
              {element.required && <span className="required-mark">*</span>}
            </span>
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

        {/* Ручка изменения размера */}
        {isSelected && (
          <div
            className="canvas-resize-handle"
            onMouseDown={(e) => handleResizeStart(e, element)}
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
        {/* Видимая страница — декоративная подложка */}
        <div
          ref={canvasRef}
          className={`canvas-page ${canvas.showGrid ? 'show-grid' : ''}`}
          style={{
            position: 'absolute',
            left: `${pageOffsetX}px`,
            top: `${pageOffsetY}px`,
            width: `${pageWidth}px`,
            height: `${pageHeight}px`,
            backgroundSize: `${gridSize}px ${gridSize}px`,
          }}
        >
          {form.elements.length === 0 && (
            <div className="canvas-empty">
              <div className="canvas-empty-icon">📋</div>
              <p>Форма пуста</p>
              <p className="canvas-empty-hint">
                Добавьте элементы из палитры слева
              </p>
            </div>
          )}
        </div>

        {/* Элементы формы на всей рабочей области (видимой и невидимой части) */}
        {form.elements.length > 0 &&
          form.elements.map((el) => renderElement(el, false))}
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