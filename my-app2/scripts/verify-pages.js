// ============================================================================
// scripts/verify-pages.js — проверка каталога сгенерированных страниц
// ----------------------------------------------------------------------------
// Для каждого подкаталога src/baked/{n}/ проверяет:
//   1) наличие обязательных файлов: index.jsx, page.js, imports.js, page.css;
//   2) что index.jsx компилируется как JSX (Babel, preset-react);
//   3) что путь импорта './baked/{n}/imports' в index.jsx соответствует
//      реальному файлу src/baked/{n}/imports.js (иначе webpack не соберёт проект);
//   4) корректность метаданных page.js (default export с полем name).
// Запуск: npm run verify:pages
// ============================================================================
const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = path.resolve(__dirname, '..');
const BAKED_DIR = path.join(ROOT, 'src', 'baked');
const REQUIRED = ['index.jsx', 'page.js', 'imports.js', 'page.css'];

// Метаданные страницы: разбор "const pageMeta = {...}; export default pageMeta"
// (или прежней формы "export default {...}") через Babel
function readMeta(file) {
  const code = fs.readFileSync(file, 'utf8');
  const ast = babel.parseSync(code, { babelrc: false, configFile: false, sourceType: 'module' });
  const body = ast.program.body || [];

  // Вариант 1: const pageMeta = {...}
  const varDecl = body.find(
    (node) =>
      node.type === 'VariableDeclaration' &&
      node.declarations.some((d) => d.id && d.id.name === 'pageMeta')
  );
  if (varDecl) {
    const init = varDecl.declarations[0].init;
    return JSON.parse(code.slice(init.start, init.end));
  }

  // Вариант 2: export default {...}
  const decl = body.find((node) => node.type === 'ExportDefaultDeclaration');
  if (!decl) return null;
  return JSON.parse(code.slice(decl.declaration.start, decl.declaration.end));
}

function verifyPage(folder) {
  const dir = path.join(BAKED_DIR, folder);
  const errors = [];

  for (const name of REQUIRED) {
    if (!fs.existsSync(path.join(dir, name))) errors.push(`нет файла ${name}`);
  }
  if (errors.length) return { folder, errors };

  const pageFile = path.join(dir, 'index.jsx');
  const code = fs.readFileSync(pageFile, 'utf8');

  // 1. Компиляция JSX
  try {
    babel.transformSync(code, {
      babelrc: false,
      configFile: false,
      presets: [[require.resolve('@babel/preset-react'), { runtime: 'classic' }]],
      filename: 'index.jsx'
    });
  } catch (e) {
    errors.push('ошибка компиляции JSX: ' + e.message);
  }

  // 2. Импорты страницы должны резолвиться в файлы каталога
  const imports = code.match(/from\s+'([^']+)'/g) || [];
  for (const raw of imports) {
    const spec = raw.replace(/^from\s+'/, '').replace(/'$/, '');
    if (!spec.startsWith('.')) continue; // пакеты (react и т.п.)
    const target = spec
      .replace('./baked/' + folder + '/imports', './imports')
      .replace(/^\.\//, '');
    const candidates = [target, target + '.js', target + '.jsx'];
    const found = candidates.some((c) => fs.existsSync(path.join(dir, c)));
    if (!found) errors.push(`импорт не найден: ${spec}`);
  }

  // 3. Метаданные страницы
  try {
    const meta = readMeta(path.join(dir, 'page.js'));
    if (!meta || !meta.name) errors.push('page.js: нет поля name');
  } catch (e) {
    errors.push('page.js: ' + e.message);
  }

  return { folder, errors };
}

function main() {
  if (!fs.existsSync(BAKED_DIR)) {
    console.log('Каталог src/baked отсутствует — страниц нет.');
    return;
  }
  const folders = fs
    .readdirSync(BAKED_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  let failed = 0;
  for (const folder of folders) {
    const { errors } = verifyPage(folder);
    if (errors.length) {
      failed++;
      console.error(`✖ src/baked/${folder}/`);
      for (const err of errors) console.error('   - ' + err);
    } else {
      console.log(`✔ src/baked/${folder}/`);
    }
  }
  console.log(`\nПроверено страниц: ${folders.length}, с ошибками: ${failed}`);
  if (failed) process.exitCode = 1;
}

main();
