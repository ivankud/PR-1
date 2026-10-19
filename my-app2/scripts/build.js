// ============================================================================
// scripts/build.js — надстройка над `react-scripts build`
// ----------------------------------------------------------------------------
// Причина: react-scripts (вызываемый через npx/оболочку) иногда не подхватывает
// изменения в каталоге сгенерированных страниц src/baked/{n}/ (устаревший
// resolve-кэш в процессе npx). Здесь сборка запускается в отдельном,
// гарантированно свежем процессе node с теми же переменными окружения.
// ============================================================================
const { spawnSync } = require('child_process');
const path = require('path');

const reactScriptsBin = path.join(
  path.dirname(require.resolve('react-scripts/package.json')),
  'bin',
  'react-scripts.js'
);

// По умолчанию предупреждения ESLint не валят сборку (CI отключён).
// Для строгой сборки: CI=true npm run build
const env = { ...process.env };
if (env.CI === undefined) env.CI = '';

const result = spawnSync(process.execPath, [reactScriptsBin, 'build'], {
  stdio: 'inherit',
  env
});

process.exit(result.status === null ? 1 : result.status);
