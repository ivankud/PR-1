import { useState, useEffect } from 'react';
import { useScenarioStore, NODE_DESCRIPTORS } from '../store/scenarioStore';

/**
 * Панель предпросмотра сгенерированного Pl/PgSQL кода
 */
const CodePreview = () => {
  const { scenario, setGeneratedCode, generatedCode } = useScenarioStore();
  const [code, setCode] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Генерация кода при изменении сценария
  useEffect(() => {
    if (isGenerating) return;
    
    const timer = setTimeout(() => {
      const generated = generateFullCode(scenario);
      setCode(generated);
      setGeneratedCode(generated);
    }, 300);

    return () => clearTimeout(timer);
  }, [scenario, setGeneratedCode]);

  // Копирование кода в буфер
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Скачивание SQL файла
  const handleDownload = () => {
    const functionName = scenario.name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_|_$/g, '');
    const funcName = `scenario_${functionName || 'unnamed'}`;
    const blob = new Blob([code], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${funcName}.sql`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Экспорт сценария в JSON
  const handleExportJson = () => {
    const json = JSON.stringify(scenario, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name || 'scenario'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Валидация сценария
  const validation = validateScenario(scenario);

  return (
    <div
      style={{
        width: 360,
        height: '100vh',
        background: '#1e1e1e',
        borderLeft: '1px solid #333',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'monospace',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          padding: '12px 16px',
          background: '#2d2d2d',
          color: '#4ec9b0',
          fontSize: 13,
          fontWeight: 'bold',
          borderBottom: '1px solid #333',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span>📜</span> Pl/PgSQL Код
      </div>

      {/* Панель инструментов */}
      <div
        style={{
          padding: 8,
          background: '#252526',
          borderBottom: '1px solid #333',
          display: 'flex',
          gap: 4,
        }}
      >
        <button
          onClick={handleCopy}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 11,
            background: '#0e639c',
            color: 'white',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#1177bb')}
          onMouseLeave={(e) => (e.target.style.background = '#0e639c')}
        >
          📋 Копировать
        </button>
        <button
          onClick={handleDownload}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 11,
            background: '#16825d',
            color: 'white',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#1a9870')}
          onMouseLeave={(e) => (e.target.style.background = '#16825d')}
        >
          💾 SQL
        </button>
        <button
          onClick={handleExportJson}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: 11,
            background: '#7c4deg',
            color: 'white',
            border: 'none',
            borderRadius: 3,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#8d5b9e')}
          onMouseLeave={(e) => (e.target.style.background = '#6f3c7e')}
        >
          📦 JSON
        </button>
      </div>

      {/* Валидация */}
      <div style={{ padding: '8px 12px', borderBottom: '1px solid #333' }}>
        {validation.valid ? (
          <div style={{ fontSize: 11, color: '#4ec9b0' }}>
            ✅ Валидация пройдена ({scenario.nodes.length} узлов)
          </div>
        ) : (
          <div style={{ fontSize: 11 }}>
            <div style={{ color: '#f44747', marginBottom: 4 }}>⚠️ Проблемы:</div>
            {validation.errors.map((err, i) => (
              <div key={i} style={{ color: '#ce9178', fontSize: 10 }}>• {err}</div>
            ))}
          </div>
        )}
      </div>

      {/* Код */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        <pre
          style={{
            fontSize: 11,
            lineHeight: 1.5,
            margin: 0,
            whiteSpace: 'pre',
            color: '#d4d4d4',
          }}
        >
          {syntaxHighlight(code)}
        </pre>
      </div>

      {/* Статус внизу */}
      <div
        style={{
          padding: '6px 12px',
          background: '#2d2d2d',
          borderTop: '1px solid #333',
          fontSize: 10,
          color: '#858585',
          display: 'flex',
          justifyContent: 'space-between',
        }}
      >
        <span>Pl/PgSQL</span>
        <span>{code.split('\n').length} строк</span>
      </div>
    </div>
  );
};

// ============================================
// Синтаксическая подсветка Pl/PgSQL
// ============================================

const keywords = [
  'CREATE', 'OR', 'REPLACE', 'FUNCTION', 'RETURNS', 'VOID', 'AS', 'DECLARE',
  'BEGIN', 'END', 'LANGUAGE', 'PLPGSQL', 'SELECT', 'INTO', 'FROM', 'WHERE',
  'INSERT', 'UPDATE', 'DELETE', 'SET', 'DEFAULT', 'VALUES', 'RETURNING',
  'PERFORM', 'IF', 'THEN', 'ELSE', 'ELSIF', 'END IF', 'WHILE', 'LOOP',
  'END LOOP', 'FOREACH', 'IN', 'ARRAY', 'RAISE', 'EXCEPTION', 'NOT FOUND',
  'SAVEPOINT', 'RELEASE', 'ROLLBACK', 'COMMIT', 'DELETE', 'PUT', 'GET',
  'BOOLEAN', 'INTEGER', 'TEXT', 'JSONB', 'VARCHAR', 'TIMESTAMP', 'ROWTYPE',
  'FOR UPDATE', 'NULL', 'TRUE', 'FALSE', 'AND', 'OR', 'NOT', 'IS',
  'DOBEFORESET', 'DOAFTERSET', 'INSERTRECORD', 'SETTABLEATTRIBUTE',
  'VALIDATE', 'AFTEREDIT', 'GETROW'
];

const sqlKeywords = ['SELECT', 'INTO', 'FROM', 'WHERE', 'INSERT', 'DELETE', 'UPDATE', 'SET', 'VALUES', 'RETURNING', 'PERFORM'];

// Функция генерации полного кода (дублирует из FlowCanvas)
const generateFullCode = (scenarioData) => {
  const { nodes, edges, name, inputs, transactionMode } = scenarioData;
  
  if (!nodes || nodes.length === 0) {
    return '-- Добавьте узлы на canvas для генерации кода\n';
  }

  // Topological sort
  const sortedNodeIds = topologicalSort(nodes, edges);

  // Формирование имени функции
  const functionName = name.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/^_|_$/g, '');
  const funcName = `scenario_${functionName || 'unnamed'}`;

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

  // Переменные
  code += `\n    -- Transaction support\n`;
  code += `    v_transaction_active BOOLEAN := false;\n`;

  code += `\nBEGIN\n\n`;

  // Генерация операторов
  sortedNodeIds.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    const config = node.data?.config || {};
    
    switch (node.type) {
      case 'get':
        code += `-- GET: ${node.data?.label}\n`;
        code += `SELECT * INTO ${config.outputVariable || 'v_record'} FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || '<id>'};\n\n`;
        break;
      case 'afteredit':
        code += `-- AFTEREDIT\n`;
        code += `PERFORM afterEdit();\n\n`;
        break;
    }
  });

  code += `\nEND;\n`;
  code += `$ LANGUAGE plpgsql;\n`;

  return code;
};

// Topological sort
const topologicalSort = (nodes, edges) => {
  const adjList = new Map();
  const inDegree = new Map();

  nodes.forEach(n => {
    adjList.set(n.id, []);
    inDegree.set(n.id, 0);
  });

  edges.forEach(e => {
    adjList.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  const queue = [];
  nodes.forEach(n => {
    if (inDegree.get(n.id) === 0) queue.push(n.id);
  });

  const sorted = [];
  while (queue.length > 0) {
    const current = queue.shift();
    sorted.push(current);
    adjList.get(current)?.forEach(neighbor => {
      inDegree.set(neighbor, inDegree.get(neighbor) - 1);
      if (inDegree.get(neighbor) === 0) queue.push(neighbor);
    });
  }

  return sorted.length !== nodes.length ? nodes.map(n => n.id) : sorted;
};

const syntaxHighlight = (code) => {
  if (!code) return '';

  return code.split('\n').map((line, lineIdx) => {
    // Комментарии
    if (line.trim().startsWith('--')) {
      return (
        <div key={lineIdx} style={{ whiteSpace: 'pre' }}>
          <span style={{ color: '#6a9955' }}>{line}</span>
        </div>
      );
    }

    let result = '';
    let remaining = line;

    // Простой парсер для подсветки
    while (remaining.length > 0) {
      // Строковые литералы
      if (remaining.startsWith("'")) {
        const endIdx = remaining.indexOf("'", 1);
        if (endIdx > 0) {
          result += `<span style="color: #ce9178">${remaining.substring(0, endIdx + 1)}</span>`;
          remaining = remaining.substring(endIdx + 1);
          continue;
        }
      }

      // Ключевые слова (uppercase)
      const wordMatch = remaining.match(/^([A-Z_]+)/);
      if (wordMatch && wordMatch[1].length > 2) {
        const word = wordMatch[1];
        if (keywords.includes(word)) {
          result += `<span style="color: #569cd6">${word}</span>`;
          remaining = remaining.substring(word.length);
          continue;
        }
      }

      // Переменные (начинаются с v_)
      const varMatch = remaining.match(/^(v_[a-zA-Z0-9_]*)/);
      if (varMatch) {
        result += `<span style="color: #4fc1fa">${varMatch[1]}</span>`;
        remaining = remaining.substring(varMatch[1].length);
        continue;
      }

      // Обычный символ
      result += `<span>${remaining[0]}</span>`;
      remaining = remaining.substring(1);
    }

    return <div key={lineIdx} style={{ whiteSpace: 'pre' }} dangerouslySetInnerHTML={{ __html: result || ' ' }} />;
  });
};

// ============================================
// Валидация сценария
// ============================================

const validateScenario = (scenario) => {
  const errors = [];
  const { nodes, edges } = scenario;

  // Проверка на пустой сценарий
  if (!nodes || nodes.length === 0) {
    errors.push('Сценарий пуст. Добавьте узлы.');
    return { valid: false, errors };
  }

  // Проверка на узел afterEdit
  const afterEditNodes = nodes.filter(n => n.type === 'afteredit');
  if (afterEditNodes.length === 0) {
    errors.push('Отсутствует узел AFTEREDIT');
  } else if (afterEditNodes.length > 1) {
    errors.push('Дублирование узла AFTEREDIT');
  }

  // Проверка на стартовый узел (без входящих ребер)
  const targetNodeIds = new Set(edges.map(e => e.target));
  const startNodes = nodes.filter(n => !targetNodeIds.has(n.id));
  if (startNodes.length === 0) {
    errors.push('Нет стартового узла');
  }

  // Проверка на циклы (простая)
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  const visited = new Set();
  const inStack = new Set();

  const hasCycle = (nodeId) => {
    if (inStack.has(nodeId)) return true;
    if (visited.has(nodeId)) return false;

    inStack.add(nodeId);
    visited.add(nodeId);

    const outgoing = edges.filter(e => e.source === nodeId);
    for (const edge of outgoing) {
      if (hasCycle(edge.target)) return true;
    }

    inStack.delete(nodeId);
    return false;
  };

  for (const node of startNodes) {
    if (hasCycle(node.id)) {
      errors.push('Обнаружен цикл в графе');
      break;
    }
  }

  // Проверка связанных узлов
  const connectedNodes = new Set();
  edges.forEach(e => {
    connectedNodes.add(e.source);
    connectedNodes.add(e.target);
  });

  const isolatedNodes = nodes.filter(n => !connectedNodes.has(n.id) && n.type !== 'afteredit');
  if (isolatedNodes.length > 0 && nodes.length > 1) {
    errors.push(`${isolatedNodes.length} изолированных узлов`);
  }

  // Проверка конфигурации узлов
  nodes.forEach(node => {
    const config = node.data?.config || {};

    switch (node.type) {
      case 'get':
      case 'get_row':
        if (!config.targetTable) errors.push(`Узел "${node.data?.label}" не указана таблица`);
        if (!config.recordIdSource) errors.push(`Узел "${node.data?.label}" нет Record ID источник`);
        break;
      case 'post':
        if (!config.targetTable) errors.push(`POST узел не указана таблица`);
        break;
      case 'put':
        if (!config.targetTable) errors.push(`PUT узел: нет таблицы`);
        if (!config.recordIdSource) errors.push(`PUT узел: нет Record ID источник`);
        break;
      case 'settableattribute':
        if (!config.attributeName) errors.push(`SETATTR: нет имя атрибута`);
        break;
    }
  });

  return { valid: errors.length === 0, errors };
};

export default CodePreview;