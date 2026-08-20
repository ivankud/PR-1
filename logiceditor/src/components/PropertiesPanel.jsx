import { NODE_TYPES, NODE_DESCRIPTORS, NODE_DEFAULT_CONFIGS } from '../store/scenarioStore';

const configFields = {
  get: [
    { key: 'targetTable', label: 'Таблица', type: 'text' },
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'outputVariable', label: 'Переменная вывода', type: 'text' }
  ],
  get_row: [
    { key: 'targetTable', label: 'Таблица', type: 'text' },
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'outputVariable', label: 'Переменная вывода', type: 'text' },
    { key: 'forUpdate', label: 'FOR UPDATE', type: 'boolean' }
  ],
  post: [
    { key: 'targetTable', label: 'Таблица', type: 'text' },
    { key: 'inputSource', label: 'Источник ввода', type: 'text' },
    { key: 'outputVariable', label: 'Переменная вывода', type: 'text' },
    { key: 'outputRecordId', label: 'ID переменная', type: 'text' }
  ],
  put: [
    { key: 'targetTable', label: 'Таблица', type: 'text' },
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'inputSource', label: 'Источник ввода', type: 'text' },
    { key: 'useOldRecord', label: 'Использовать old_record', type: 'boolean' }
  ],
  delete: [
    { key: 'targetTable', label: 'Таблица', type: 'text' },
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' }
  ],
  settableattribute: [
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'attributeName', label: 'Имя атрибута', type: 'text' },
    { key: 'newValueSource', label: 'Новое значение', type: 'text' },
    { key: 'useOldRecord', label: 'Использовать old_record', type: 'boolean' }
  ],
  dobeforeset: [
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'attributeName', label: 'Имя атрибута', type: 'text' },
    { key: 'newValueSource', label: 'Новое значение', type: 'text' },
    { key: 'oldRecordSource', label: 'Старая запись', type: 'text' }
  ],
  doafterset: [
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' },
    { key: 'attributeName', label: 'Имя атрибута', type: 'text' },
    { key: 'oldRecordSource', label: 'Старая запись', type: 'text' }
  ],
  validate: [
    { key: 'recordIdSource', label: 'Record ID источник', type: 'text' }
  ],
  condition: [
    { key: 'leftExpression', label: 'Левое выражение', type: 'text' },
    { key: 'operator', label: 'Оператор', type: 'select', options: ['=', '!=', '<', '>', '<=', '>=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'IS', 'IS NOT', 'BETWEEN'] },
    { key: 'rightExpression', label: 'Правое выражение', type: 'text' },
    { key: 'outputVariable', label: 'Переменная результата', type: 'text' }
  ],
  compare: [
    { key: 'leftExpression', label: 'Левое выражение', type: 'text' },
    { key: 'operator', label: 'Оператор', type: 'select', options: ['=', '!=', '<', '>', '<=', '>=', 'IN', 'NOT IN', 'LIKE', 'NOT LIKE', 'IS', 'IS NOT', 'BETWEEN'] },
    { key: 'rightExpression', label: 'Правое выражение', type: 'text' }
  ],
  loop: [
    { key: 'arraySource', label: 'Источник массива', type: 'text' },
    { key: 'itemVariable', label: 'Переменная элемента', type: 'text' },
    { key: 'itemsVariable', label: 'Переменная коллекции', type: 'text' },
    { key: 'iterations', label: 'Макс. итерации', type: 'number' }
  ],
  variable: [
    { key: 'variableName', label: 'Имя переменной', type: 'text' },
    { key: 'valueSource', label: 'Источник значения', type: 'text' }
  ],
  transaction: [
    { key: 'savepointName', label: 'Имя savepoint', type: 'text' }
  ]
};

const PropertiesPanel = ({ selectedNode, onUpdateConfig, onRemoveNode }) => {
  if (!selectedNode) {
    return (
      <div
        style={{
          width: 280,
          height: '100vh',
          background: '#f8f9fa',
          borderLeft: '1px solid #dee2e6',
          overflowY: 'auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ textAlign: 'center', color: '#999' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
          <div>Выберите узел для<br/>редактирования свойств</div>
        </div>
      </div>
    );
  }

  const nodeConfig = configFields[selectedNode.type] || [];
  const descriptor = NODE_DESCRIPTORS[selectedNode.type];
  const config = selectedNode.data?.config || {};

  const handleChange = (key, value) => {
    onUpdateConfig(selectedNode.id, { [key]: value });
  };

  return (
    <div
      style={{
        width: 280,
        height: '100vh',
        background: '#f8f9fa',
        borderLeft: '1px solid #dee2e6',
        overflowY: 'auto',
        fontFamily: 'sans-serif',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          padding: '16px 12px',
          background: descriptor?.color || '#3498db',
          color: 'white',
          fontSize: 13,
          fontWeight: 'bold',
        }}
      >
        <span style={{ marginRight: 8 }}>{descriptor?.icon}</span>
        Свойства узла
      </div>

      {/* Информация */}
      <div style={{ padding: 12, borderBottom: '1px solid #e9ecef' }}>
        <div style={{ fontSize: 11, color: '#666', marginBottom: 4 }}>
          <strong>Тип:</strong> {selectedNode.type}
        </div>
        <div style={{ fontSize: 11, color: '#666' }}>
          <strong>ID:</strong> {selectedNode.id}
        </div>
      </div>

      {/* Поля конфигурации */}
      <div style={{ padding: 12 }}>
        {nodeConfig.length === 0 ? (
          <div style={{ fontSize: 12, color: '#888', fontStyle: 'italic' }}>
            Нет параметров конфигурации
          </div>
        ) : (
          nodeConfig.map((field) => (
            <div key={field.key} style={{ marginBottom: 12 }}>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#495057', marginBottom: 4 }}>
                {field.label}
              </label>
              {field.type === 'boolean' ? (
                <select
                  value={config[field.key] ? 'true' : 'false'}
                  onChange={(e) => handleChange(field.key, e.target.value === 'true')}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: 6,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #ced4da',
                    background: 'white',
                  }}
                >
                  <option value="true">Да</option>
                  <option value="false">Нет</option>
                </select>
              ) : field.type === 'select' ? (
                <select
                  value={config[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: 6,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #ced4da',
                    background: 'white',
                  }}
                >
                  <option value="">-- Выбрать --</option>
                  {field.options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              ) : field.type === 'number' ? (
                <input
                  type="number"
                  value={config[field.key] || ''}
                  onChange={(e) => handleChange(field.key, parseInt(e.target.value) || 0)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  style={{
                    width: '100%',
                    padding: 6,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #ced4da',
                    background: 'white',
                  }}
                />
              ) : (
                <input
                  type="text"
                  value={config[field.key] || ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  placeholder={`Введите ${field.label.toLowerCase()}`}
                  style={{
                    width: '100%',
                    padding: 6,
                    fontSize: 12,
                    borderRadius: 4,
                    border: '1px solid #ced4da',
                    background: 'white',
                    boxSizing: 'border-box',
                  }}
                />
              )}
            </div>
          ))
        )}
      </div>

      {/* Кнопка удаления */}
      <div style={{ padding: 12, borderTop: '1px solid #e9ecef' }}>
        <button
          onClick={() => onRemoveNode(selectedNode.id)}
          style={{
            width: '100%',
            padding: 8,
            fontSize: 12,
            fontWeight: 500,
            color: 'white',
            background: '#e74c3c',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer',
          }}
          onMouseEnter={(e) => (e.target.style.background = '#c0392b')}
          onMouseLeave={(e) => (e.target.style.background = '#e74c3c')}
        >
          🗑️ Удалить узел
        </button>
      </div>

      {/* Генерация кода для узла */}
      <div style={{ padding: 12, borderTop: '1px solid #e9ecef' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: '#495057', marginBottom: 8 }}>
          Генерация кода Pl/PgSQL
        </div>
        <PreviewsCode code={generateNodeCode(selectedNode)} />
      </div>
    </div>
  );
};

// Вспомогательная компонента для отображения кода
const PreviewsCode = ({ code }) => (
  <pre
    style={{
      fontSize: 10,
      background: '#2c3e50',
      color: '#ecf0f1',
      padding: 8,
      borderRadius: 4,
      overflow: 'auto',
      fontFamily: 'monospace',
      whiteSpace: 'pre-wrap',
      margin: 0,
    }}
  >
    {code}
  </pre>
);

// Генерация превью кода для узла
const generateNodeCode = (node) => {
  const config = node.data?.config || {};

  switch (node.type) {
    case 'get':
      return `SELECT * INTO <var>${config.outputVariable || 'v_record'}</var> FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || '<id>'};`;

    case 'get_row':
      return `SELECT * INTO <var>${config.outputVariable || 'v_record'}</var> FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || '<id>'}${config.forUpdate ? ' FOR UPDATE' : ''};`;

    case 'post':
      return `INSERT INTO ${config.targetTable || '<table>'} DEFAULT VALUES RETURNING id INTO <var>${config.outputRecordId || 'v_id'}</var>;\nPERFORM insertrecord(<var>${config.outputRecordId || 'v_id'}</var>, ${config.inputSource || 'p_input_json'});`;

    case 'put':
      return `${config.useOldRecord ? `SELECT * INTO <var>v_old</var> FROM ${config.targetTable || '<table>'} WHERE id = ${config.recordIdSource || '<id>'} FOR UPDATE;\n` : ''}PERFORM settableattribute(${config.recordIdSource || '<id>'}, attr, ${config.inputSource || 'p_input_json'}->'attr', ${config.useOldRecord ? 'v_old' : 'NULL'});`;

    case 'delete':
      return `PERFORM delete_record(${config.recordIdSource || '<id>'});`;

    case 'settableattribute':
      return `PERFORM settableattribute(\n  ${config.recordIdSource || '<id>'},\n  '${config.attributeName || '<attr>'}',\n  ${config.newValueSource || '<value>'}${config.useOldRecord ? ', v_old' : ''}\n);`;

    case 'dobeforeset':
      return `PERFORM dobeforeset(\n  ${config.recordIdSource || '<id>'},\n  '${config.attributeName || '<attr>'}',\n  ${config.newValueSource || '<value>'},\n  ${config.oldRecordSource || 'v_old'}\n);`;

    case 'doafterset':
      return `PERFORM doafterset(\n  ${config.recordIdSource || '<id>'},\n  '${config.attributeName || '<attr>'}',\n  ${config.oldRecordSource || 'v_old'}\n);`;

    case 'validate':
      return `PERFORM validate(${config.recordIdSource || '<id>'});`;

    case 'afteredit':
      return `PERFORM afterEdit();`;

    case 'condition':
      return `IF ${config.leftExpression || '<left>'} ${config.operator || '='} ${config.rightExpression || '<right>'} THEN\n  -- true branch\nELSE\n  -- false branch\nEND IF;`;

    case 'compare':
      return `<var>v_result</var> := (${config.leftExpression || '<left>'}) ${config.operator || '='} (${config.rightExpression || '<right>'});`;

    case 'loop':
      return `FOREACH <var>${config.itemVariable || 'item'}</var> IN ARRAY ${config.arraySource || '<array>'}\nLOOP\n  -- body\nEND LOOP;`;

    case 'variable':
      return `<var>v_${config.variableName || '<name>'}</var> := ${config.valueSource || '<value>'};`;

    case 'transaction':
      return `SAVEPOINT ${config.savepointName || 'sp_default'};\n-- operations\nRELEASE SAVEPOINT ${config.savepointName || 'sp_default'};`;

    default:
      return '-- Код не сгенерирован';
  }
};

export default PropertiesPanel;