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