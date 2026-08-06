// Левая панель с вкладками: примитивы, слои, функции
import React, { useState } from 'react';
import PrimitivesTab from './PrimitivesTab';
import LayersTab from './LayersTab';
import FunctionsTab from './FunctionsTab';

function LeftPanel() {
  const [activeTab, setActiveTab] = useState('primitives');

  return (
    <div className="left-panel">
      <div className="panel-tabs">
        <button
          className={`panel-tab ${activeTab === 'primitives' ? 'active' : ''}`}
          onClick={() => setActiveTab('primitives')}
        >
          Примитивы
        </button>
        <button
          className={`panel-tab ${activeTab === 'layers' ? 'active' : ''}`}
          onClick={() => setActiveTab('layers')}
        >
          Слои
        </button>
        <button
          className={`panel-tab ${activeTab === 'functions' ? 'active' : ''}`}
          onClick={() => setActiveTab('functions')}
        >
          Функции
        </button>
      </div>
      <div className="panel-content">
        {activeTab === 'primitives' && <PrimitivesTab />}
        {activeTab === 'layers' && <LayersTab />}
        {activeTab === 'functions' && <FunctionsTab />}
      </div>
    </div>
  );
}

export default LeftPanel;