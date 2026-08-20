import { useState } from 'react';
import Toolbox from './components/Toolbox';
import FlowCanvas from './components/FlowCanvas';
import PropertiesPanel from './components/PropertiesPanel';
import CodePreview from './components/CodePreview';
import { useScenarioStore, NODE_DESCRIPTORS, NODE_TYPES } from './store/scenarioStore';

function App() {
  const { 
    scenario, 
    selectedNode,
    addNode, 
    setSelectedNode, 
    updateNodeConfig, 
    removeNode, 
    updateScenario 
  } = useScenarioStore();
  const [showProperties, setShowProperties] = useState(true);
  const [showCodePreview, setShowCodePreview] = useState(true);
  const [scenarioNameEdit, setScenarioNameEdit] = useState(false);

  // Добавление узла из Toolbox
  const handleNodeAdd = (type) => {
    const id = addNode(type);
    // Автооткрытие панели свойств для нового узла
    setTimeout(() => setSelectedNode(id), 100);
  };

  // Обновление конфигурации узла
  const handleUpdateConfig = (nodeId, configUpdates) => {
    updateNodeConfig(nodeId, configUpdates);
  };

  // Удаление узла
  const handleRemoveNode = (nodeId) => {
    if (window.confirm('Удалить этот узел?')) {
      // Находим узел в store и удаляем
      const node = scenario.nodes.find(n => n.id === nodeId);
      if (node) {
        // Удаляем через DOM (в реальном приложении через store action)
        const element = document.querySelector(`[data-node-id="${nodeId}"]`);
        if (element) element.remove();
      }
    }
  };

  // Импорт сценария из JSON
  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          try {
            const data = JSON.parse(event.target.result);
            updateScenario(data);
          } catch (err) {
            alert('Ошибка импорта: неверный формат JSON');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  // Экспорт сценария в JSON
  const handleExport = () => {
    const json = JSON.stringify(scenario, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name || 'scenario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Очистка сценария
  const handleClear = () => {
    if (window.confirm('Очистить весь сценарий?')) {
      updateScenario({
        name: 'new_scenario',
        description: '',
        transactionMode: true,
        inputs: [{ name: 'p_input_json', type: 'jsonb' }],
        nodes: [],
        edges: []
      });
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', fontFamily: 'sans-serif', overflow: 'hidden' }}>
      {/* Левая панель: Toolbox */}
      <Toolbox onNodeAdd={handleNodeAdd} />

      {/* Центральная часть: Canvas */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Верхняя панель инструментов */}
        <div
          style={{
            height: 48,
            background: '#2c3e50',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            padding: '0 12px',
            gap: 8,
            borderBottom: '1px solid #34495e',
          }}
        >
          {/* Название сценария */}
          {scenarioNameEdit ? (
            <input
              value={scenario.name}
              onChange={(e) => updateScenario({ name: e.target.value })}
              onBlur={() => setScenarioNameEdit(false)}
              onKeyDown={(e) => e.key === 'Enter' && setScenarioNameEdit(false)}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#34495e',
                border: '1px solid #4a6278',
                color: 'white',
                padding: '4px 8px',
                fontSize: 13,
                fontWeight: 'bold',
                borderRadius: 3,
                outline: 'none',
              }}
            />
          ) : (
            <div
              onClick={() => setScenarioNameEdit(true)}
              style={{
                fontSize: 14,
                fontWeight: 'bold',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 3,
              }}
              onMouseEnter={(e) => (e.target.style.background = '#34495e')}
              onMouseLeave={(e) => (e.target.style.background = 'transparent')}
            >
              📋 {scenario.name}
            </div>
          )}

          <div style={{ width: 1, height: 24, background: '#34495e' }} />

          {/* Кнопки управления */}
          <button
            onClick={handleImport}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              background: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#2980b9')}
            onMouseLeave={(e) => (e.target.style.background = '#3498db')}
          >
            📂 Импорт
          </button>
          <button
            onClick={handleExport}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              background: '#27ae60',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#219a52')}
            onMouseLeave={(e) => (e.target.style.background = '#27ae60')}
          >
            💾 Экспорт
          </button>
          <button
            onClick={handleClear}
            style={{
              padding: '4px 12px',
              fontSize: 12,
              background: '#e74c3c',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.target.style.background = '#c0392b')}
            onMouseLeave={(e) => (e.target.style.background = '#e74c3c')}
          >
            🗑️ Очистить
          </button>

          <div style={{ flex: 1 }} />

          {/* Переключатели панелей */}
          <button
            onClick={() => setShowProperties(!showProperties)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              background: showProperties ? '#8e44ad' : '#5d6d7e',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            ⚙️ Свойства
          </button>
          <button
            onClick={() => setShowCodePreview(!showCodePreview)}
            style={{
              padding: '4px 10px',
              fontSize: 12,
              background: showCodePreview ? '#16a085' : '#5d6d7e',
              color: 'white',
              border: 'none',
              borderRadius: 3,
              cursor: 'pointer',
            }}
          >
            📜 Код
          </button>
        </div>

        {/* Основная область с canvas */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          <FlowCanvas />
          
          {/* Панель свойств (опционально) */}
          {showProperties && (
            <PropertiesPanel
              selectedNode={selectedNode}
              onUpdateConfig={handleUpdateConfig}
              onRemoveNode={handleRemoveNode}
            />
          )}

          {/* Панель предпросмотра кода */}
          {showCodePreview && <CodePreview />}
        </div>
      </div>
    </div>
  );
}

export default App;