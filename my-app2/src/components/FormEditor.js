// Главный компонент редактора форм (4 панели)
import React, { useState } from 'react';
import ActionBar from './ActionBar';
import Canvas from './Canvas/Canvas';
import LeftPanel from './LeftPanel/LeftPanel';
import RightPanel from './RightPanel/RightPanel';
import Splitter from './Splitter';

function FormEditor({ onBack, onPreview }) {
  // Ширина левой и правой панелей (в px)
  const [leftWidth, setLeftWidth] = useState(240);
  const [rightWidth, setRightWidth] = useState(300);

  // Обработчик перетаскивания левого сплиттера
  const handleLeftDrag = (dx) => {
    setLeftWidth(prev => Math.max(160, Math.min(600, prev + dx)));
  };

  // Обработчик перетаскивания правого сплиттера
  const handleRightDrag = (dx) => {
    setRightWidth(prev => Math.max(240, Math.min(600, prev - dx)));
  };

  return (
    <div className="form-editor">
      <ActionBar onBack={onBack} onPreview={onPreview} />
      <div className="editor-main">
        <div className="editor-panel-left" style={{ width: leftWidth, minWidth: leftWidth }}>
          <LeftPanel />
        </div>
        <Splitter direction="vertical" onDrag={handleLeftDrag} />
        <div className="editor-canvas-area">
          <Canvas />
        </div>
        <Splitter direction="vertical" onDrag={handleRightDrag} />
        <div className="editor-panel-right" style={{ width: rightWidth, minWidth: rightWidth }}>
          <RightPanel />
        </div>
      </div>
    </div>
  );
}

export default FormEditor;
