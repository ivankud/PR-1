# Инструкция: как создавать шаблоны примитивов

## Что такое примитив?

Примитив — это базовый строительный блок веб-формы: кнопка, поле ввода, текст, контейнер, таблица и т.д. Каждый примитив описывается **шаблоном** — JSON-файлом, который находится в директории `public/primitives/`.

## 1. Структура шаблона примитива

Каждый шаблон — это JSON-файл с расширением `.json`, размещённый в `public/primitives/`.

### Полная структура файла

```json
{
  "type": "button",
  "name": "Кнопка",
  "icon": "🔘",
  "defaults": {
    "width": 120,
    "height": 40,
    "left": 0,
    "top": 0,
    "style": {
      "backgroundColor": "#007bff",
      "color": "#ffffff"
    }
  },
  "properties": [
    { "name": "text", "label": "Текст", "type": "string", "default": "Кнопка" }
  ],
  "anchors": [
    { "name": "text", "path": "button.text", "description": "Текст кнопки из контекста" }
  ],
  "render": {
    "tag": "button",
    "text": "{{text}}",
    "attributes": {
      "type": "button"
    }
  },
  "isContainer": false
}
```

---

## 2. Описание полей

### 2.1 Поле `type` (обязательное)

Уникальный идентификатор примитива. Совпадает с именем файла без `.json`.

```json
"type": "input"
```

### 2.2 Поле `name` (обязательное)

Отображаемое имя примитива в списке левой панели редактора.

```json
"name": "Поле ввода"
```

### 2.3 Поле `icon` (обязательное)

Эмодзи-иконка примитива в панели элементов.

```json
"icon": "📝"
```

### 2.4 Поле `defaults` (обязательное)

Стандартные размеры и стили, применяемые при создании нового примитива.

| Поле | Описание |
|------|----------|
| `width` | Ширина примитива в px |
| `height` | Высота примитива в px |
| `widthUnit` | Единица измерения ширины: `px`, `%`, `vw`, `vh` или `auto` |
| `heightUnit` | Единица измерения высоты: `px`, `%`, `vw`, `vh` или `auto` |
| `left` | Координата X по умолчанию |
| `top` | Координата Y по умолчанию |
| `style` | CSS-стили (camelCase) |

Пример с единицами измерения:

```json
"defaults": {
  "width": 50,
  "height": 100,
  "widthUnit": "%",
  "heightUnit": "vh",
  "left": 0,
  "top": 0
}
```

#### Поддерживаемые единицы измерения

| Единица | Описание |
|---------|----------|
| `px` | Пиксели — точный фиксированный размер на экране |
| `%` | Проценты — размер относительно родительского блока |
| `vw` | Проценты от ширины видимой области экрана |
| `vh` | Проценты от высоты видимой области экрана |
| `auto` | Браузер сам считает размер на основе контента |

> **Примечание:** Ресайз элемента мышью на холсте доступен только для размера в `px`. Для не-px единиц размер задаётся числовым полем в свойствах.

```json
"defaults": {
  "width": 200,
  "height": 35,
  "left": 0,
  "top": 0,
  "style": {
    "border": "1px solid #cccccc",
    "borderRadius": "4px",
    "padding": "4px 8px",
    "fontSize": "14px"
  }
}
```

### 2.5 Поле `properties` — список настраиваемых свойств

Каждое свойство отображается в правой панели редактора. Поддерживаемые типы:

| Тип | UI в редакторе | Пример |
|-----|---------------|--------|
| `string` | Текстовое поле | `{ "name": "text", "label": "Текст", "type": "string", "default": "Кнопка" }` |
| `number` | Числовое поле | `{ "name": "width", "label": "Ширина", "type": "number" }` |
| `boolean` | Чекбокс | `{ "name": "checked", "label": "Отмечен", "type": "boolean", "default": false }` |
| `textarea` | Многострочное поле | `{ "name": "value", "label": "Значение", "type": "textarea" }` |

Свойства `name`, `width`, `height`, `left`, `top` доступны всегда — их добавлять не нужно.

```json
"properties": [
  { "name": "placeholder", "label": "Подсказка", "type": "string", "default": "Введите текст..." },
  { "name": "value", "label": "Значение", "type": "string", "default": "" },
  { "name": "name", "label": "Имя поля", "type": "string", "default": "input" }
]
```

### 2.6 Поле `anchors` — якоря для подстановки данных из контекста

Якоря позволяют подставлять данные из контекста формы (inline или загруженного JSON) в свойства примитива.

| Поле | Описание |
|------|----------|
| `name` | Имя якоря (совпадает с именем свойства) |
| `path` | Путь в контексте через точку (dot notation) |
| `description` | Пояснение, отображаемое в правой панели |

```json
"anchors": [
  { "name": "value", "path": "input.value", "description": "Значение из контекста" },
  { "name": "placeholder", "path": "input.placeholder", "description": "Подсказка из контекста" }
]
```

### 2.7 Поле `render` — как отрисовывать примитив

Здесь описывается HTML-разметка примитива.

```json
"render": {
  "tag": "input",
  "text": "{{text}}",
  "attributes": {
    "type": "text",
    "placeholder": "{{placeholder}}",
    "value": "{{value}}",
    "name": "{{name}}"
  }
}
```

#### `tag` (обязательное)

HTML-тег для рендера: `div`, `input`, `button`, `label`, `select`, `textarea`, `table`, `img` и др.

#### `text` — текстовое содержимое

Текст внутри элемента. Может содержать `{{path}}` для подстановки.

```json
"text": "Войти: {{user.name}}"
```

#### `attributes` — HTML-атрибуты

Атрибуты элемента. Значения могут быть шаблонами `{{path}}` (подстановка из свойств примитива или контекста).

```json
"attributes": {
  "type": "button",
  "name": "{{name}}",
  "value": "{{value}}",
  "checked": "{{checked}}"
}
```

#### `children` — вложенные элементы

Для элементов с вложенными тегами (например checkbox внутри label).

```json
"render": {
  "tag": "label",
  "text": "{{label}}",
  "attributes": {},
  "children": [
    {
      "tag": "input",
      "attributes": {
        "type": "checkbox",
        "checked": "{{checked}}",
        "name": "{{name}}"
      }
    }
  ]
}
```

#### `options` — для выпадающего списка (select)

Опции из свойства `{{options}}` (строка через запятую или массив).

```json
"render": {
  "tag": "select",
  "attributes": { "name": "{{name}}" },
  "options": "{{options}}"
}
```

#### `table` — для таблицы

Настройки таблицы: количество строк, колонок и данные.

```json
"render": {
  "tag": "table",
  "attributes": {},
  "table": {
    "rows": "{{rows}}",
    "cols": "{{cols}}",
    "data": "{{data}}"
  }
}
```

### 2.8 Поле `isContainer` — является ли примитив контейнером

Помечает примитив как контейнер, в который можно вкладывать другие примитивы.

```json
"isContainer": true
```

---

## 3. Как зарегистрировать новый примитив

1. **Создайте JSON-файл** в `public/primitives/`. Имя файла = `type` примитива.

   ```
   public/primitives/alert.json
   ```

2. **Добавьте имя файла** в список загрузки в `src/state/EditorContext.js`:
   ```js
   const primitiveFiles = [
     'button', 'text', 'input', 'textarea', 'container',
     'image', 'checkbox', 'radio', 'select', 'table',
     'alert'  // ← ваш новый примитив
   ];
   ```

3. **Перезапустите приложение** — примитив появится в левой панели.

---

## 4. Полный пример: создание примитива «Кнопка-ссылка»

Создаём `/public/primitives/linkbutton.json`:

```json
{
  "type": "linkbutton",
  "name": "Кнопка-ссылка",
  "icon": "🔗",
  "defaults": {
    "width": 140,
    "height": 40,
    "left": 0,
    "top": 0,
    "style": {
      "backgroundColor": "#28a745",
      "color": "#ffffff",
      "border": "none",
      "borderRadius": "20px",
      "fontSize": "14px",
      "cursor": "pointer",
      "textDecoration": "none"
    }
  },
  "properties": [
    { "name": "text", "label": "Текст", "type": "string", "default": "Перейти" },
    { "name": "href", "label": "Ссылка", "type": "string", "default": "https://example.com" }
  ],
  "anchors": [
    { "name": "text", "path": "linkbutton.text", "description": "Текст кнопки" },
    { "name": "href", "path": "linkbutton.href", "description": "Адрес ссылки" }
  ],
  "render": {
    "tag": "a",
    "text": "{{text}}",
    "attributes": {
      "href": "{{href}}",
      "target": "_blank"
    }
  }
}
```

Добавляем в `src/state/EditorContext.js`:

```js
const primitiveFiles = [
  'button', 'text', 'input', 'textarea', 'container',
  'image', 'checkbox', 'radio', 'select', 'table',
  'linkbutton'
];
```

---

## 5. Примеры готовых примитивов

### Кнопка
```json
{
  "type": "button",
  "name": "Кнопка",
  "icon": "🔘",
  "defaults": { "width": 120, "height": 40, "left": 0, "top": 0, "style": { "backgroundColor": "#007bff", "color": "#ffffff" } },
  "properties": [
    { "name": "text", "label": "Текст", "type": "string", "default": "Кнопка" }
  ],
  "anchors": [ { "name": "text", "path": "button.text", "description": "Текст кнопки" } ],
  "render": { "tag": "button", "text": "{{text}}", "attributes": { "type": "button" } }
}
```

### Поле ввода
```json
{
  "type": "input",
  "name": "Поле ввода",
  "icon": "📝",
  "defaults": { "width": 200, "height": 35, "left": 0, "top": 0, "style": { "border": "1px solid #ccc", "borderRadius": "4px" } },
  "properties": [
    { "name": "placeholder", "label": "Подсказка", "type": "string", "default": "Введите текст..." },
    { "name": "value", "label": "Значение", "type": "string", "default": "" }
  ],
  "anchors": [ { "name": "value", "path": "input.value", "description": "Значение" } ],
  "render": { "tag": "input", "attributes": { "type": "text", "placeholder": "{{placeholder}}", "value": "{{value}}" } }
}
```

### Текст (label)
```json
{
  "type": "text",
  "name": "Текст (label)",
  "icon": "🔤",
  "defaults": { "width": 200, "height": 30, "left": 0, "top": 0, "style": { "fontSize": "14px", "color": "#333333" } },
  "properties": [
    { "name": "text", "label": "Текст", "type": "string", "default": "Текст" }
  ],
  "anchors": [ { "name": "text", "path": "label.text", "description": "Текст из контекста" } ],
  "render": { "tag": "label", "text": "{{text}}", "attributes": {} }
}
```

### Контейнер
```json
{
  "type": "container",
  "name": "Контейнер",
  "icon": "📦",
  "defaults": { "width": 300, "height": 200, "left": 0, "top": 0, "style": { "border": "1px dashed #999", "backgroundColor": "#f9f9f9" } },
  "properties": [],
  "anchors": [],
  "render": { "tag": "div", "attributes": {} },
  "isContainer": true
}
```

### Изображение
```json
{
  "type": "image",
  "name": "Изображение",
  "icon": "🖼️",
  "defaults": { "width": 200, "height": 150, "left": 0, "top": 0, "style": { "border": "1px solid #ccc", "objectFit": "cover" } },
  "properties": [
    { "name": "src", "label": "URL", "type": "string", "default": "https://via.placeholder.com/200x150" },
    { "name": "alt", "label": "Альт. текст", "type": "string", "default": "Изображение" }
  ],
  "anchors": [ { "name": "src", "path": "image.src", "description": "URL изображения" } ],
  "render": { "tag": "img", "attributes": { "src": "{{src}}", "alt": "{{alt}}" } }
}
```

### Выпадающий список (select)
```json
{
  "type": "select",
  "name": "Выпадающий список",
  "icon": "📋",
  "defaults": { "width": 200, "height": 35, "left": 0, "top": 0, "style": { "border": "1px solid #ccc" } },
  "properties": [
    { "name": "name", "label": "Имя поля", "type": "string", "default": "select" },
    { "name": "options", "label": "Варианты (через запятую)", "type": "string", "default": "Вариант 1, Вариант 2" }
  ],
  "anchors": [ { "name": "options", "path": "select.options", "description": "Варианты (массив)" } ],
  "render": { "tag": "select", "attributes": { "name": "{{name}}" }, "options": "{{options}}" }
}
```

### Таблица
```json
{
  "type": "table",
  "name": "Таблица",
  "icon": "📊",
  "defaults": { "width": 400, "height": 150, "left": 0, "top": 0, "style": { "borderCollapse": "collapse" } },
  "properties": [
    { "name": "rows", "label": "Строки", "type": "number", "default": 3 },
    { "name": "cols", "label": "Колонки", "type": "number", "default": 3 }
  ],
  "anchors": [ { "name": "data", "path": "table.data", "description": "Данные (массив массивов)" } ],
  "render": { "tag": "table", "attributes": {}, "table": { "rows": "{{rows}}", "cols": "{{cols}}", "data": "{{data}}" } }
}
```

### AGTable (продвинутая таблица на AG Grid)

Мощная таблица на основе библиотеки **AG Grid**. Поддерживает сортировку, фильтрацию, изменение ширины колонок, пагинацию, выбор строк, автовысоту, а также загрузку данных из API или из ручного ввода.

```json
{
  "type": "agtable",
  "name": "AGTable",
  "icon": "📊",
  "defaults": {
    "width": 600,
    "height": 300,
    "left": 0,
    "top": 0,
    "style": {
      "border": "1px solid #ccc",
      "borderRadius": "4px"
    }
  },
  "properties": [
    { "name": "title", "label": "Заголовок", "type": "string", "default": "Таблица" },
    { "name": "dataSource", "label": "Источник данных", "type": "string", "default": "manual" },
    { "name": "apiUrl", "label": "URL API", "type": "string", "default": "" },
    { "name": "apiMethod", "label": "Метод API", "type": "string", "default": "GET" },
    { "name": "apiHeaders", "label": "Заголовки (JSON5)", "type": "json5", "default": "{}" },
    { "name": "apiDataPath", "label": "Путь к данным в ответе", "type": "string", "default": "" },
    { "name": "columnDefs", "label": "Модель колонок (JSON5)", "type": "json5", "default": "[\n  // Первичный ключ\n  { field: 'id', headerName: 'ID', width: 80 },\n  // Основное имя\n  { field: 'name', headerName: 'Имя' }\n]" },
    { "name": "rowData", "label": "Данные (JSON5)", "type": "json5", "default": "[\n  { id: 1, name: 'Иван' },\n  { id: 2, name: 'Пётр' }\n]" },
    { "name": "pagination", "label": "Пагинация", "type": "boolean", "default": true },
    { "name": "paginationPageSize", "label": "Строк на странице", "type": "number", "default": 10 },
    { "name": "sortable", "label": "Сортировка", "type": "boolean", "default": true },
    { "name": "filterable", "label": "Фильтрация", "type": "boolean", "default": true },
    { "name": "resizable", "label": "Изменение ширины колонок", "type": "boolean", "default": true },
    { "name": "selectable", "label": "Выбор строк", "type": "boolean", "default": false },
    { "name": "autoHeight", "label": "Автовысота", "type": "boolean", "default": false }
  ],
  "anchors": [
    { "name": "columnDefs", "path": "agtable.columnDefs", "description": "Модель колонок из контекста" },
    { "name": "rowData", "path": "agtable.rowData", "description": "Данные из контекста" },
    { "name": "apiUrl", "path": "agtable.apiUrl", "description": "URL API из контекста" },
    { "name": "apiDataPath", "path": "agtable.apiDataPath", "description": "Путь к данным в ответе API" }
  ],
  "render": {
    "tag": "div",
    "attributes": {
      "data-agtable": "true"
    }
  },
  "isContainer": false
}
```

#### Свойства AGTable

| Свойство | Тип | По умолчанию | Описание |
|----------|-----|--------------|----------|
| `title` | string | `Таблица` | Заголовок, отображаемый над таблицей. Пустая строка скрывает заголовок |
| `dataSource` | string | `manual` | Источник данных: `manual` (ручной ввод) или `api` (загрузка с сервера) |
| `apiUrl` | string | `` | URL API для загрузки данных (используется при `dataSource: "api"`) |
| `apiMethod` | string | `GET` | HTTP-метод запроса: `GET`, `POST`, `PUT`, `DELETE` и др. |
| `apiHeaders` | string (JSON) | `{}` | Дополнительные HTTP-заголовки в формате JSON, например `{"Authorization": "Bearer token"}` |
| `apiDataPath` | string | `` | Путь к массиву данных в ответе API через точку (dot notation), например `data.items` |
| `columnDefs` | textarea (JSON) | `[{"field":"id","headerName":"ID"},{"field":"name","headerName":"Имя"}]` | Модель колонок — массив объектов с полями `field` (поле данных) и `headerName` (заголовок) |
| `rowData` | textarea (JSON) | `[{"id":1,"name":"Иван"},{"id":2,"name":"Пётр"}]` | Данные таблицы — массив объектов (используется при `dataSource: "manual"`) |
| `pagination` | boolean | `true` | Включить пагинацию (разбиение на страницы) |
| `paginationPageSize` | number | `10` | Количество строк на одной странице |
| `sortable` | boolean | `true` | Включить сортировку по колонкам (клик по заголовку) |
| `filterable` | boolean | `true` | Включить фильтрацию по колонкам |
| `resizable` | boolean | `true` | Разрешить изменение ширины колонок перетаскиванием |
| `selectable` | boolean | `false` | Включить выбор строк (множественный) |
| `autoHeight` | boolean | `false` | Автоматическая высота таблицы по содержимому (без внутренней прокрутки) |

#### Модель колонок (`columnDefs`)

Каждая колонка — объект с полями:

| Поле | Описание |
|------|----------|
| `field` | Имя поля в данных (обязательное) |
| `headerName` | Заголовок колонки (если не указан, используется `field`) |
| `width` | Ширина колонки в px |
| `sortable` | Переопределить сортировку для конкретной колонки |
| `filter` | Переопределить фильтрацию для конкретной колонки |
| `resizable` | Переопределить изменение ширины для конкретной колонки |
| `notFiltered` | `true` — запретить фильтрацию по полю |
| `notSorted` | `true` — запретить сортировку по полю |
| `hidden` | `true` — скрыть поле полностью (не отображается даже в меню колонок) |
| `cellRendererFramework` | Функция/React-компонент для кастомного отображения содержимого ячейки. Получает контекст формы и данные строки (`params.data`) |

`cellRendererFramework` позволяет определить своё содержимое ячейки. Функция получает параметр `params`, из которого доступны:
- `params.data` — объект данных текущей строки
- `params.context` — контекст AG Grid (можно передать контекст формы)
- `params.value` — значение поля текущей ячейки

Пример с `cellRendererFramework`:

```jsx
{
  field: 'action',
  headerName: '',
  width: 130,
  resizable: false,
  notFiltered: true,
  notSorted: true,
  hidden: true,
  cellRendererFramework: (params) => {
    const row = params.data;
    const ref = React.createRef();
    const refEdit = React.createRef();

    return (
      <>
        <DataProviderCRUD>
          {(provider) => {
            const { deleting } = provider.state;
            const isProviderBusy = deleting.length > 0;
            return (
              <>
                <Button
                  id={row.id}
                  className="mr-1"
                  color="secondary"
                  innerRef={refEdit}
                  disabled={
                    isProviderBusy ||
                    !row.accesses?.[ACCESS_FUNCTIONS.SMK_AUDITPROGRAMSTEP_EDIT]?.[
                      ACCESS_FUNCTION_PROPS.ENABLED
                    ].val
                  }
                  size="sm"
                  onClick={() => {
                    onEditCorrection();
                  }}>
                  <FontAwesomeIcon icon="pencil-alt" fixedWidth />
                </Button>
                <UncontrolledTooltip placement="left" target={refEdit}>
                  Редактировать
                  <div>
                    {
                      row.accesses?.[ACCESS_FUNCTIONS.SMK_AUDITPROGRAMSTEP_EDIT]?.[
                        ACCESS_FUNCTION_PROPS.ENABLED
                      ].sreason
                    }
                  </div>
                </UncontrolledTooltip>
              </>
            );
          }}
        </DataProviderCRUD>
      </>
    );
  },
}
```

#### JSON5 в свойствах AGTable

Свойства `columnDefs`, `rowData` и `apiHeaders` используют формат **JSON5** — расширение JSON, которое позволяет:

- **Комментарии** `//` и `/* */`
- **Одинарные кавычки** `'...'`
- **Трейлинг-запятые** (запятая после последнего элемента)
- **Без кавычек** у ключей объектов
- **Многострочные строки**

Пример `columnDefs` в формате JSON5:

```json5
[
  // Первичный ключ
  { field: 'id', headerName: 'ID', width: 80 },
  // Основные данные
  { field: 'name', headerName: 'Имя', notFiltered: true },
  { field: 'age', headerName: 'Возраст', width: 60, resizable: false, },
]
```

#### Примеры `columnDefs` с новыми свойствами

```json5
[
  {
    field: 'action',
    headerName: '',
    width: 130,
    resizable: false,
    notFiltered: true,
    notSorted: true,
    hidden: true,
    cellRendererFramework: (params) => '...'
  },
  { field: 'id', headerName: 'ID', width: 80, notSorted: true },
  { field: 'secret', headerName: 'Секрет', hidden: true }
]
```

#### Источник данных: API

При `dataSource: "api"` таблица загружает данные с сервера:

1. Выполняется запрос на `apiUrl` методом `apiMethod` с заголовками `apiHeaders`.
2. Ответ парсится как JSON.
3. Если задан `apiDataPath` (например `data.items`), из ответа извлекается массив по этому пути.
4. Если извлечённое значение — массив, оно становится данными таблицы; иначе таблица остаётся пустой.

Пример конфигурации для API:

```json
{
  "dataSource": "api",
  "apiUrl": "https://api.example.com/users",
  "apiMethod": "GET",
  "apiHeaders": "{\"Authorization\": \"Bearer token\"}",
  "apiDataPath": "data.users"
}
```

#### Якоря (anchors)

AGTable поддерживает подстановку данных из контекста формы:

| Якорь | Путь в контексте | Описание |
|-------|------------------|----------|
| `columnDefs` | `agtable.columnDefs` | Модель колонок из контекста |
| `rowData` | `agtable.rowData` | Данные таблицы из контекста |
| `apiUrl` | `agtable.apiUrl` | URL API из контекста |
| `apiDataPath` | `agtable.apiDataPath` | Путь к данным в ответе API |

#### Примечания

- Приоритет подстановки значений: свойства примитива → контекст формы → значение по умолчанию.
- `apiHeaders` мемоизируется, чтобы избежать бесконечного цикла перезагрузки данных.
- При `autoHeight: true` таблица подстраивает высоту под количество строк, а внутренняя прокрутка отключается.
- Ширина колонок автоматически подгоняется под ширину контейнера при первой отрисовке сетки.

---

## 6. Подстановка данных из контекста

Позволяет привязывать свойства примитива к данным из контекста формы. Контекст может быть:
- **Inline** — данные прописаны прямо в форме
- **URL** — данные загружаются с внешнего источника

### Пример контекста формы

```json
{
  "context": {
    "source": "inline",
    "inline": {
      "user": {
        "name": "Иван Петров",
        "email": "ivan@example.com"
      }
    }
  }
}
```

### Подстановка в шаблоне

В `render` используем `{{путь.в.контексте}}`:

```json
"render": {
  "tag": "button",
  "text": "Привет, {{user.name}}!",
  "attributes": {}
}
```

Приоритет подстановки:
1. Сначала ищется в свойствах примитива (например `{{text}}`)
2. Затем в контексте формы (например `{{user.name}}`)

---

## 6.5 Работа с размерами в редакторе

### Для элементов (примитивов)

При выборе элемента на холсте в **правой панели → «Свойства»** для полей «Ширина» и «Высота» появился выпадающий список единиц измерения.

- Введите числовое значение в поле
- Выберите единицу измерения из списка: `px`, `%`, `vw`, `vh`, `auto`
- При выборе `auto` числовое поле отключается — размер рассчитает браузер

В JSON примитива это сохраняется как:

```json
{
  "width": 50,
  "height": 30,
  "widthUnit": "%",
  "heightUnit": "px"
}
```

### Для корневого элемента (формы)

Та же возможность доступна для **корневого элемента — самой формы**. Когда на холсте **ничего не выбрано**, в **правой панели → «Свойства» → «Настройки холста»** для полей «Ширина» и «Высота» доступен такой же выпадающий список единиц измерения:

- **px** (пиксели) — точный фиксированный размер на экране
- **%** (проценты) — размер относительно родительского блока
- **vw / vh** — проценты от ширины (`vw`) или высоты (`vh`) видимой области экрана
- **auto** — браузер сам считает размер на основе контента

В JSON формы это сохраняется в объекте `canvas`:

```json
{
  "canvas": {
    "width": 50,
    "height": 30,
    "widthUnit": "vw",
    "heightUnit": "%",
    "backgroundColor": "#ffffff",
    "gridSize": 10,
    "showGrid": true
  }
}
```

> **Примечание:** Сетка на холсте отображается на основе числовых значений (число × число), даже если выбрана не-px единица измерения. Фактический размер определяется выбранной единицей (например `50vw` — 50% ширины окна браузера).

---

## 7. Чек-лист при создании нового примитива

- [ ] **Создан** JSON-файл `public/primitives/название.json`
- [ ] **`type`** совпадает с именем файла
- [ ] **`name`** — понятное русское название
- [ ] **`icon`** — эмодзи для отображения в панели
- [ ] **`defaults`** — начальные размеры и стили
- [ ] **`properties`** — описаны настраиваемые свойства
- [ ] **`render`** — корректный `tag` и атрибуты
- [ ] **`anchors`** — добавлены якоря для подстановки из контекста (если нужно)
- [ ] **`isContainer`** — установлен `true`, если это контейнер
- [ ] **Название файла** добавлено в список `primitiveFiles` в `src/state/EditorContext.js`
- [ ] **Приложение перезапущено** и примитив появился в панели