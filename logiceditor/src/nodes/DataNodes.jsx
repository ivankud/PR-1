import { memo } from 'react';
import { Position } from '@xyflow/react';
import { createNodeComponent } from './BaseNode';
import { NODE_DESCRIPTORS } from '../store/scenarioStore';

// Конфигурация визуального отображения для каждого типа узла
const NODE_CONFIG = {
  get: {
    color: NODE_DESCRIPTORS.get.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  },
  get_row: {
    color: NODE_DESCRIPTORS.get_row.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  },
  post: {
    color: NODE_DESCRIPTORS.post.color,
    inputHandles: ['default'],
    outputHandles: ['default']
  },
  put: {
    color: NODE_DESCRIPTORS.put.color,
    inputHandles: ['default', 'old_copy'],
    outputHandles: ['default']
  },
  delete: {
    color: NODE_DESCRIPTORS.delete.color,
    inputHandles: ['default'],
    outputHandles: []
  },
  settableattribute: {
    color: NODE_DESCRIPTORS.settableattribute.color,
    inputHandles: ['default', 'old_record'],
    outputHandles: ['default']
  },
  dobeforeset: {
    color: NODE_DESCRIPTORS.dobeforeset.color,
    inputHandles: ['default', 'record_ref'],
    outputHandles: ['default']
  },
  doafterset: {
    color: NODE_DESCRIPTORS.doafterset.color,
    inputHandles: ['default', 'record_ref'],
    outputHandles: ['default']
  }
};

// Создание компонентов узлов для операций с данными
export const GetNode = createNodeComponent('get', NODE_CONFIG.get);
export const GetRowNode = createNodeComponent('get_row', NODE_CONFIG.get_row);
export const PostNode = createNodeComponent('post', NODE_CONFIG.post);
export const PutNode = createNodeComponent('put', NODE_CONFIG.put);
export const DeleteNode = createNodeComponent('delete', NODE_CONFIG.delete);
export const SettableAttributeNode = createNodeComponent('settableattribute', NODE_CONFIG.settableattribute);
export const DobeforegetNode = createNodeComponent('dobeforeset', NODE_CONFIG.dobeforeset);
export const DoaftersetNode = createNodeComponent('doafterset', NODE_CONFIG.doafterset);

// Export all data operation nodes
export const DATA_NODES = {
  get: GetNode,
  get_row: GetRowNode,
  post: PostNode,
  put: PutNode,
  delete: DeleteNode,
  settableattribute: SettableAttributeNode,
  dobeforeset: DobeforegetNode,
  doafterset: DoaftersetNode
};