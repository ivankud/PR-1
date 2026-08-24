// Утилиты работы с хранилищем функций (public/functions/)
// Позволяют загружать список сохранённых функций и отдельные функции по имени,
// а также скачивать функцию формы как JSON-файл для ручного добавления в хранилище.
import { loadJson, downloadJson } from './jsonUtils';

// Загрузка списка имён функций из манифеста /functions/index.json
export async function loadStoredFunctionList() {
  try {
    const manifest = await loadJson(`/functions/index.json?t=${Date.now()}`);
    if (manifest && Array.isArray(manifest.functions)) {
      return manifest.functions;
    }
    return [];
  } catch (e) {
    console.error('Не удалось загрузить манифест функций:', e.message);
    return [];
  }
}

// Загрузка всех функций из хранилища (каждый файл по имени из манифеста)
export async function loadStoredFunctions() {
  const names = await loadStoredFunctionList();

  const results = await Promise.all(
    names.map(async (name) => {
      try {
        const data = await loadJson(
          `/functions/${encodeURIComponent(name)}.json?t=${Date.now()}`
        );
        return {
          name: data.name || name,
          description: data.description || '',
          code: data.code || ''
        };
      } catch (e) {
        console.error(`Не удалось загрузить функцию "${name}" из хранилища:`, e.message);
        return null;
      }
    })
  );

  return results.filter(Boolean);
}

// Скачивание функции как JSON-файла (чтобы положить в public/functions/)
// Формат файла: { "name": "...", "description": "...", "code": "..." }
export function downloadFunctionToStore(func) {
  const filename = `${func.name || 'function'}.json`;
  downloadJson(
    {
      name: func.name || '',
      description: func.description || '',
      code: func.code || ''
    },
    filename
  );
}