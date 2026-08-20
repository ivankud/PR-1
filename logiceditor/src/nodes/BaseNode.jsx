import { memo } from 'react';
import { Handle, Position, useUpdateNodeType } from '@xyflow/react';

const baseStyle = {
  padding: '10px',
  borderRadius: '8px',
  width: 220,
  fontSize: 12,
  transition: 'box-shadow 0.2s',
};

const handleStyle = {
  width: 12,
  height: 12,
};

export const createNodeComponent = (type, config) => {
  const { label, icon, color, inputHandles = [], outputHandles = ['default'] } = config;

  return memo(function CustomNode({ data, selected }) {
    const updateNodeData = useUpdateNodeType();

    const handleChangeLabel = (e) => {
      e.stopPropagation();
      updateNodeData({ label: e.target.value });
    };

    return (
      <div
        style={{
          ...baseStyle,
          background: `linear-gradient(135deg, ${color}20, ${color}10)`,
          border: `2px solid ${selected ? color : color}80`,
          boxShadow: selected ? `0 0 0 3px ${color}40` : '0 2px 4px rgba(0,0,0,0.1)',
        }}
      >
        {/* Заголовок узла */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            paddingBottom: '8px',
            borderBottom: `1px solid ${color}40`,
            marginBottom: '8px',
          }}
        >
          <span style={{ fontSize: 18 }}>{icon}</span>
          <input
            value={label}
            onChange={handleChangeLabel}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#333',
              fontWeight: 600,
              fontSize: 13,
              width: '100%',
              outline: 'none',
            }}
          />
        </div>

        {/* Конфигурация узла */}
        <div style={{ fontSize: 11, color: '#555' }}>
          {type === 'get' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Таблица:</strong> {data.config?.targetTable || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>ID источник:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div>
                <strong>Переменная:</strong> {data.config?.outputVariable || '-'}
              </div>
            </>
          )}

          {type === 'get_row' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Таблица:</strong> {data.config?.targetTable || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>ID источник:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div>
                <strong>FOR UPDATE:</strong> {data.config?.forUpdate ? 'Да' : 'Нет'}
              </div>
            </>
          )}

          {type === 'post' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Таблица:</strong> {data.config?.targetTable || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Вход:</strong> {data.config?.inputSource || 'p_input_json'}
              </div>
              <div>
                <strong>Переменная:</strong> {data.config?.outputVariable || '-'}
              </div>
            </>
          )}

          {type === 'put' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Таблица:</strong> {data.config?.targetTable || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>ID источник:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div>
                <strong>OLD RECORD:</strong> {data.config?.useOldRecord ? 'Да' : 'Нет'}
              </div>
            </>
          )}

          {type === 'delete' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Таблица:</strong> {data.config?.targetTable || '-'}
              </div>
              <div>
                <strong>ID источник:</strong> {data.config?.recordIdSource || '-'}
              </div>
            </>
          )}

          {type === 'settableattribute' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Record ID:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Атрибут:</strong> {data.config?.attributeName || '-'}
              </div>
              <div>
                <strong>New Value:</strong> {data.config?.newValueSource || '-'}
              </div>
            </>
          )}

          {type === 'dobeforeset' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Record ID:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Атрибут:</strong> {data.config?.attributeName || '-'}
              </div>
              <div>
                <strong>Old Rec:</strong> {data.config?.oldRecordSource || '-'}
              </div>
            </>
          )}

          {type === 'doafterset' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Record ID:</strong> {data.config?.recordIdSource || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Атрибут:</strong> {data.config?.attributeName || '-'}
              </div>
              <div>
                <strong>Old Rec:</strong> {data.config?.oldRecordSource || '-'}
              </div>
            </>
          )}

          {type === 'validate' && (
            <div>
              <strong>Record ID:</strong> {data.config?.recordIdSource || '-'}
            </div>
          )}

          {type === 'afteredit' && (
            <div style={{ color: '#795548', fontStyle: 'italic' }}>
              Вызывает afterEdit()
            </div>
          )}

          {type === 'condition' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Левое:</strong> {data.config?.leftExpression || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Оператор:</strong> {data.config?.operator || '='}
              </div>
              <div>
                <strong>Правое:</strong> {data.config?.rightExpression || '-'}
              </div>
            </>
          )}

          {type === 'compare' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Левое:</strong> {data.config?.leftExpression || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Оператор:</strong> {data.config?.operator || '='}
              </div>
              <div>
                <strong>Правое:</strong> {data.config?.rightExpression || '-'}
              </div>
            </>
          )}

          {type === 'loop' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Массив:</strong> {data.config?.arraySource || '-'}
              </div>
              <div style={{ marginBottom: 4 }}>
                <strong>Элемент:</strong> {data.config?.itemVariable || 'item'}
              </div>
              <div>
                <strong>Итерации:</strong> {data.config?.iterations || 100}
              </div>
            </>
          )}

          {type === 'variable' && (
            <>
              <div style={{ marginBottom: 4 }}>
                <strong>Имя:</strong> {data.config?.variableName || '-'}
              </div>
              <div>
                <strong>Значение:</strong> {data.config?.valueSource || '-'}
              </div>
            </>
          )}

          {type === 'transaction' && (
            <div>
              <strong>Savepoint:</strong>{' '}
              {data.config?.savepointName || 'sp_default'}
            </div>
          )}

          {!['get', 'get_row', 'post', 'put', 'delete', 'settableattribute',
            'dobeforeset', 'doafterset', 'validate', 'condition', 'compare',
            'loop', 'variable', 'transaction'].includes(type) && (
            <div>Конфигурация отсутствует</div>
          )}
        </div>

        {/* Входящие ручки */}
        {inputHandles.map((handle) => (
          <Handle
            key={handle}
            id={handle}
            type="target"
            position={Position.Left}
            style={{ ...handleStyle, background: color }}
          />
        ))}

        {/* Исходящие ручки */}
        {outputHandles.map((handle) => (
          <Handle
            key={handle}
            id={handle}
            type="source"
            position={Position.Right}
            style={{ ...handleStyle, background: color }}
          />
        ))}

        {/* Дополнительные выходы для IF/ELSE */}
        {type === 'condition' && (
          <>
            <Handle
              id="branch_true"
              type="source"
              position={Position.Right}
              top="70%"
              style={{ background: '#4CAF50', width: 12, height: 12 }}
            />
            <div
              style={{
                position: 'absolute',
                right: -60,
                top: '65%',
                fontSize: 10,
                color: '#4CAF50',
                fontWeight: 'bold',
              }}
            >
              TRUE
            </div>
            <Handle
              id="branch_false"
              type="source"
              position={Position.Right}
              top="85%"
              style={{ background: '#F44336', width: 12, height: 12 }}
            />
            <div
              style={{
                position: 'absolute',
                right: -65,
                top: '80%',
                fontSize: 10,
                color: '#F44336',
                fontWeight: 'bold',
              }}
            >
              FALSE
            </div>
          </>
        )}
      </div>
    );
  });
};