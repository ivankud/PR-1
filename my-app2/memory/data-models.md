# Модели данных

## Структура JSON формы

```json
{
  "id": "form-...",
  "type": "form",
  "name": "Название формы",
  "canvas": {
    "width": 800,
    "height": 600,
    "backgroundColor": "#ffffff",
    "gridSize": 10,
    "showGrid": true
  },
  "context": {
    "source": "inline",
    "url": "",
    "inline": {}
  },
  "onOpen": {
    "type": "loadContext",
    "params": {}
  },
  "functions": [],
  "events": {},
  "children": []
}
```

### Поля формы
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный ID (`form-...`) |
| `type` | string | Всегда `"form"` |
| `name` | string | Название формы |
| `canvas` | object | Настройки холста (width, height, backgroundColor, gridSize, showGrid) |
| `context` | object | Контекст: `source` (inline/url), `url`, `inline` |
| `onOpen` | object | Действие при открытии (`type: "loadContext"`) |
| `functions` | array | Пользовательские функции |
| `events` | object | События формы: `{ onOpen: 'fnName', onSubmit: 'fnName' }` |
| `children` | array | Дочерние примитивы |

## Структура JSON примитива

```json
{
  "id": "prim-...",
  "type": "button",
  "name": "Кнопка",
  "width": 100,
  "height": 40,
  "widthUnit": "px",
  "heightUnit": "px",
  "left": 0,
  "top": 0,
  "style": {},
  "customProperties": {},
  "children": [],
  "events": {}
}
```

### Поля примитива
| Поле | Тип | Описание |
|------|-----|----------|
| `id` | string | Уникальный ID (`prim-...`) |
| `type` | string | Тип примитива (button, text, input, ...) |
| `name` | string | Название |
| `width` | number | Ширина |
| `height` | number | Высота |
| `widthUnit` | string | Единица ширины: `px`, `%`, `vw`, `vh`, `auto` |
| `heightUnit` | string | Единица высоты |
| `left` | number | Позиция X |
| `top` | number | Позиция Y |
| `style` | object | CSS-стили (camelCase) |
| `customProperties` | object | Пользовательские свойства |
| `children` | array | Дочерние примитивы (для контейнеров) |
| `events` | object | События: `{ click: 'fnName', change: 'fnName' }` |

## Шаблоны примитивов (public/primitives/)

Доступные типы: `button`, `text`, `input`, `textarea`, `container`, `image`, `checkbox`, `radio`, `select`, `table`, `agtable`.

### Структура шаблона
```json
{
  "type": "button",
  "name": "Кнопка",
  "isContainer": false,
  "defaults": {
    "width": 100,
    "height": 40,
    "style": {}
  },
  "render": {
    "tag": "button",
    "text": "Кнопка",
    "attributes": {}
  },
  "anchors": []
}
```

### Поля шаблона
| Поле | Описание |
|------|----------|
| `type` | Тип примитива |
| `name` | Отображаемое имя |
| `isContainer` | true — может содержать детей |
| `defaults` | Значения по умолчанию (width, height, style) |
| `render` | Описание рендера: `tag`, `text`, `attributes`, `children`, `options`, `table` |
| `anchors` | Список якорей для подстановки |

## Контекст формы

- `source === 'inline'` → контекст из `form.context.inline`
- `source === 'url'` → контекст из `form.context.loadedData` (загружается через `onOpen`)

## Пользовательские функции

```json
{
  "id": "fn-...",
  "name": "myFunction",
  "code": "// код функции\ncontext.value = 42;"
}
```

- Компилируются через `new Function('context', code)`
- Вызываются с объектом `context` (данные формы)
- Могут возвращать обновлённый контекст (применяется через `onUpdateContext`)