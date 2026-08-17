# Утилиты (src/utils/)

## jsonUtils.js

Базовые операции с JSON-данными.

| Функция | Назначение |
|---------|-----------|
| `deepClone(obj)` | Глубокое клонирование через JSON.parse/stringify |
| `generateId(prefix)` | Генерация уникального ID (по умолчанию `prim-`) |
| `findPrimitive(node, id)` | Рекурсивный поиск примитива по id |
| `findParent(node, id)` | Поиск родителя примитива |
| `flattenTree(node)` | Плоский список всех примитивов |
| `loadJson(url)` | Загрузка JSON через fetch |
| `downloadJson(data, filename)` | Скачивание JSON как файла |
| `getValueByPath(obj, path)` | Получение значения по пути (`user.name`) |
| `setValueByPath(obj, path, value)` | Установка значения по пути |
| `cssObjectToString(cssObj)` | CSS объект → CSS строка (camelCase → kebab-case) |
| `cssStringToObject(cssString)` | CSS строка → CSS объект (kebab-case → camelCase) |
| `createEmptyForm()` | Создание новой пустой формы |

## anchors.js

Работа с якорями `{{path}}`.

| Функция | Назначение |
|---------|-----------|
| `resolveTemplate(template, primitive, context)` | Многопроходная подстановка `{{path}}` (макс. 10 проходов). Сначала ищет в свойствах примитива, затем в контексте |
| `getFormContext(form)` | Получение контекста: `form.context.inline` (source=inline) или `form.context.loadedData` |
| `getAnchorsForPrimitive(primitive, template)` | Список якорей из шаблона |
| `applyAnchors(primitive, template, context)` | Применение якорей к контексту |

## primitiveRenderer.js

Рендер примитивов (содержит JSX).

| Функция | Назначение |
|---------|-----------|
| `renderPrimitive(primitive, template, context)` | Рендер примитива по шаблону. Спец-обработка: AGTable, input/textarea, select, table |
| `getPrimitiveTemplate(primitives, type)` | Получение шаблона по типу |
| `createPrimitiveFromTemplate(template, id)` | Создание примитива из шаблона |

### Спец-обработка в renderPrimitive
- **AGTable** — рендерится через `React.createElement(AGTable, ...)`
- **input/textarea** — удаляется `value` если есть `defaultValue` с `{{...}}`; `readOnly` приводится к boolean
- **select** — опции из `render.options` (массив или строка через запятую)
- **table** — таблица из `render.table` (rows, cols, data)

## functionRunner.js

Пользовательские функции и события.

| Функция | Назначение |
|---------|-----------|
| `buildFunctions(functions)` | Компиляция через `new Function('context', code)` |
| `callFunction(fns, fnName, context)` | Вызов функции по имени |
| `buildEventHandlers(primitive, fns, context, onUpdateContext)` | Обработчики событий |
| `buildFormOpenHandler(fns, context)` | Обработчик открытия формы |
| `getFunctionContext(form, baseContext)` | Контекст для функций |
| `buildEventHandlersWithRef(primitive, fns, contextRef, onUpdateContext)` | Обработчики с ref |
| `buildEventHandlersWithUpdate(primitive, fns, context, onUpdateContext)` | Обработчики с обновлением контекста (основной) |

### Преобразование имён событий
`click` → `onClick`, `mouseenter` → `onMouseEnter` (через `toReactEventName`)

## formLoader.js

Загрузка форм.

| Функция | Назначение |
|---------|-----------|
| `loadFormList()` | Загрузка манифеста `/forms/index.json` |
| `normalizeFormId(id)` | Убирает `.json`, декодирует URL |
| `loadFormById(formId)` | Загрузка формы по ID |
| `loadFormsWithData()` | Загрузка всех форм с данными (для меню) |

## sizeUtils.js

Работа с размерами.

```js
SIZE_UNITS = ['px', '%', 'vw', 'vh', 'auto']
```

| Функция | Назначение |
|---------|-----------|
| `getWidthValue(primitive)` | CSS-значение ширины с единицей |
| `getHeightValue(primitive)` | CSS-значение высоты с единицей |
| `getSizeStyle(primitive)` | Объект style {width, height} |
| `isPxSize(primitive, dimension)` | Проверка, размер в px |
| `getNumericSize(primitive, dimension)` | Числовое значение размера |
| `updateSize(primitive, dimension, value)` | Обновление размера (мин. 10 для px) |
| `getCanvasWidthValue(canvas)` | Ширина холста с единицей |
| `getCanvasHeightValue(canvas)` | Высота холста с единицей |
| `getCanvasSizeStyle(canvas)` | Объект style для холста |

## auth.js

Basic Auth.

| Функция | Назначение |
|---------|-----------|
| `saveCredentials(login, password)` | Сохранение в localStorage (Base64) |
| `getCredentials()` | Чтение учётных данных |
| `clearCredentials()` | Удаление |
| `hasCredentials()` | Проверка наличия |
| `getBasicAuthHeader()` | Заголовок `Authorization: Basic ...` |
| `withAuthHeaders(headers, enabled)` | Добавление заголовка (не перезаписывает существующий) |