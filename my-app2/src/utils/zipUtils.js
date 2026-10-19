// ============================================================================
// zipUtils.js — сборка zip-архива из набора текстовых файлов (без зависимостей)
// ----------------------------------------------------------------------------
// Используется для скачивания всего файлового проекта сгенерированной страницы
// (каталог baked/{n}/ с компонентом, импортами, CSS и метаданными).
// Формат: ZIP с методом «store» (без сжатия), UTF-8 флаг имён файлов.
// ============================================================================

// Таблица CRC32 (полином 0xEDB88320)
const CRC_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c >>> 0;
  }
  return table;
})();

// Вычисление CRC32 для массива байт
export function crc32(bytes) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// Текущая дата/время в формате DOS (для заголовков zip)
function dosDateTime(date) {
  const d = date || new Date();
  const time = ((d.getHours() & 0x1F) << 11) | ((d.getMinutes() & 0x3F) << 5) | ((d.getSeconds() / 2) & 0x1F);
  const day = (((d.getFullYear() - 1980) & 0x7F) << 9) | (((d.getMonth() + 1) & 0x0F) << 5) | (d.getDate() & 0x1F);
  return { time, day };
}

// Запись чисел в DataView (little-endian)
function writeU16(arr, v) {
  arr.push(v & 0xFF, (v >>> 8) & 0xFF);
}
function writeU32(arr, v) {
  arr.push(v & 0xFF, (v >>> 8) & 0xFF, (v >>> 16) & 0xFF, (v >>> 24) & 0xFF);
}

// Кодирование строки в UTF-8 (TextEncoder есть в браузере и в Node ≥ 11;
// в тестовом окружении jsdom он не определён — используем резервную реализацию)
function utf8Encode(str) {
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const bytes = [];
  for (let i = 0; i < str.length; i++) {
    let code = str.charCodeAt(i);
    // Суррогатные пары
    if (code >= 0xd800 && code <= 0xdbff && i + 1 < str.length) {
      const next = str.charCodeAt(i + 1);
      if (next >= 0xdc00 && next <= 0xdfff) {
        code = 0x10000 + ((code - 0xd800) << 10) + (next - 0xdc00);
        i++;
      }
    }
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f));
    } else if (code < 0x10000) {
      bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f));
    } else {
      bytes.push(
        0xf0 | (code >> 18),
        0x80 | ((code >> 12) & 0x3f),
        0x80 | ((code >> 6) & 0x3f),
        0x80 | (code & 0x3f)
      );
    }
  }
  return new Uint8Array(bytes);
}

// Сборка zip-архива: files = [{ path: 'dir/file.jsx', content: '...' }]
// Возвращает Uint8Array (готовый к скачиванию как application/zip)
export function createZip(files, options) {
  const date = (options && options.date) || new Date();
  const { time, day } = dosDateTime(date);

  const chunks = [];        // данные файлов
  const central = [];       // центральный каталог
  let offset = 0;

  for (const file of files || []) {
    const nameBytes = utf8Encode(String(file.path || file.name || 'file.txt'));
    const data = typeof file.content === 'string'
      ? utf8Encode(file.content)
      : new Uint8Array(file.content || []);
    const crc = crc32(data);

    // Локальный заголовок файла
    const local = [];
    writeU32(local, 0x04034b50);
    writeU16(local, 20);       // версия для распаковки
    writeU16(local, 0x0800);   // флаг: имя в UTF-8
    writeU16(local, 0);        // метод: store
    writeU16(local, time);
    writeU16(local, day);
    writeU32(local, crc);
    writeU32(local, data.length);
    writeU32(local, data.length);
    writeU16(local, nameBytes.length);
    writeU16(local, 0);        // extra field length

    chunks.push(new Uint8Array(local), nameBytes, data);

    // Запись центрального каталога
    writeU32(central, 0x02014b50);
    writeU16(central, 20);     // версия создания
    writeU16(central, 20);     // версия для распаковки
    writeU16(central, 0x0800);
    writeU16(central, 0);
    writeU16(central, time);
    writeU16(central, day);
    writeU32(central, crc);
    writeU32(central, data.length);
    writeU32(central, data.length);
    writeU16(central, nameBytes.length);
    writeU16(central, 0);      // extra length
    writeU16(central, 0);      // comment length
    writeU16(central, 0);      // disk number
    writeU16(central, 0);      // internal attributes
    writeU32(central, 0);      // external attributes
    writeU32(central, offset); // смещение локального заголовка

    offset += local.length + nameBytes.length + data.length;
    central.push(...Array.from(nameBytes));
  }

  const centralBytes = new Uint8Array(central);
  // Конец центрального каталога
  const end = [];
  writeU32(end, 0x06054b50);
  writeU16(end, 0);
  writeU16(end, 0);
  writeU16(end, files.length);
  writeU16(end, files.length);
  writeU32(end, centralBytes.length);
  writeU32(end, offset);
  writeU16(end, 0);

  // Сборка итогового массива
  const total = offset + centralBytes.length + end.length;
  const out = new Uint8Array(total);
  let pos = 0;
  for (const chunk of chunks) {
    out.set(chunk, pos);
    pos += chunk.length;
  }
  out.set(centralBytes, pos);
  pos += centralBytes.length;
  out.set(new Uint8Array(end), pos);
  return out;
}
