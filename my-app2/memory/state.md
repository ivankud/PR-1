# Управление состоянием

## EditorContext.js

Провайдер контекста редактора. Экспортирует `useEditor()`.

### Ответственность
- Загрузка шаблонов примитивов из `/primitives/*.json` при монтировании
- Обработка горячих клавиш (Ctrl+Z, Ctrl+Y, Delete)
- Экспорт `useEditor()` хука

### primitiveFiles (массив шаблонов)
```
button, text, input, textarea, container, image, checkbox, radio, select, table, agtable
```

### Горячие клавиши
| Клавиша | Действие |
|---------|----------|
| Ctrl+Z | UNDO |
| Ctrl+Y / Ctrl+Shift+Z | REDO |
| Delete | DELETE_SELECTED |

## reducer.js

Все действия редактора. История — до 100 состояний.

### Действия
| Действие | Описание | История |
|----------|----------|---------|
| LOAD_FORM | Загрузка формы | Сброс истории |
| LOAD_PRIMITIVES | Загрузка шаблонов | Нет |
| ADD_PRIMITIVE | Добавление примитива | pushHistory |
| MOVE_PRIMITIVES | Перемещение (коммит) | pushHistory |
| MOVE_PRIMITIVES_LIVE | Живое перемещение | Нет (isDirty) |
| RESIZE_PRIMITIVE | Ресайз (коммит) | pushHistory |
| RESIZE_PRIMITIVE_LIVE | Живой ресайз | Нет (isDirty) |
| COMMIT_HISTORY | Коммит после drag/resize | pushHistory |
| SELECT | Выделение | Нет |
| SELECT_MULTIPLE | Множественное выделение | Нет |
| CLEAR_SELECTION | Сброс выделения | Нет |
| DELETE_SELECTED | Удаление выделенных | pushHistory |
| UPDATE_PROPERTY | Обновление свойства | pushHistory |
| UPDATE_STYLE | Обновление стилей | pushHistory |
| UPDATE_JSON | Обновление JSON примитива | pushHistory |
| UPDATE_FORM | Обновление формы | pushHistory |
| GROUP | Группировка | pushHistory |
| UNGROUP | Разгруппировка | pushHistory |
| ALIGN | Выравнивание | pushHistory |
| DISTRIBUTE | Распределение | pushHistory |
| UNDO | Отмена | — |
| REDO | Повтор | — |
| SET_ZOOM | Зум | Нет |
| SET_DIRTY | Флаг изменений | Нет |
| ADD_FUNCTION | Добавление функции | pushHistory |
| UPDATE_FUNCTION | Обновление функции | pushHistory |
| DELETE_FUNCTION | Удаление функции | pushHistory |
| UPDATE_FORM_EVENT | Событие формы | pushHistory |
| UPDATE_PRIMITIVE_EVENT | Событие примитива | pushHistory |

### Вспомогательные функции
- `pushHistory(state, form)` — добавление состояния в историю (макс. 100)
- `updatePrimitiveInTree(node, id, updater)` — рекурсивное обновление примитива
- `removePrimitiveFromTree(node, id)` — рекурсивное удаление примитива
- `collectWithChildren(node, ids, result)` — сбор примитивов с детьми (для группировки)

### Начальное состояние
```js
{
  form: null,
  primitives: [],
  selectedIds: [],
  zoom: 1,
  history: [],
  historyIndex: -1,
  isDirty: false
}
```
