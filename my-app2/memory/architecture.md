# Архитектура проекта

## Общее описание

Проект — **React-приложение (Create React App)** для визуального редактора веб-форм. Данные форм хранятся в виде JSON-файлов в `public/forms/`, шаблоны примитивов — в `public/primitives/`.

## Стек

- React 18 (функциональные компоненты, хуки)
- React Router v6 (роутинг)
- React Context + useReducer (управление состоянием)
- Чистый CSS (без CSS-фреймворков)

## Слои приложения

```
src/
├── App.js                    # Корневой компонент: роутинг + EditorProvider
├── state/                    # Управление состоянием
│   ├── EditorContext.js      # React Context: useReducer, загрузка примитивов, горячие клавиши
│   └── reducer.js            # Все действия редактора
├── utils/                    # Чистые утилиты (без JSX)
│   ├── jsonUtils.js          # Базовые JSON-операции
│   ├── anchors.js            # Подстановка {{path}} якорей
│   ├── primitiveRenderer.js  # Рендер примитивов (содержит JSX)
│   ├── functionRunner.js     # Компиляция/вызов пользовательских функций
│   ├── formLoader.js         # Загрузка форм
│   ├── functionStore.js      # Загрузка/скачивание функций из public/functions/
│   ├── sizeUtils.js          # Работа с размерами и единицами измерения
│   └── auth.js               # Basic Auth
└── components/               # UI-компоненты
    ├── AppNav.js             # Постоянное навигационное меню
    ├── HomePage.js           # Список форм
    ├── LoginPage.js          # Страница авторизации
    ├── FormEditorRoute.js    # Обёртка редактора
    ├── FormPreviewRoute.js   # Обёртка предпросмотра
    ├── FormEditor.js         # Основной редактор
    ├── FormPreview.js        # Предпросмотр формы
    ├── FormMenu.js           # Меню форм
    ├── ActionBar.js          # Панель действий
    ├── AGTable.js            # Таблица AG Grid
    ├── Splitter.js           # Разделитель панелей
    ├── Canvas/               # Холст редактора
    ├── LeftPanel/            # Левая панель
    └── RightPanel/           # Правая панель
```

## Публичные данные

- `public/forms/index.json` — манифест форм
- `public/forms/*.json` — JSON-файлы форм
- `public/primitives/*.json` — шаблоны примитивов (button, text, input, textarea, container, image, checkbox, radio, select, table, agtable)
- `public/functions/index.json` — манифест хранилища функций (`{ functions: [...] }`)
- `public/functions/*.json` — файлы функций `{ name, description, code }`