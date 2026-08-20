import { useCallback, useEffect, useState } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  MiniMap,
  Panel,
  useReactFlow,
  MarkerProp
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useScenarioStore, NODE_DESCRIPTORS } from '../store/scenarioStore';
import { GetNode, GetRowNode, PostNode, PutNode, DeleteNode, SettableAttributeNode, DobeforegetNode, DoaftersetNode } from '../nodes/DataNodes';
import { ConditionNode, CompareNode, LoopNode, VariableNode, ValidateNode, AfterEditNode, TransactionNode } from '../nodes/LogicNodes';

// Маппинг типов узлов на компоненты
const nodeTypesMap = {
  get: GetNode,
  get_row: GetRowNode,
  post: PostNode,
  put: PutNode,
  delete: DeleteNode,
  settableattribute: SettableAttributeNode,
  dobeforeset: DobeforegetNode,
  doafterset: DoaftersetNode,
  condition: ConditionNode,
  compare: CompareNode,
  loop: LoopNode,
  variable: VariableNode,
  validate: ValidateNode,
  afteredit: AfterEditNode,
  transaction: TransactionNode
};

// Стиль маркера для стрелок
const defaultMarker = {
  type: MarkerProp.ArrowClosed,
  width: 20,
  height: 20
};

const FlowCanvas = () => {
  const {
    scenario,
    selectedNode,
    updateScenario,
    setSelectedNode,
    setGeneratedCode
  } = useScenarioStore();

  const [nodes, setNodes, onNodesChange] = useNodesState(scenario.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(scenario.edges);
  const [isLoading, setIsLoading] = useState(false);
  const reactFlowInstance = useReactFlow();

  // Синхронизация store с React Flow
  useEffect(() => {
    setNodes(scenario.nodes);
    setEdges(scenario.edges);
  }, [scenario.nodes, scenario.edges, setNodes, setEdges]);

  // Обработка добавления узла через drag-and-drop
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData('application/reactflow');
      if (!type) return;

      const position = reactFlowInstance.screenToFlowCoordinate({
        x: event.clientX,
        y: event.clientY
      });

      const newNode = {
        id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type,
        position,
        data: {
          label: NODE_DESCRIPTORS[type]?.label || type,
          config: {}
        }
      };

      setNodes((nds) => [...nds, newNode]);

      // Генерируем код после добавления узла
      setTimeout(() => {
        const updatedStore = { ...scenario, nodes: [...scenario.nodes, newNode] };
        updateScenario(updatedStore);
        generatePlPgsqlCode(updatedStore);
      }, 100);
    },
    [reactFlowInstance, scenario, setNodes, updateScenario]
  );

  // Обработка выбора узла
  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node.id);
  }, [setSelectedNode]);

  // Обработка клика на пустое пространство
  const onPaneClick = useCallback(() => {
    setSelectedNode(null);
  }, [setSelectedNode]);

  // Обработка добавления ребра
  const onConnect = useCallback(
    (params) => {
      const newEdge = {
        ...params,
        marker: defaultMarker,
        animated: true,
        style: { strokeWidth: 2 }
      };
      setEdges((eds) => [...eds, newEdge]);

      // Обновляем store
      setTimeout(() => {
        const updatedStore = { ...scenario, edges: [...scenario.edges, newEdge] };
        updateScenario(updatedStore);
        generatePlPgsqlCode(updatedStore);
      }, 100);
    },
    [scenario, setEdges, updateScenario]
  );

  // Удаление ребра по клику
  const handleEdgeClick = useCallback((event, edge) => {
    setEdges((eds) => eds.filter((e) => e.id !== edge.id));
    setTimeout(() => {
      const updatedStore = { ...scenario, edges: scenario.edges.filter((e) => e.id !== edge.id) };
      updateScenario(updatedStore);
      generatePlPgsqlCode(updatedStore);
    }, 100);
  }, [scenario, setEdges, updateScenario]);

  // Удаление выбранного узла клавишей Delete/Backspace
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNode) {
        // Можно добавить обработку удаления через store
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNode]);

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onConnect={onConnect}
        onEdgeClick={handleEdgeClick}
        nodeTypes={nodeTypesMap}
        defaultEdgeOptions={{
          type: 'smoothstep',
          marker: defaultMarker,
          animated: true,
          style: { strokeWidth: 2 }
        }}
        fitView
        fitViewOptions={{ padding: 20 }}
      >
        {/* Controls */}
        <Controls />
        
        {/* MiniMap */}
        <MiniMap
          nodeStrokeColor={(n) => {
            const descriptor = NODE_DESCRIPTORS[n.type];
            return descriptor?.color || '#3498db';
          }}
          nodeFillColor={(n) => {
            const descriptor = NODE_DESCRIPTORS[n.type];
            return descriptor?.color ? descriptor.color + '30' : '#3498db30';
          }}
          maskColor="rgba(255, 255, 255, 0.8)"
          pannable
          zoomable
        />

        {/* Background pattern */}
        <Background color="#aaa" gap={16} spacing={16} />

        {/* Панель информации сверху */}
        <Panel position="top-left">
          <div
            style={{
              background: 'white',
              padding: 8,
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: 12,
              minWidth: 180,
            }}
          >
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>📋 Сценарий: {scenario.name}</div>
            <div style={{ color: '#666' }}>
              Узлов: {scenario.nodes.length} | Рёбер: {scenario.edges.length}
            </div>
          </div>
        </Panel>

        {/* Панель управления снизу */}
        <Panel position="bottom-left">
          <div
            style={{
              background: 'white',
              padding: 8,
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontSize: 11,
            }}
          >
            <div style={{ fontWeight: 500, marginBottom: 4 }}>Управление:</div>
            <div style={{ color: '#666' }}>
              • Drag & Drop из Toolbox<br />
              • Клик по узлу - выбор<br />
              • Scroll - зум<br />
              • Drag canvas - панорама
            </div>
          </div>
        </Panel>

        {/* Индикатор транзакции */}
        {scenario.transactionMode && (
          <Panel position="bottom-right">
            <div
              style={{
                background: '#673AB720',
                border: '1px solid #673AB780',
                padding: '4px 12px',
                borderRadius: 12,
                fontSize: 11,
                color: '#673AB7',
                fontWeight: 500,
              }}
            >
              🔄 Transaction Mode: ON
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};

// ============================================
// Генератор Pl/PgSQL кода
// ============================================

/**
 * Выполняет topological sort графа сценария
 * Возвращает упорядоченный массив узлов
 */
const topologicalSort = (nodes, edges) => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const adjList = new Map();
  const inDegree = new Map();

  // Инициализация
  nodes.forEach(n => {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  // Построение графа
  edges.forEach(e => {
    adjList.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // Алгоритм Каца
  const queue = [];
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) {
      queue.push(n.id);
    }
  });

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);

    adjList.get(current)?.forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) {
        queue.push(neighbor);
      }
    });
  }

  // Если не все узлы в sorted - есть циклы
  if (sorted.length !== nodes.length) {
    console.warn('Циклы в графе сценария!');
    return nodes.map(n => n.id); // Fallback: возвращаем в исходном порядке
  }

  return sorted;
};

/**
 * Генерирует Pl/PgSQL код из визуальной схемы сценария
 */
const generatePlPgsqlCode = (scenarioData) => {
  const { nodes, edges, name, inputs, transactionMode } = scenarioData;
  
  if (!nodes || nodes.length === 0) {
    return `-- Добавьте узлы на canvas для генерации кода\n`;
  }

  // Topological sort
  const sortedNodeIds = topologicalSort(nodes, edges);
  const nodeMap = new Map(sortedNodeIds.map(id => [id, nodes.find(n => n.id === id)]));

  // Сбор всех переменных
  const variables = new Set();
  const transactionBlocks = [];
  let currentTransactionBlock = { savepoints: [], operations: [] };

  // Формирование имени функции
  const functionName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_|_$/g, '');
  const funcName = `scenario_${functionName || 'unnamed'}`;

  // Генерация переменных
  const declaredVars = new Set();
  const varDeclarations = [];

  const addVarDeclaration = (varName, varType) => {
    if (!declaredVars.has(varName)) {
      declaredVars.add(varName);
      varDeclarations.push(`    ${varName} ${varType || 'text'};`);
      variables.add(varName);
    }
  };

  // Входящие параметры
  let inputParams = '';
  if (inputs && inputs.length > 0) {
    inputParams = inputs.map(i => `    ${i.name} ${i.type}`).join(',\n');
  } else {
    inputParams = '    p_input_json jsonb';
  }

  let code = '';

  // Заголовок функции
  code += `-- ============================================\n`;
  code += `-- Сценарий: ${name}\n`;
  code += `-- Сгенерировано визуальным редактором\n`;
  code += `-- ============================================\n\n`;
  code += `CREATE OR REPLACE FUNCTION ${funcName}(\n${inputParams}\n)\n`;
  code += `RETURNS void AS $\n`;
  code += `DECLARE\n`;

  // Обход узлов в топологическом порядке
  let inTransaction = false;
  const transactionStarters = new Set(['transaction']);
  const transactionEnders = new Set(['transaction']);
  const nodeOpGroups = { declarations: [], body: [] };

  sortedNodeIds.forEach(nodeId => {
    const node = nodeMap.get(nodeId);
    if (!node) return;
    
    const config = node.data?.config || {};

    // Генерация переменных из узла
    switch (node.type) {
      case 'get':
      case 'get_row':
        if (config.outputVariable) {
          addVarDeclaration(config.outputVariable, `${config.targetTable || 'target'}%ROWTYPE`);
        }
        break;
      case 'post':
        if (config.outputRecordId) {
          addVarDeclaration(config.outputRecordId, 'INTEGER');
        }
        if (config.outputVariable) {
          addVarDeclaration(config.outputVariable, `${config.targetTable || 'target'}%ROWTYPE`);
        }
        break;
      case 'condition':
      case 'compare':
        const resultVar = config.outputVariable || 'v_compare_result';
        addVarDeclaration(resultVar, 'BOOLEAN');
        break;
      case 'loop':
        addVarDeclaration(config.itemsVariable || 'v_items', 'jsonb');
        addVarDeclaration(config.itemVariable || 'v_item', 'text');
        break;
      case 'variable':
        addVarDeclaration(`v_${config.variableName}`, 'text');
        break;
      case 'transaction':
        // Обработка транзакций
        break;
    }

    // Генерация телa функции
    generateNodeBody(node, config, nodeOpGroups);
  });

  // Добавление переменных в декларацию
  if (varDeclarations.length > 0) {
    code += varDeclarations.join('\n') + '\n';
  }

  // Transaction support
  if (transactionMode) {
    code += `\n    -- Transaction support\n`;
    code += `    v_transaction_active BOOLEAN := false;\n`;
  }

  code += `\nBEGIN\n\n`;

  // Вставка операторов тела
  code += nodeOpGroups.body.join('\n\n');

  // Финальная транзакция
  if (transactionMode) {
    code += `\n-- Сценарий завершён\n`;
  }

  code += `\nEND;\n`;
  code += `$ LANGUAGE plpgsql;\n`;

  return code;
};

/**
 * Генерирует тело оператора для узла
 */
const generateNodeBody = (node, config, opGroups) => {
  const body = opGroups.body;

  switch (node.type) {
    case 'get':
      body.push(`-- GET: ${node.data?.label || node.type}`);
      body.push(`SELECT * INTO ${config.outputVariable || 'v_record'} FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || 'p_input_json->>\'id\''};`);
      body.push(`IF NOT FOUND THEN RAISE EXCEPTION 'Record not found: %', ${config.recordIdSource}; END IF;`);
      break;

    case 'get_row':
      body.push(`-- GET ROW (txn): ${node.data?.label || node.type}`);
      body.push(`SELECT * INTO ${config.outputVariable || 'v_record'} FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || 'p_input_json->>\'id\''}${config.forUpdate ? ' FOR UPDATE' : ''};`);
      break;

    case 'post':
      body.push(`-- POST: ${node.data?.label || node.type}`);
      body.push(`INSERT INTO ${config.targetTable || '<table>'} DEFAULT VALUES RETURNING id INTO ${config.outputRecordId || 'v_id'};`);
      body.push(`PERFORM insertrecord(${config.outputRecordId || 'v_id'}, ${config.inputSource || 'p_input_json'});`);
      if (config.outputVariable) {
        body.push(`SELECT * INTO ${config.outputVariable} FROM ${config.targetTable || '<table>'} WHERE id = ${config.outputRecordId || 'v_id'};`);
      }
      break;

    case 'put':
      body.push(`-- PUT: ${node.data?.label || node.type}`);
      if (config.useOldRecord) {
        body.push(`-- Снятие копии старой записи`);
        body.push(`SELECT * INTO v_old_record FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || 'p_input_json->>\'id\''} FOR UPDATE;`);
      }
      body.push(`PERFORM settableattribute(`);
      body.push(`  ${config.recordIdSource || 'p_input_json->>\'id\''},`);
      body.push(`  attr_name,`);
      body.push(`  ${config.inputSource || 'p_input_json'}->>'attr_value'${config.useOldRecord ? ', v_old_record' : ''}`);
      body.push(`);`);
      break;

    case 'delete':
      body.push(`-- DELETE: ${node.data?.label || node.type}`);
      body.push(`PERFORM delete_record(${config.recordIdSource || 'p_input_json->>\'id\''});`);
      break;

    case 'settableattribute':
      body.push(`-- SETTABLEATTRIBUTE: ${node.data?.label || node.type}`);
      body.push(`-- Автоматически вызывает: dobeforeset -> update -> doafterset`);
      body.push(`PERFORM settableattribute(`);
      body.push(`  ${config.recordIdSource || 'v_record_id'},`);
      body.push(`  '${config.attributeName || '<attr_name>'}',`);
      body.push(`  ${config.newValueSource || '<new_value>'}${config.useOldRecord ? ', v_old_record' : ''}`);
      body.push(`);`);
      break;

    case 'dobeforeset':
      body.push(`-- DOBEFORESET: ${node.data?.label || node.type}`);
      body.push(`PERFORM dobeforeset(`);
      body.push(`  ${config.recordIdSource || 'v_record_id'},`);
      body.push(`  '${config.attributeName || '<attr_name>'}',`);
      body.push(`  ${config.newValueSource || '<new_value>'},`);
      body.push(`  ${config.oldRecordSource || 'v_old_record'}`);
      body.push(`);`);
      break;

    case 'doafterset':
      body.push(`-- DOAFTERSET: ${node.data?.label || node.type}`);
      body.push(`PERFORM doafterset(`);
      body.push(`  ${config.recordIdSource || 'v_record_id'},`);
      body.push(`  '${config.attributeName || '<attr_name>'}',`);
      body.push(`  ${config.oldRecordSource || 'v_old_record'}`);
      body.push(`);`);
      break;

    case 'validate':
      body.push(`-- VALIDATE: ${node.data?.label || node.type}`);
      body.push(`PERFORM validate(${config.recordIdSource || 'v_record_id'});`);
      break;

    case 'afteredit':
      body.push(`-- AFTEREDIT: ${node.data?.label || node.type}`);
      body.push(`PERFORM afterEdit();`);
      break;

    case 'condition':
      const varName = config.outputVariable || 'v_condition_result';
      body.push(`-- CONDITION (IF/ELSE): ${node.data?.label || node.type}`);
      body.push(`${varName} := (${config.leftExpression || 'false'}) ${config.operator || '='} (${config.rightExpression || 'null'});`);
      body.push(`IF ${varName} THEN`);
      break;

    case 'compare':
      const compareVar = 'v_compare_result';
      body.push(`-- COMPARE: ${node.data?.label || node.type}`);
      body.push(`${compareVar} := (${config.leftExpression || 'false'}) ${config.operator || '='} (${config.rightExpression || 'null'});`);
      break;

    case 'loop':
      body.push(`-- LOOP: ${node.data?.label || node.type}`);
      body.push(`-- Источник массива: ${config.arraySource}`);
      body.push(`-- Переменная элемента: ${config.itemVariable}`);
      body.push(`-- Макс. итераций: ${config.iterations}`);
      break;

    case 'variable':
      body.push(`-- VARIABLE: ${node.data?.label || node.type}`);
      body.push(`v_${config.variableName || '<name>'} := ${config.valueSource || 'null'};`);
      break;

    case 'transaction':
      const spName = config.savepointName || 'sp_scenario';
      body.push(`-- TRANSACTION: ${node.data?.label || node.type}`);
      body.push(`IF NOT v_transaction_active THEN`);
      body.push(`  SAVEPOINT ${spName};`);
      body.push(`  v_transaction_active := true;`);
      body.push(`END IF;`);
      break;

    default:
      body.push(`-- Узел типа '${node.type}': конфигурация отсутствует`);
      break;
  }
};

export default FlowCanvas;