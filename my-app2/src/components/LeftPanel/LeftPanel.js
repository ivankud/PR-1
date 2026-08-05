// Левая панель с вкладками: примитивы и слои
import React, { useState } from 'react';
import PrimitivesTab from './PrimitivesTab';
import LayersTab from './LayersTab';

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
      </div>
      <div className="panel-content">
        {activeTab === 'primitives' ? <PrimitivesTab /> : <LayersTab />}
      </div>
    </div>
  );
}

export default LeftPanel;