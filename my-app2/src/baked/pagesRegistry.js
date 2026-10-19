// ============================================================================
// pagesRegistry.js — реестр сгенерированных страниц (src/baked/{n}/)
// ----------------------------------------------------------------------------
// Каталог src/baked сканируется на этапе сборки (webpack require.context):
// каждая сгенерированная страница — подкаталог, в котором есть:
//   page.js    — метаданные страницы (default export { id, name, generatedAt })
//   index.jsx  — компонент страницы (default export)
// Компонент загружается лениво (import()), поэтому меню «Мои формы» работает
// без ручной правки реестра: новая страница = новый подкаталог в src/baked/.
// ============================================================================

// require.context — функция webpack (не существует в Node/Jest).
// В тестах (Jest) используется пустой набор страниц, чтобы модуль был импортируем.
const hasContext = typeof require.context === 'function';
const noContext = () => {
  const fn = () => ({});
  fn.keys = () => [];
  fn.resolve = () => '';
  fn.id = 'no-context';
  return fn;
};

// Контекст метаданных страниц: src/baked/{n}/page.js
const metaContext = hasContext
  ? require.context(
      './',
      true,
      /^\.\/[^/]+\/page\.js$/
    )
  : noContext();

// Компонент страницы (default export) — точка входа каталога src/baked/{n}/
// (webpack: import() в контексте с lazy-режимом возвращает Promise)
const pageContext = hasContext
  ? require.context(
      './',
      true,
      /^\.\/[^/]+\/index\.jsx$/,
      'lazy'
    )
  : noContext();

// Папка страницы по ключу контекста ('./1789/index.jsx' → '1789')
function folderOf(key) {
  const m = /^\.\/([^/]+)\//.exec(key);
  return m ? m[1] : '';
}

// Ключик компонента страницы
function componentKeyFor(folder) {
  return `./${folder}/index.jsx`;
}

// Распаковать модуль контекста (загрузчик может вернуть модуль)
function unwrap(mod) {
  if (!mod) return null;
  return mod.default || mod;
}

// Список сгенерированных страниц: [{ id, name, folder, generatedAt }]
export function listBakedPages() {
  const folders = Array.from(new Set(pageContext.keys().map(folderOf).filter(Boolean)));
  return folders
    .map(folder => {
      let meta = {};
      try {
        meta = unwrap(metaContext(`./${folder}/page.js`)) || {};
      } catch (e) {
        meta = {};
      }
      return {
        id: meta.id || folder,
        name: meta.name || folder,
        generatedAt: meta.generatedAt || '',
        folder
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

// Загрузка компонента страницы по папке: Promise<Component | null>
export function loadBakedPage(folder) {
  const key = componentKeyFor(folder);
  if (!pageContext.keys().includes(key)) return Promise.resolve(null);
  // Ленивый контекст: вызов возвращает Promise модуля
  return Promise.resolve(pageContext(key)).then(unwrap).catch(() => null);
}

