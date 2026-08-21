# Компоненты (src/components/)

## Корневые компоненты

### App.js
- Роутинг: `/` (HomePage), `/editor`, `/editor/:formId`, `/forms/:formId`, `/login`
- Обёрнут в `EditorProvider`
- `AppLayout` — общий макет с постоянным `AppNav`

### AppNav.js
- Постоянное навигационное меню

### HomePage.js
- Список форм (главная страница)

### LoginPage.js
- Страница авторизации (сохранение логина/пароля через `utils/auth.js`)

### FormEditorRoute.js
- Обёртка редактора (загрузка формы по ID)

### FormPreviewRoute.js
- Обёртка предпросмотра готовой формы

### FormEditor.js
- Основной редактор: Canvas + LeftPanel + RightPanel + ActionBar

### FormPreview.js
- Предпросмотр формы

### FormMenu.js
- Меню форм

### ActionBar.js
- Панель действий: undo/redo, группировка, выравнивание

### AGTable.js
- Компонент таблицы AG Grid

### Splitter.js
- Разделитель панелей

## Canvas/

### Canvas.js
- Холст: рендер дерева примитивов, выделение, перемещение, зум

### CanvasPrimitive.js
- Отдельный примитив на холсте: drag, resize, select

## LeftPanel/

### LeftPanel.js
- Контейнер вкладок

### PrimitivesTab.js
- Список примитивов для добавления на холст

### LayersTab.js
- Дерево слоёв формы

### FunctionsTab.js
- Редактор пользовательских функций

## RightPanel/

### RightPanel.js
- Контейнер вкладок

### PropertiesForm.js
- Свойства выбранного примитива
- Кнопка удаления (✕) слева от каждого свойства — удаляет свойство из JSON (DELETE_PROPERTY)
- Кнопка удаления (✕) слева от каждого стиля — удаляет стиль из JSON (DELETE_STYLE)
- Критические свойства (id, type) не удаляются

### CssEditor.js
- Редактор CSS-стилей

### CustomProperties.js
- Пользовательские свойства

### EventsTab.js
- События примитива/формы

### JsonEditor.js
- Редактор JSON

### JsonDialog.js
- Диалог JSON