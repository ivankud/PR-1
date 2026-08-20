import { memo } from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent } from './BaseNode';
import { NODE_DESCRIPTORS } from '../store/scenarioStore';

// Конфигурация визуального отображения для логических узлов
const LOGIC_CONFIG = {
  condition: {
    color: NODE_DESCRIPTORS.condition.color,
    inputHandles: ['default'],
    outputHandles: ['branch_true', 'branch_false']
  },
  compare: {
    color: NODE_DESCRIPTORS.compare.color,
    inputHandles: ['default'],
    outputHandles: ['default', 'branch_true', 'branch_false']
  },
  loop: {
    color: NODE_DESCRIPTORS.loop.color,
    inputHandles: ['default'],
    outputHandles: ['loop_body', 'loop_end']
  },
  variable: {
    color: NODE_DESCRIPTORS.variable.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  },
  validate: {
    color: NODE_DESCRIPTORS.validate.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  },
  afteredit: {
    color: NODE_DESCRIPTORS.afteredit.color,
    inputHandles: ['default'],
    outputHandles: []
  },
  transaction: {
    color: NODE_DESCRIPTORS.transaction.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  }
};

// Создание компонентов узлов для логики
export const ConditionNode = createNodeComponent('condition', LOGIC_CONFIG.condition);
export const CompareNode = createNodeComponent('compare', LOGIC_CONFIG.compare);
export const LoopNode = createNodeComponent('loop', LOGIC_CONFIG.loop);
export const VariableNode = createNodeComponent('variable', LOGIC_CONFIG.variable);
export const ValidateNode = createNodeComponent('validate', LOGIC_CONFIG.validate);
export const AfterEditNode = createNodeComponent('afteredit', LOGIC_CONFIG.afteredit);
export const TransactionNode = createNodeComponent('transaction', LOGIC_CONFIG.transaction);

// Узел условия IF/ELSE с двумя выходами
function ConditionNodeStyled({ data, selected }) {
  return (
    <div style={{ padding: 0 }}>
      <ConditionNode data={data} selected={selected} />
    </div>
  );
}

// Узел цикла LOOP с выходом тела цикла
function LoopNodeStyled({ data, selected }) {
  return (
    <div style={{ padding: 0 }}>
      <LoopNode data={data} selected={selected} />
    </div>
  );
}

// Все логические узлы
export const LOGIC_NODES = {
  condition: ConditionNodeStyled,
  compare: CompareNode,
  loop: LoopNodeStyled,
  variable: VariableNode,
  validate: ValidateNode,
  afteredit: AfterEditNode,
  transaction: TransactionNode
};

// Все узлы вместе
export const ALL_NODES = {
  ...{
    get: createNodeComponent('get', LOGIC_CONFIG),
    get_row: createNodeComponent('get_row', LOGIC_CONFIG),
    post: createNodeComponent('post', LOGIC_CONFIG),
    put: createNodeComponent('put', LOGIC_CONFIG),
    delete: createNodeComponent('delete', LOGIC_CONFIG),
    settableattribute: createNodeComponent('settableattribute', LOGIC_CONFIG),
    dobeforeset: createNodeComponent('dobeforeset', LOGIC_CONFIG),
    doafterset: createNodeComponent('doafterset', LOGIC_CONFIG)
  },
  ...LOGIC_NODES
};