import { NODE_DESCRIPTORS, NODE_TYPES } from '../store/scenarioStore';

const Toolbox = ({ onNodeAdd }) => {
  // Группировка узлов по категориям
  const categories = {
    'Операции с данными': [
      NODE_TYPES.GET,
      NODE_TYPES.GET_ROW,
      NODE_TYPES.POST,
      NODE_TYPES.PUT,
      NODE_TYPES.DELETE
    ],
    'Методы атрибутов': [
      NODE_TYPES.SETTABLEATTRIBUTE,
      NODE_TYPES.DOBEFORESET,
      NODE_TYPES.DOAFTERSET
    ],
    'Логика': [
      NODE_TYPES.CONDITION,
      NODE_TYPES.COMPARE,
      NODE_TYPES.LOOP
    ],
    'Утилиты': [
      NODE_TYPES.VARIABLE,
      NODE_TYPES.VALIDATE,
      NODE_TYPES.AFTEREDIT,
      NODE_TYPES.TRANSACTION
    ]
  };

  const handleDragStart = (e, type) => {
    e.dataTransfer.setData('application/reactflow', type);
    e.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div
      style={{
        width: 240,
        height: '100vh',
        background: '#f8f9fa',
        borderRight: '1px solid #dee2e6',
        overflowY: 'auto',
        padding: 0,
        fontFamily: 'sans-serif',
      }}
    >
      {/* Заголовок */}
      <div
        style={{
          padding: '16px 12px',
          background: '#2c3e50',
          color: 'white',
          fontSize: 14,
          fontWeight: 'bold',
          letterSpacing: 0.5,
        }}
      >
        🔧 toolbox (Сценарный Редактор)
      </div>

      {/* Категории узлов */}
      {Object.entries(categories).map(([category, types]) => (
        <div key={category}>
          {/* Заголовок категории */}
          <div
            style={{
              padding: '10px 12px 6px',
              fontSize: 11,
              fontWeight: 600,
              color: '#6c757d',
              textTransform: 'uppercase',
              letterSpacing: 1,
              borderBottom: '1px solid #e9ecef',
            }}
          >
            {category}
          </div>

          {/* Узлы в категории */}
          {types.map((type) => {
            const desc = NODE_DESCRIPTORS[type];
            if (!desc) return null;

            return (
              <div
                key={type}
                draggable
                onDragStart={(e) => handleDragStart(e, type)}
                onClick={() => onNodeAdd(type)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  margin: '2px 6px',
                  cursor: 'grab',
                  borderRadius: 6,
                  background: 'white',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = desc.color;
                  e.currentTarget.style.boxShadow = `0 2px 8px ${desc.color}30`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e9ecef';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <span style={{ fontSize: 18 }}>{desc.icon}</span>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: '#333' }}>
                    {desc.label}
                  </div>
                  <div style={{ fontSize: 9, color: '#888', marginTop: 2 }}>
                    {desc.description}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ))}

      {/* Подсказка внизу */}
      <div
        style={{
          padding: '12px',
          marginTop: 8,
          borderTop: '1px solid #e9ecef',
          fontSize: 10,
          color: '#999',
          textAlign: 'center',
        }}
      >
        Перетащите узел на canvas<br />
        или нажмите для добавления
      </div>
    </div>
  );
};

export default Toolbox;