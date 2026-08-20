import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Начальные начальные IDs
let nodeIdCounter = 0;
let edgeIdCounter = 0;

const generateNodeId = () => `node_${++nodeIdCounter}_${Date.now()}`;
const generateEdgeId = () => `edge_${++edgeIdCounter}_${Date.now()}`;

// Типы узлов
export const NODE_TYPES = {
  GET: 'get',
  GET_ROW: 'get_row',
  POST: 'post',
  PUT: 'put',
  DELETE: 'delete',
  SETTABLEATTRIBUTE: 'settableattribute',
  DOBEFORESET: 'dobeforeset',
  DOAFTERSET: 'doafterset',
  VALIDATE: 'validate',
  AFTEREDIT: 'afteredit',
  CONDITION: 'condition',
  LOOP: 'loop',
  VARIABLE: 'variable',
  COMPARE: 'compare',
  TRANSACTION: 'transaction'
};

// Описания узлов для панели инструментов
export const NODE_DESCRIPTORS = {
  [NODE_TYPES.GET]: {
    label: 'GET Record',
    icon: '📥',
    color: '#4CAF50',
    description: 'Получить запись по ID'
  },
  [NODE_TYPES.GET_ROW]: {
    label: 'GET ROW (txn)',
    icon: '📋',
    color: '#2196F3',
    description: 'Получить строку в транзакции'
  },
  [NODE_TYPES.POST]: {
    label: 'POST New Record',
    icon: '➕',
    color: '#FF9800',
    description: 'Создать новую запись через insertrecord'
  },
  [NODE_TYPES.PUT]: {
    label: 'PUT Update Record',
    icon: '✏️',
    color: '#9C27B0',
    description: 'Обновить запись с settableattribute'
  },
  [NODE_TYPES.DELETE]: {
    label: 'DELETE Record',
    icon: '🗑️',
    color: '#F44336',
    description: 'Удалить запись по ID'
  },
  [NODE_TYPES.SETTABLEATTRIBUTE]: {
    label: 'Set Table Attribute',
    icon: '🔧',
    color: '#00BCD4',
    description: 'Установить атрибут (dobeforeset + update + doafterset)'
  },
  [NODE_TYPES.DOBEFORESET]: {
    label: 'DO BEFORE SET',
    icon: '⏮️',
    color: '#795548',
    description: 'Вызвать dobeforeset(record_id, attr, new_value, old_record)'
  },
  [NODE_TYPES.DOAFTERSET]: {
    label: 'DO AFTER SET',
    icon: '⏭️',
    color: '#607D8B',
    description: 'Вызвать doafterset(record_id, attr, old_record)'
  },
  [NODE_TYPES.VALIDATE]: {
    label: 'VALIDATE',
    icon: '✅',
    color: '#8BC34A',
    description: 'Валидация записи validate(record_id)'
  },
  [NODE_TYPES.AFTEREDIT]: {
    label: 'AFTER EDIT',
    icon: '🏁',
    color: '#FFEB3B',
    description: 'Финальная обработка afterEdit()'
  },
  [NODE_TYPES.CONDITION]: {
    label: 'IF/ELSE Condition',
    icon: '🔀',
    color: '#E91E63',
    description: 'Условная логика с двумя выходами'
  },
  [NODE_TYPES.COMPARE]: {
    label: 'COMPARE Values',
    icon: '⚖️',
    color: '#3F51B5',
    description: 'Сравнение значений условий'
  },
  [NODE_TYPES.LOOP]: {
    label: 'LOOP Array',
    icon: '🔁',
    color: '#009688',
    description: 'Цикл по массиву/записям'
  },
  [NODE_TYPES.VARIABLE]: {
    label: 'VARIABLE',
    icon: '📌',
    color: '#FF5722',
    description: 'Присваивание/получение переменной'
  },
  [NODE_TYPES.TRANSACTION]: {
    label: 'TRANSACTION',
    icon: '🔄',
    color: '#673AB7',
    description: 'Начало/конец транзакции (SAVEPOINT/RELEASE)'
  }
};

// Конфигурации по умолчанию для каждого типа узла
export const NODE_DEFAULT_CONFIGS = {
  [NODE_TYPES.GET]: {
    targetTable: '',
    recordIdSource: '',
    outputVariable: ''
  },
  [NODE_TYPES.GET_ROW]: {
    targetTable: '',
    recordIdSource: '',
    outputVariable: '',
    forUpdate: false
  },
  [NODE_TYPES.POST]: {
    targetTable: '',
    inputSource: 'p_input_json',
    outputVariable: '',
    outputRecordId: ''
  },
  [NODE_TYPES.PUT]: {
    targetTable: '',
    recordIdSource: '',
    inputSource: 'p_input_json',
    useOldRecord: true
  },
  [NODE_TYPES.DELETE]: {
    targetTable: '',
    recordIdSource: ''
  },
  [NODE_TYPES.SETTABLEATTRIBUTE]: {
    recordIdSource: '',
    attributeName: '',
    newValueSource: '',
    useOldRecord: true
  },
  [NODE_TYPES.DOBEFORESET]: {
    recordIdSource: '',
    attributeName: '',
    newValueSource: '',
    oldRecordSource: ''
  },
  [NODE_TYPES.DOAFTERSET]: {
    recordIdSource: '',
    attributeName: '',
    oldRecordSource: ''
  },
  [NODE_TYPES.VALIDATE]: {
    recordIdSource: ''
  },
  [NODE_TYPES.AFTEREDIT]: {},
  [NODE_TYPES.CONDITION]: {
    leftExpression: '',
    operator: '=',
    rightExpression: '',
    outputVariable: 'result'
  },
  [NODE_TYPES.COMPARE]: {
    leftExpression: '',
    operator: '=',
    rightExpression: ''
  },
  [NODE_TYPES.LOOP]: {
    arraySource: '',
    itemVariable: 'item',
    itemsVariable: 'items',
    iterations: 100
  },
  [NODE_TYPES.VARIABLE]: {
    variableName: '',
    valueSource: ''
  },
  [NODE_TYPES.TRANSACTION]: {
    savepointName: ''
  }
};

export const useScenarioStore = create(
  persist(
    (set, get) => ({
      // Состояние сценария
      scenario: {
        name: 'new_scenario',
        description: '',
        transactionMode: true,
        inputs: [{ name: 'p_input_json', type: 'jsonb' }],
        nodes: [],
        edges: []
      },

      // Выбранный узел
      selectedNode: null,

      // Панель инструментов (показанные типы)
      toolboxOpen: true,

      // Предпросмотр кода
      generatedCode: '',

      // Действия
      addNode: (type) => {
        const id = generateNodeId();
        const config = NODE_DEFAULT_CONFIGS[type] || {};
        const node = {
          id,
          type,
          position: { x: 100 + Math.random() * 400, y: 100 + Math.random() * 300 },
          data: {
            label: NODE_DESCRIPTORS[type]?.label || type,
            config
          }
        };
        set((state) => ({
          scenario: {
            ...state.scenario,
            nodes: [...state.scenario.nodes, node]
          }
        }));
        return id;
      },

      removeNode: (nodeId) => {
        set((state) => ({
          scenario: {
            ...state.scenario,
            nodes: state.scenario.nodes.filter((n) => n.id !== nodeId),
            edges: state.scenario.edges.filter(
              (e) => e.source !== nodeId && e.target !== nodeId
            )
          },
          selectedNode: state.selectedNode === nodeId ? null : state.selectedNode
        }));
      },

      updateNode: (nodeId, updates) => {
        set((state) => ({
          scenario: {
            ...state.scenario,
            nodes: state.scenario.nodes.map((n) =>
              n.id === nodeId ? { ...n, data: { ...n.data, ...updates } } : n
            )
          }
        }));
      },

      updateNodeConfig: (nodeId, configUpdates) => {
        set((state) => ({
          scenario: {
            ...state.scenario,
            nodes: state.scenario.nodes.map((n) =>
              n.id === nodeId
                ? {
                    ...n,
                    data: {
                      ...n.data,
                      config: { ...n.data.config, ...configUpdates }
                    }
                  }
                : n
            )
          }
        }));
      },

      addEdge: (source, target) => {
        const id = generateEdgeId();
        const edge = { id, source, target, handle: 'default' };
        set((state) => ({
          scenario: { ...state.scenario, edges: [...state.scenario.edges, edge] }
        }));
        return id;
      },

      removeEdge: (edgeId) => {
        set((state) => ({
          scenario: {
            ...state.scenario,
            edges: state.scenario.edges.filter((e) => e.id !== edgeId)
          }
        }));
      },

      updateEdge: (edgeId, updates) => {
        set((state) => ({
          scenario: {
            ...state.scenario,
            edges: state.scenario.edges.map((e) =>
              e.id === edgeId ? { ...e, ...updates } : e
            )
          }
        }));
      },

      setSelectedNode: (nodeId) => {
        const node = nodeId
          ? get().scenario.nodes.find((n) => n.id === nodeId)
          : null;
        set({ selectedNode: node });
      },

      updateScenario: (updates) => {
        set((state) => ({
          scenario: { ...state.scenario, ...updates }
        }));
      },

      setGeneratedCode: (code) => {
        set({ generatedCode: code });
      },

      setToolboxOpen: (open) => {
        set({ toolboxOpen: open });
      },

      // Импорт сценария
      importScenario: (scenarioData) => {
        set({ scenario: scenarioData });
      },

      // Экспорт сценария
      exportScenario: () => {
        return get().scenario;
      },

      // Очистка
      clearScenario: () => {
        set({
          scenario: {
            name: 'new_scenario',
            description: '',
            transactionMode: true,
            inputs: [{ name: 'p_input_json', type: 'jsonb' }],
            nodes: [],
            edges: []
          },
          selectedNode: null,
          generatedCode: ''
        });
      }
    }),
    {
      name: 'scenario-storage',
      partialize: (state) => ({ scenario: state.scenario })
    }
  )
);