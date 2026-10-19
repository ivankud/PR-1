// Утилита кодогенерации страниц из форм (baked pages)
// ----------------------------------------------------------------------------
// Генерирует исходный код страницы прямо в браузере: входная форма (JSON формы
// редактора, в т.ч. с зашитым шаблоном примитива в primitive.template) →
// строка исходного кода .jsx. Генерация не обязана ни JSX-рендереру редактора,
// ни объектам формы — поэтому её можно запускать в тестах и в Node.
import { bakeForm } from './baker';

// Модуль импортов страницы: реэкспорт общего рантайма (src/baked/imports.js)
// и самого компонента страницы. Имя файла — imports.js: именно его резолвит
// webpack по пути './baked/{n}/imports' в компоненте страницы.
function buildImportsFile() {
  return [
    '// Единая точка импортов страницы',
    "export { AGTable, FilterSelect, IconSvg, getIconById, resolveTemplate, resolveCondition, resolveConditionalValue } from '../imports';",
    "export { default } from './index';",
    ''
  ].join('\n');
}

// Метаданные страницы (имя для списка сгенерированных страниц).
// Как и в компоненте страницы, имя формы приводится к безопасному ASCII-виду
// (safeIdent), чтобы свойства, вшитые в примитивы, не зависели от кодировки.
function buildMetaFile(form, fallbackName) {
  const meta = {
    id: (form && form.id) || '',
    name: (form && form.name) || fallbackName,
    generatedAt: new Date().toISOString()
  };
  return `const pageMeta = ${JSON.stringify(meta, null, 2)};\n\nexport default pageMeta;\n`;
}

// Генератор файлов каталога страницы src/baked/{n}/:
//   index.jsx  — компонент страницы (заголовок, функции, контекст, JSX примитивов)
//   page.js    — метаданные страницы (id, name, generatedAt) для списка «Мои формы»
//   imports.js — единая точка импортов: рантайм + компонент страницы
//   page.css   — CSS-классы страницы (общие классы — src/baked/theme.css)
// options.primitives — шаблоны примитивов (объекты с полем type)
// options.index      — номер каталога страницы (src/baked/{index})
// Возвращает { dir, baseDir, code, fileName, formName, files: [{ name, content }] }
//   dir     — относительно корня src ('./baked'), baseDir — папка страницы ('{n}')
export function generatePageSource(form, primitives, options) {
  const index = (options && options.index) || 1;
  const baked = bakeForm(form, { primitives: primitives || [], pageIndex: index });
  const baseDir = String(index);
  const code = baked.pageFile.replace(/\$\{n\}/g, baseDir);
  return {
    dir: baked.runtimeDir,
    baseDir,
    code,
    fileName: 'index.jsx',
    formName: (form && form.name) || baked.name,
    files: [
      { name: 'index.jsx', content: code },
      { name: 'page.js', content: buildMetaFile(form, baked.name) },
      { name: 'imports.js', content: buildImportsFile() },
      { name: 'page.css', content: '/* CSS-классы страницы (общие классы — src/baked/theme.css) */\n' }
    ]
  };
}

// Генератор по списку форм (список сгенерированных страниц из меню)
// Возвращает массив страниц: { formId, formName, dir, files }
export function generatePagesSource(forms, primitives) {
  return (forms || []).map((form, i) => {
    const page = generatePageSource(form, primitives, { index: i + 1 });
    return {
      formId: (form && form.id) || '',
      formName: page.formName,
      fileName: page.fileName,
      dir: page.dir,
      baseDir: page.baseDir,
      code: page.code,
      files: page.files,
      index: i + 1
    };
  });
}
