// Главный компонент редактора форм (4 панели)
import React from 'react';
import ActionBar from './ActionBar';
import Canvas from './Canvas/Canvas';
import LeftPanel from './LeftPanel/LeftPanel';
import RightPanel from './RightPanel/RightPanel';

function FormEditor({ onBack, onPreview }) {
  return (
    <div className="form-editor">
      <ActionBar onBack={onBack} onPreview={onPreview} />
      <div className="editor-main">
        <LeftPanel />
        <Canvas />
        <RightPanel />
      </div>
    </div>
  );
}

export default FormEditor;