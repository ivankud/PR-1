# Ключевые паттерны

## Добавление нового действия в reducer

1. Добавить case в `src/state/reducer.js`.
2. Если действие изменяет форму — использовать `pushHistory` (кроме `*_LIVE` действий).
3. Для `*_LIVE` действий (перемещение/ресайз) — не писать в историю, только `isDirty: true`.
4. После завершения drag/resize вызывать `COMMIT_HISTORY`.

### Пример
```js
case 'MY_ACTION': {
  if (!state.form) return state;
  const newForm = { ...state.form, ...action.updates };
  return pushHistory({ ...state, form: newForm, isDirty: true }, newForm);
}
```

## Добавление нового примитива

1. Создать шаблон в `public/primitives/<type>.json`.
2. Добавить имя файла в массив `primitiveFiles` в `EditorContext.js`.
3. При необходимости — добавить специальную обработку в `primitiveRenderer.js`.

## Работа с контекстом и якорями

- Якоря `{{path}}` резолвятся через `resolveTemplate` (utils/anchors.js).
- Контекст формы: `form.context.inline` (если `source === 'inline'`) или `form.context.loadedData`.
- Пользовательские функции компилируются через `new Function('context', code)`.

### Пример якоря
```
{{user.name}} → значение из контекста по пути user.name
```

## События

### События формы
```js
form.events = { onOpen: 'fnName', onSubmit: 'fnName' }
```

### События примитива
```js
primitive.events = { click: 'fnName', change: 'fnName' }
```

### Обработчики
- Создаются через `buildEventHandlersWithUpdate` (utils/functionRunner.js)
- Имя события преобразуется: `click` → `onClick`, `mouseenter` → `onMouseEnter`
- Функция получает контекст + данные события (`event`, `primitiveId`, `primitiveName`)
- Если функция возвращает объект — он применяется как обновлённый контекст

## История (undo/redo)

- Максимум 100 состояний
- `pushHistory(state, form)` — добавляет состояние в историю
- `*_LIVE` действия не пишут в историю
- `COMMIT_HISTORY` — коммит после drag/resize

## Работа с размерами

- Использовать `sizeUtils.js`, не хардкодить `px`
- Единицы: `px`, `%`, `vw`, `vh`, `auto`
- `updateSize` — обновление размера с сохранением единицы (мин. 10 для px)

## Авторизация

- Для запросов к API использовать `withAuthHeaders` из `utils/auth.js`
- Учётные данные хранятся в localStorage (Base64)
- `withAuthHeaders` не перезаписывает существующий `Authorization` заголовок

## Группировка/Разгруппировка

- `GROUP` — собирает выбранные примитивы (с детьми) в контейнер
- `UNGROUP` — перемещает детей контейнера в родителя с учётом смещения
- Выравнивание: `left`, `center-h`, `right`, `top`, `center-v`, `bottom`
- Распределение: `horizontal`, `vertical` (мин. 3 элемента)