// ==========================================================================
// Файл №2 — рантайм-пакет для запечённой формы (BakedForm).
// Содержит AGTable, FilterSelect, resolve-хелперы, иконки и авторизацию.
// Пути импортов: components и utils резолвятся из "../components" / "../utils".
// Для переноса в другой проект рядом скопируйте AGTable.js, FilterSelect.js,
// filterUtils.js, iconLibrary.js, auth.js и установите пакеты ag-grid/json5.
// ==========================================================================
import React from 'react';
import AGTable from '../components/AGTable';
import FilterSelect from '../components/FilterSelect';
import { resolveTemplate, resolveCondition, resolveConditionalValue } from '../utils/anchors';
import { withAuthHeaders } from '../utils/auth';
import { IconSvg, getIconById } from '../utils/iconLibrary';
export { AGTable, FilterSelect, IconSvg, getIconById, resolveTemplate, resolveCondition, resolveConditionalValue, withAuthHeaders };
