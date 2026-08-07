// Сплиттер (перетаскиваемая разделительная полоса) между панелями
import React, { useRef, useCallback, useState } from 'react';

function Splitter({ onDrag, direction = 'vertical', className = '' }) {
  const dragRef = useRef(null);
  const [active, setActive] = useState(false);

  const handleMouseDown = useCallback((e) => {
    if (e.button !== 0) return;
    e.preventDefault();
    dragRef.current = {
      lastX: e.clientX,
      lastY: e.clientY
    };
    setActive(true);

    const handleMouseMove = (ev) => {
      if (!dragRef.current) return;
      // Дельта относительно предыдущего события (приращение)
      const deltaX = ev.clientX - dragRef.current.lastX;
      const deltaY = ev.clientY - dragRef.current.lastY;
      dragRef.current.lastX = ev.clientX;
      dragRef.current.lastY = ev.clientY;
      if (onDrag) onDrag(direction === 'vertical' ? deltaX : deltaY);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      dragRef.current = null;
      setActive(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [onDrag, direction]);

  return (
    <div
      className={`splitter splitter-${direction} ${active ? 'active' : ''} ${className}`}
      onMouseDown={handleMouseDown}
      title="Перетащите, чтобы изменить ширину"
    />
  );
}

export default Splitter;