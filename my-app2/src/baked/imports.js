// ==========================================================================
// src/baked/imports.js — агрегатор импортов для сгенерированных страниц.
// --------------------------------------------------------------------------
// Сгенерированные страницы лежат в src/baked/{n}/ и импортируют из этого файла
// ВСЕ используемые компоненты и хелперы:
//     import { AGTable, IconSvg } from '../imports';
// Здесь же объединяются CSS-классы страниц (page.css) и общая тема
// (theme.css), поэтому странице не нужны отдельные импорты стилей.
// ==========================================================================

// Общие стили страниц и тема проекта
import './theme.css';

// Глобальные хелперы пользовательских функций форм: регистрируются как
// window.getElementByName / window.fetchWithAuth (см. utils/functionRunner.js).
// Генерируемые страницы пользуются ими как глобальными значениями, поэтому
// добавляем их и в область модуля (ESLint: no-undef без импорта).
import '../utils/functionRunner';

// Компоненты
export { default as AGTable } from '../components/AGTable';
export { default as FilterSelect } from '../components/FilterSelect';

// Хелперы подстановки/условий
export { resolveTemplate, resolveCondition, resolveConditionalValue } from '../utils/anchors';

// Авторизация (Basic Auth из localStorage)
export { withAuthHeaders } from '../utils/auth';

// Иконки (библиотека SVG)
export { IconSvg, getIconById } from '../utils/iconLibrary';

// Класс страницы (обёртка сгенерированных страниц)
export const BAKED_PAGE_CLASS = 'baked-page';

