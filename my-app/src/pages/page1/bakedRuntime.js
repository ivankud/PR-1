// ==========================================================================
// Файл №2 — рантайм-пакет для запечённой формы (BakedForm).
// Содержит AGTable, FilterSelect, resolve-хелперы, иконки и авторизацию.
// Для переноса в другой проект рядом скопируйте AGTable.js, FilterSelect.js,
// filterUtils.js, iconLibrary.js, auth.js и установите пакеты ag-grid/json5.
// ==========================================================================
import React from 'react';
import AGTable from '../components/AGTable';
import FilterSelect from '../components/FilterSelect';
import { resolveTemplate, resolveCondition, resolveConditionalValue } from './anchors';
import { withAuthHeaders } from './auth';
import { IconSvg, getIconById } from './iconLibrary';
export { AGTable, FilterSelect, IconSvg, getIconById, resolveTemplate, resolveCondition, resolveConditionalValue, withAuthHeaders };
