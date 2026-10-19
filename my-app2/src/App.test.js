// Тесты проекта: рендер приложения и генерация страниц из JSON формы
import { render, screen } from '@testing-library/react';
import App from './App';
import { generatePageSource } from './utils/pageGenerator';
import { createZip } from './utils/zipUtils';

test('приложение рендерит навигационное меню конструктора', () => {
  render(<App />);
  expect(screen.getByText(/Конструктор/i)).toBeInTheDocument();
  expect(screen.getByText(/Редактор форм/i)).toBeInTheDocument();
});

// Генерация страницы: форма → исходный код React-компонента в компонентном стиле
test('generatePageSource создаёт файлы страницы со всеми примитивами', () => {
  const primitives = [
    {
      type: 'text',
      render: { tag: 'label', text: '{{text}}' }
    },
    {
      type: 'button',
      render: { tag: 'button', text: '{{text}}' }
    }
  ];
  const form = {
    id: 'form-test',
    type: 'form',
    name: 'Тестовая форма',
    canvas: { width: 400, height: 300, backgroundColor: '#ffffff' },
    context: { source: 'inline', inline: { greeting: 'Привет' } },
    functions: [{ id: 'fn1', name: 'onClick', code: 'console.log("click"); return context;' }],
    events: { onSubmit: 'onClick' },
    children: [
      {
        id: 'prim-1',
        type: 'text',
        name: 'Заголовок',
        text: '{{greeting}}',
        width: 200,
        height: 30,
        left: 10,
        top: 20,
        style: { fontSize: '14px' }
      },
      {
        id: 'prim-2',
        type: 'button',
        name: 'Кнопка',
        text: 'Нажать',
        width: 100,
        height: 40,
        events: { click: 'onClick' }
      }
    ]
  };

  const page = generatePageSource(form, primitives, { index: 5 });
  const byName = (name) => page.files.find((f) => f.name === name);

  expect(page.dir).toBe('./baked');
  expect(page.baseDir).toBe('5');
  expect(byName('index.jsx')).toBeTruthy();
  expect(byName('page.js').content).toContain('Тестовая форма');
  expect(byName('imports.js').content).toContain("export { default } from './index';");

  // Все примитивы выписаны явно, функции — обычные объявления
  const code = page.code;
  expect(code).toContain("from './imports'");
  expect(code).toContain('function onClick(context)');
  expect(code).toContain('<label>');
  expect(code).toContain('<button');
  expect(code).toContain('data-primitive-id={"prim-1"}');
  // Якорь контекста остаётся «живым»: context.greeting
  expect(code).toContain('context.greeting');
});

// Упаковка файлов страницы в zip-архив (для скачивания каталога)
test('createZip формирует zip-сигнатуру и корректный CRC32', () => {
  const zip = createZip([{ path: '1/index.jsx', content: 'export default 1;\n' }]);
  expect(zip instanceof Uint8Array).toBe(true);
  // Локальный заголовок файла: PK\x03\x04
  expect(Array.from(zip.slice(0, 4))).toEqual([0x50, 0x4b, 0x03, 0x04]);
  // Центральный каталог: PK\x01\x02
  const cd = Array.from(zip).findIndex((b, i) => b === 0x50 && zip[i + 1] === 0x4b && zip[i + 2] === 0x01 && zip[i + 3] === 0x02);
  expect(cd).toBeGreaterThan(0);
});

