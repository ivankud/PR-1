// Утилиты для хранения учётных данных (логин/пароль) для запросов к API
// Данные хранятся в localStorage в закодированном виде (Base64).

const STORAGE_KEY = 'app_auth_credentials';
const BASIC_PREFIX = 'Basic ';

// Сохранение учётных данных
export function saveCredentials(login, password) {
  const credentials = {
    login,
    password,
    savedAt: new Date().toISOString()
  };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(credentials))));
  localStorage.setItem(STORAGE_KEY, encoded);
  return credentials;
}

// Получение сохранённых учётных данных
export function getCredentials() {
  try {
    const encoded = localStorage.getItem(STORAGE_KEY);
    if (!encoded) return null;
    const json = decodeURIComponent(escape(atob(encoded)));
    const credentials = JSON.parse(json);
    return credentials;
  } catch (e) {
    console.warn('Не удалось прочитать учётные данные:', e.message);
    return null;
  }
}

// Удаление учётных данных
export function clearCredentials() {
  localStorage.removeItem(STORAGE_KEY);
}

// Проверка, сохранены ли учётные данные
export function hasCredentials() {
  return getCredentials() !== null;
}

// Получение заголовка Authorization в формате Basic Auth
// Например: "Basic bG9naW46cGFzc3dvcmQ="
export function getBasicAuthHeader() {
  const credentials = getCredentials();
  if (!credentials || !credentials.login || !credentials.password) return null;
  const token = btoa(unescape(encodeURIComponent(`${credentials.login}:${credentials.password}`)));
  return BASIC_PREFIX + token;
}

// Добавление заголовка авторизации к заголовкам запроса
// Если авторизация уже задана пользователем — используем её, иначе добавляем Basic Auth
// Параметр enabled позволяет опционально включать/выключать проброс учётных данных
export function withAuthHeaders(headers = {}, enabled = true) {
  // Если авторизация отключена — не добавляем заголовок
  if (!enabled) return headers;
  // Если пользователь уже указал Authorization — не перезаписываем
  if (headers.Authorization || headers.authorization) {
    return headers;
  }
  const authHeader = getBasicAuthHeader();
  if (!authHeader) return headers;
  return {
    ...headers,
    'Authorization': authHeader
  };
}
