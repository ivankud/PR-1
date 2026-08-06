// Утилиты загрузки форм по ID и получения списка форм из манифеста
import { loadJson } from './jsonUtils';

// Загрузка списка имён файлов форм из manifest
export async function loadFormList() {
  try {
    const manifest = await loadJson(`/forms/index.json?t=${Date.now()}`);
    if (manifest && Array.isArray(manifest.forms)) {
      return manifest.forms;
    }
    return [];
  } catch (e) {
    console.warn('Не удалось загрузить манифест форм:', e.message);
    return [];
  }
}

// Нормализация ID формы (убираем .json и декодируем URL)
export function normalizeFormId(id) {
  if (!id) return '';
  let result = String(id);
  if (result.endsWith('.json')) {
    result = result.slice(0, -5);
  }
  try {
    result = decodeURIComponent(result);
  } catch (e) {
    // ignore
  }
  return result;
}

// Загрузка формы по ID (file name без .json)
export async function loadFormById(formId) {
  const normalized = normalizeFormId(formId);
  const data = await loadJson(`/forms/${normalized}.json?t=${Date.now()}`);
  if (!data || !data.id) {
    throw new Error('Некорректная структура формы');
  }
  return data;
}

// Загрузка всех форм с данными (для навигационного меню)
export async function loadFormsWithData() {
  const formFiles = await loadFormList();

  const results = await Promise.all(
    formFiles.map(async (file) => {
      try {
        const data = await loadJson(`/forms/${file}.json?t=${Date.now()}`);
        return {
          id: data.id || file,
          name: data.name || file,
          file,
          data,
          canvas: data.canvas || {}
        };
      } catch (e) {
        return null;
      }
    })
  );

  return results.filter(Boolean);
}