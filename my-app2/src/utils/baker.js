// ============================================================================
// baker.js — «запекание» формы в пару самодостаточных исходных файлов
// ----------------------------------------------------------------------------
// Что делает:
//   bakeForm(form, options) превращает JSON-форму редактора в ДВА файла:
//
//   Файл №1 (BakedForm.jsx) — компонент формы, где ВСЁ выписано явно:
//     • пользовательские функции — как обычные объявления `function f(context){}`
//     • каждый примитив — как конкретный JSX-элемент со всеми свойствами
//       (можно открыть файл и поправить любое свойство/функцию вручную)
//     • инициализация контекста (inline/fetch) — в этом же файле
//
//   Файл №2 (bakedRuntime.js) — рантайм-пакет:
//     • AGTable (ag-grid) + FilterSelect + утилиты фильтров
//     • resolve-хелперы (resolveTemplate/resolveCondition/resolveConditionalValue)
//     • withAuthHeaders + window.getElementByName + window.fetchWithAuth
//     • IconSvg + только нужные иконки
//
// Генерация ничем не обязана редактору: bakeForm работает с чистыми данными
// формы и шаблоном примитива и возвращает текст двух файлов.
// ============================================================================

// ----------------------------------------------------------------------------
// Вспомогательные строковые / JSON-хелперы
// ----------------------------------------------------------------------------

// JSON-литерал для любого значения (строки, числа, объекта и т.д.)
function jsLiteral(v) {
  if (v === undefined) return 'undefined';
  return JSON.stringify(v);
}

// Безопасное имя идентификатора из строки (кириллица/пробелы не подходят — транслитерируем упрощённо)
function safeIdent(name, fallback) {
  let s = String(name || '').trim();
  // Транслитерация кириллицы → латиница (упрощённая)
  const map = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z',
    и: 'i', й: 'y', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r',
    с: 's', т: 't', у: 'u', ф: 'f', х: 'h', ц: 'c', ч: 'ch', ш: 'sh',
    щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
    А: 'A', Б: 'B', В: 'V', Г: 'G', Д: 'D', Е: 'E', Ё: 'E', Ж: 'Zh', З: 'Z',
    И: 'I', Й: 'Y', К: 'K', Л: 'L', М: 'M', Н: 'N', О: 'O', П: 'P', Р: 'R',
    С: 'S', Т: 'T', У: 'U', Ф: 'F', Х: 'H', Ц: 'C', Ч: 'Ch', Ш: 'Sh',
    Щ: 'Sch', Ъ: '', Ы: 'Y', Ь: '', Э: 'E', Ю: 'Yu', Я: 'Ya'
  };
  s = s.replace(/[а-яА-ЯёЁ]/g, (ch) => map[ch] || ch);
  s = s.replace(/[^A-Za-z0-9_$]/g, '_').replace(/^[^A-Za-z_$]/, '_');
  if (!s) s = fallback || '_';
  return s;
}

// CSS-значение размера с единицей (короткая копия логики sizeUtils.getWidthValue/getHeightValue)
function sizeValue(value, unit) {
  if (unit === 'auto') return 'auto';
  const v = value !== undefined && value !== null ? value : 100;
  return `${v}${unit || 'px'}`;
}

// Объект style со шириной/высотой
function sizeStyle(prim) {
  const w = prim.widthUnit === 'auto' ? 'auto' : sizeValue(prim.width, prim.widthUnit);
  const h = prim.heightUnit === 'auto' ? 'auto' : sizeValue(prim.height, prim.heightUnit);
  return { width: w, height: h };
}

// Canvas style (копия getCanvasSizeStyle)
function canvasSizeStyle(canvas) {
  const w = canvas.widthUnit === 'auto' ? 'auto' : sizeValue(canvas.width, canvas.widthUnit);
  const h = canvas.heightUnit === 'auto' ? 'auto' : sizeValue(canvas.height, canvas.heightUnit);
  return { width: w, height: h };
}

// Отступ в JSX-коде
function ind(n) { return '  '.repeat(n); }

// ----------------------------------------------------------------------------
// Разворачивание якорей {{path}} в JSX-выражения (Правило 4 — «живой» JSX)
// ----------------------------------------------------------------------------
// Стратегия:
//   1) строки без якорей  -> литерал ('Текст')
//   2) {{.}} / {{}}       -> JSON.stringify(context)
//   3) {{path}} в ВСЮ строку, и это НЕ свойство примитива -> context.a.b (живое)
//      если это свойство примитива ({{text}}, {{value}}...) -> разворачиваем значение примитива
//   4) частичные / многопроходные -> resolveTemplate('...', primJson, context) из рантайма
// ----------------------------------------------------------------------------

function hasAnchor(str) {
  return typeof str === 'string' && str.indexOf('{{') !== -1;
}

function isIdentPart(p) {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(p);
}

// JS-выражение пути доступа к контексту: context.rowT1.id
function ctxPathExpr(path) {
  const parts = String(path || '').split('.').filter(Boolean);
  if (!parts.length) return 'undefined';
  let out = 'context';
  for (const p of parts) out += isIdentPart(p) ? `.${p}` : `[${JSON.stringify(p)}]`;
  return out;
}

// JSON-литерал примитива для передачи в resolveTemplate (как аргумент primitive)
function primLiteral(prim) {
  if (!prim) return 'null';
  const keys = ['id','type','name','width','height','widthUnit','heightUnit','left','top',
    'style','customProperties','visible','text','value','placeholder','label','defaultValue',
    'inputType','readOnly','icon','iconSize','src','alt','checked','options','rows','cols',
    'title','dataSource','functionName','apiUrl','apiMethod','apiHeaders','useAuth',
    'serverPagination','apiDataPath','columnDefs','rowData','filterModel','pagination',
    'paginationPageSize','sortable','filterable','resizable','selectable','autoHeight'];
  const copy = {};
  for (const k of keys) { if (prim[k] !== undefined) copy[k] = prim[k]; }
  for (const k of Object.keys(prim)) {
    if (copy[k] === undefined &&
        (typeof prim[k] === 'string' || typeof prim[k] === 'number' || typeof prim[k] === 'boolean')) {
      copy[k] = prim[k];
    }
  }
  return JSON.stringify(copy);
}

// «Системные» свойства примитива (из primLiteral + position). Одиночный якорь
// на такое свойство ({{placeholder}}, {{name}}, {{inputType}}...) — это НЕ ссылка
// на данные контекста, а подстановка значения самого примитива.
const PRIM_SYS_PROPS = new Set([
  'id','type','name','width','height','widthUnit','heightUnit','left','top','position',
  'style','customProperties','visible','text','value','placeholder','label','defaultValue',
  'inputType','readOnly','icon','iconSize','src','alt','checked','options','rows','cols',
  'title','dataSource','functionName','apiUrl','apiMethod','apiHeaders','useAuth',
  'serverPagination','apiDataPath','columnDefs','rowData','filterModel','pagination',
  'paginationPageSize','sortable','filterable','resizable','selectable','autoHeight'
]);

// Превращает строку из JSON-формы в JS-выражение для вставки в JSX.
// Возвращает ТЕКСТ кода (без обёрток {}) — напр. "Кнопка" | 'context.field1.value'
function exprFor(str, prim) {
  if (typeof str !== 'string') return jsLiteral(str);

  // Весь текст — один якорь (например "{{field2.value}}")
  const whole = /^[\s]*\{\{([^{}]*)\}\}[\s]*$/.exec(str);
  if (whole) {
    const path = (whole[1] || '').trim();
    if (!path || path === '.') return 'JSON.stringify(context)';
    const firstKey = path.split('.')[0];
    // Если это свойство примитива ({{text}}, {{value}}, {{inputType}}...) —
    // разворачиваем фактическое значение примитива
    if (prim && prim[firstKey] !== undefined) {
      const v = prim[firstKey];
      if (typeof v === 'string' && hasAnchor(v)) return exprFor(v, prim);
      return jsLiteral(v);
    }
    // Псевдо-якорь на системное свойство примитива ({{placeholder}}, {{inputType}}...),
    // которого нет в конкретном примитиве. В редакторе/рантайме resolveTemplate такое
    // свойство, отсутствующее и в контексте, резолвится в ПУСТУЮ строку (''), а не в
    // «живой» context.path. Чтобы запечённый код вёл себя так же — отдаём пустую строку.
    if (firstKey && path.indexOf('.') === -1 && PRIM_SYS_PROPS.has(firstKey)) {
      return '""';
    }
    // Иначе — одиночный контекст-якорь остаётся «живым»: context.path
    return ctxPathExpr(path);
  }

  // Частичные / вложенные / многопроходные — передаём в реальный resolveTemplate из рантайма
  if (hasAnchor(str)) {
    return `resolveTemplate(${JSON.stringify(str)}, ${primLiteral(prim)}, context)`;
  }

  return JSON.stringify(str);
}

// То же для произвольного значения (может не быть строкой)
function valueExpr(value, prim) {
  if (typeof value === 'string') return exprFor(value, prim);
  return jsLiteral(value);
}

// ----------------------------------------------------------------------------
// Стили примитива (Правило 5 — повтор PreviewPrimitive)
// ----------------------------------------------------------------------------
// Возвращает: { styleCode: '...', cssVars: '...' }
//   cssVars — декларации let-переменных для условных стилей / видимости (если есть)
//   styleCode — JS-выражение объекта стиля (вставляется в style={{ ... }})
function buildStyle(prim) {
  const style = sizeStyle(prim); // { width, height }
  // копии prim.style
  if (prim.style && typeof prim.style === 'object') {
    for (const k of Object.keys(prim.style)) style[k] = prim.style[k];
  }
  // position (только если непустой/не undefined)
  if (prim.position) style.position = prim.position;
  // left / top — только заданные (числовые)
  if (prim.left !== undefined && prim.left !== null && prim.left !== '') style.left = prim.left;
  if (prim.top !== undefined && prim.top !== null && prim.top !== '') style.top = prim.top;
  // удаляем пустые left/top
  if (style.left === undefined || style.left === '') delete style.left;
  if (style.top === undefined || style.top === '') delete style.top;
  // Контейнерам не обрезаем дочерние
  if (prim.children && prim.children.length > 0) style.overflow = 'visible';

  const cssVars = [];
  const extraCode = []; // спреды в style (для условных значений)

  // Условные свойства (customProperties, где value.conditions — массив)
  const customProps = prim.customProperties || {};
  for (const key of Object.keys(customProps)) {
    if (key === 'visibility') continue;
    const val = customProps[key];
    if (val && typeof val === 'object' && Array.isArray(val.conditions)) {
      const varName = `css_${safeIdent(prim.id, 'p')}_${safeIdent(key, 'k')}`;
      cssVars.push(`const ${varName} = resolveConditionalValue(${JSON.stringify(val)}, context);`);
      extraCode.push(`${key}: ${varName}`);
    }
  }

  // Сборка кода объекта стиля
  let styleCode = '{';
  for (const k of Object.keys(style)) {
    styleCode += `\n${ind(2)}${JSON.stringify(k)}: ${JSON.stringify(style[k])},`;
  }
  for (const line of extraCode) styleCode += `\n${ind(2)}${line},`;
  styleCode += '\n  }';

  return { styleCode, cssVars };
}

// ----------------------------------------------------------------------------
// События примитива (Правило 6)
// ----------------------------------------------------------------------------
// Генерит JSX-props событий: onClick={...}, onChange={...} и т.д.
// Событие вызывает одноимённую функцию формы (fnName) напрямую и применяет
// возвращённый объект через handleContextUpdate.
function toReactEventName(eventName) {
  if (/^on[A-Z]/.test(eventName)) return eventName;
  return 'on' + eventName.charAt(0).toUpperCase() + eventName.slice(1);
}

// События AG Grid (передаются примитиву AGTable отдельными props)
const GRID_EVENTS = ['rowClicked', 'cellButtonClick', 'cellEvent'];
function gridPropName(evtName) {
  if (evtName === 'rowClicked') return 'onRowClicked';
  if (evtName === 'cellButtonClick') return 'onCellButtonClick';
  if (evtName === 'cellEvent') return 'onCellEvent';
  return toReactEventName(evtName);
}

function eventsProps(prim, depth) {
  const events = prim && prim.events ? prim.events : {};
  const keys = Object.keys(events);
  const props = [];
  const extraProps = [];
  if (!keys.length) return { props, extraProps };

  const depthTxt = ind(depth + 1);

  const makeBody = (fnName) => `${depthTxt}const c = {
${depthTxt}  ...context,
${depthTxt}  event: {
${depthTxt}    type: e && e.type,
${depthTxt}    target: e && e.target,
${depthTxt}    value: e && e.target ? e.target.value : undefined,
${depthTxt}    data: e && e.data,
${depthTxt}    rowIndex: e && e.rowIndex,
${depthTxt}    node: e && e.node
${depthTxt}  },
${depthTxt}  primitiveId: '${prim.id}',
${depthTxt}  primitiveName: ${JSON.stringify(prim.name || '')}
${depthTxt}};
${depthTxt}const result = ${fnName}(c);
${depthTxt}if (result && typeof result === 'object') handleContextUpdate(result);`;

  for (const evtName of keys) {
    const fnName = events[evtName];
    if (!fnName) continue;

    if (GRID_EVENTS.includes(evtName)) {
      // для AGTable — отдельный prop (обработчик передаёт событие грида)
      const gp = gridPropName(evtName);
      extraProps.push(`${gp}={(event) => {
${depthTxt}const c = {
${depthTxt}  event: {
${depthTxt}    data: event && event.data,
${depthTxt}    rowIndex: event && event.rowIndex,
${depthTxt}    node: event && event.node
${depthTxt}  },
${depthTxt}  primitiveId: '${prim.id}',
${depthTxt}  primitiveName: ${JSON.stringify(prim.name || '')}
${depthTxt}};
${depthTxt}const result = ${fnName}(c);
${depthTxt}if (result && typeof result === 'object') handleContextUpdate(result);
${depthTxt}}}`);
    } else {
      const propName = toReactEventName(evtName);
      props.push(`${propName}={(e) => {\n${makeBody(fnName)}\n${depthTxt}}}`);
    }
  }

  return { props, extraProps };
}

// ---------------------------------------------------------------
// Рендер одного примитива в явный JSX (Правило 1, 3, 6)
// ---------------------------------------------------------------
// Возвращает JSX-код примитива целиком с обёрткой <div ...>.
// Идеология: без map — каждый примитив и его свойства выписаны явно.

function getTemplate(primitives, type) {
  if (!primitives) return null;
  return primitives.find(p => p && p.type === type) || null;
}

// Иконки, реально использованные атрибутами (для рантайма)
const USED_ICONS = new Set();

// Генерация объекта style с учётом видимости.
// Возвращает { styleCode, cssVars }
function buildStyleBlock(prim) {
  const bs = buildStyle(prim);
  const cssVars = bs.cssVars.slice();
  let styleCode = bs.styleCode;
  const visExpr = prim.customProperties && prim.customProperties.visibility;
  if (visExpr) {
    const vn = `vis_${safeIdent(prim.id, 'p')}`;
    cssVars.push(`const ${vn} = resolveCondition(${JSON.stringify(visExpr)}, context);`);
    const spread = `...(${vn} ? {} : { display: 'none' })`;
    styleCode = styleCode.replace(/\n\s*}\s*$/, '\n  ' + spread + '\n  }');
  }
  return { styleCode, cssVars };
}

// Визуализация примитива целиком (обёртка + внутренность)
function renderPrimitive(prim, primitives, depth) {
  const st = buildStyleBlock(prim);
  const pad = ind(depth);
  const pad1 = ind(depth + 1);
  const inner = buildInnerElement(prim, primitives, depth + 1);
  const cssVars = st.cssVars.concat(inner.cssVars || []);

  return {
    code: `${pad}<div\n${pad1}style={${st.styleCode}}\n${pad1}data-primitive-id={${JSON.stringify(prim.id)}}\n${pad1}data-primitive-name={${JSON.stringify(prim.name || '')}}\n${pad}>\n${inner.markup}\n${pad}</div>`,
    cssVars
  };
}

// Построение содержимого примитива: внутренний элемент + его свойства
function buildInnerElement(prim, primitives, depth) {
  const template = getTemplate(primitives, prim.type);
  const render = template && template.render ? template.render : {};
  const tag = render.tag || 'div';
  const pad1 = ind(depth + 1);
  const pad2 = ind(depth + 2);
  const cssVars = [];
  const ev = eventsProps(prim, depth);

  const lines = [];
  const attrs = [];

  // ===== AGTable: отдельная ветка =====
  if (template && template.type === 'agtable') {
    const agProps = [];
    agProps.push(`primitive={${primLiteral(prim)}}`);
    agProps.push('context={context}');
    agProps.push('fns={fns}');
    for (const ep of ev.extraProps) agProps.push(ep);
    lines.push(`${pad1}<AGTable`);
    for (const p of agProps) lines.push(`${pad1}  ${p}`);
    lines.push(`${pad1}/>`);
    return { markup: lines.join('\n'), cssVars };
  }

  // ===== Атрибуты из шаблона =====
  if (render.attributes) {
    for (const key of Object.keys(render.attributes)) {
      if (key === 'readOnly') {
        let v = prim.readOnly;
        if (typeof v === 'string') v = v.toLowerCase() === 'true';
        attrs.push(`${key}={${JSON.stringify(v === true)}}`);
        continue;
      }
      if (key === 'type' && tag === 'input') {
        const t = prim.inputType || 'text';
        attrs.push(`type={${JSON.stringify(t)}}`);
        continue;
      }
      const expr = valueExpr(render.attributes[key], prim);
      attrs.push(`${key}={${expr}}`);
    }
  }

  // Поля ввода заполняют весь контейнер
  if (tag === 'input' || tag === 'textarea' || tag === 'select') {
    attrs.push(`style={{ width: '100%', height: '100%', boxSizing: 'border-box' }}`);
  }

  // defaultValue против value (как в renderPrimitive)
  if (tag === 'input' || tag === 'textarea') {
    const dv = typeof prim.defaultValue === 'string' ? prim.defaultValue : '';
    if (dv.trim() !== '' && dv.trim().startsWith('{{')) {
      // отключаем value, оставляем defaultValue
    }
  }

  // События — на сам элемент
  for (const p of ev.props) attrs.push(p);

  // ===== Иконка кнопки =====
  const iconLine = [];
  if (tag === 'button' && prim.icon) {
    USED_ICONS.add(prim.icon);
    iconLine.push(`${pad2}<IconSvg icon={${JSON.stringify(prim.icon)}} size={${prim.iconSize || 16}} color="currentColor" className="button-icon" />`);
  }

  // ===== Текст =====
  const textLine = [];
  if (render.text !== undefined) {
    textLine.push(`{${valueExpr(render.text, prim)}}`);
  }

  const VOID = ['input', 'img', 'br', 'hr', 'meta', 'link', 'source', 'col', 'area', 'base', 'embed'];
  const isVoid = VOID.includes(tag);
  const attrText = attrs.length ? '\n' + attrs.map(a => `${pad2}${a}`).join('\n') + `\n${pad1}` : '';
  lines.push(isVoid ? `${pad1}<${tag}${attrText} />` : `${pad1}<${tag}${attrText}>`);

  const content = [];
  if (iconLine.length) content.push(...iconLine);
  if (textLine.length) content.push(...textLine);

  // ===== Дочерние элементы из шаблона (checkbox/radio) =====
  if (render.children) {
    for (const cr of render.children) {
      const ca = [];
      for (const [k, v] of Object.entries(cr.attributes || {})) {
        ca.push(`${k}={${valueExpr(v, prim)}}`);
      }
      content.push(`${pad2}<${cr.tag} ${ca.join(' ')} />`);
    }
  }

  // ===== Опции select =====
  if (tag === 'select' && prim.options) {
    const opts = typeof prim.options === 'string'
      ? prim.options.split(',').map(s => s.trim()).filter(Boolean)
      : (Array.isArray(prim.options) ? prim.options : []);
    for (let i = 0; i < opts.length; i++) {
      content.push(`${pad2}<option key={${i}} value={${JSON.stringify(opts[i])}}>${opts[i]}</option>`);
    }
  }

  // ===== Таблица (render.table → rows × cols) =====
  if (tag === 'table' && render.table) {
    const rows = parseInt(prim.rows, 10) || 3;
    const cols = parseInt(prim.cols, 10) || 3;
    let data = null;
    const rawData = resolveTemplateStatic(render.table.data, prim);
    if (Array.isArray(rawData)) data = rawData;
    else if (typeof rawData === 'string' && rawData.startsWith('[')) {
      try { data = JSON.parse(rawData); } catch (e) { data = null; }
    }
    for (let r = 0; r < rows; r++) {
      const tds = [];
      for (let c = 0; c < cols; c++) {
        const cell = data && data[r] ? (data[r][c] !== undefined && data[r][c] !== null ? String(data[r][c]) : '') : '';
        tds.push(`${pad2}<td key={${c}} style={{ border: '1px solid #ccc', padding: '4px 8px' }}>${JSON.stringify(cell)}</td>`);
      }
      content.push(`${pad1}<tr key={${r}}>`);
      content.push(...tds);
      content.push(`${pad1}</tr>`);
    }
  }

  // ===== Вложенные примитивы-дети (контейнеры) =====
  if (prim.children && prim.children.length > 0) {
    for (const ch of prim.children) {
      const rc = renderPrimitive(ch, primitives, depth);
      content.push(rc.code);
      cssVars.push(...rc.cssVars);
    }
  }

  // ===== Завершение сборки содержимого =====
  if (!isVoid) {
    if (!content.length) {
      lines.push(`${pad1}</${tag}>`);
    } else {
      for (const cl of content) lines.push(cl);
      lines.push(`${pad1}</${tag}>`);
    }
  }

  return { markup: lines.join('\n'), cssVars };
}

// Разрешение статического (не-якорного) значения для таблицы
function resolveTemplateStatic(raw, prim) {
  if (typeof raw !== 'string' || !hasAnchor(raw)) return raw;
  // в запечённом виде табличные данные статичны из примитива
  return raw.replace(/\{\{([^}]+)\}\}/g, (m, path) => {
    const tp = path.trim();
    if (prim && prim[tp] !== undefined) return String(prim[tp]);
    return '';
  });
}

// ----------------------------------------------------------------------------
// Пользовательские функции (Правило 1, п.3): каждую fn → явная function name(context)
// ----------------------------------------------------------------------------
function buildFunctionsBlock(form) {
  const fns = form && form.functions ? form.functions : [];
  if (!fns.length) return { code: '// Пользовательские функции отсутствуют\n', names: [] };

  const lines = [];
  lines.push('// ===== Пользовательские функции формы =====');

  const flatten = [];
  const gather = (arr) => {
    for (const fn of arr || []) {
      if (!fn || !fn.name) continue;
      flatten.push(fn);
      if (fn.functions && fn.functions.length) gather(fn.functions);
    }
  };
  gather(fns);

  for (const fn of flatten) {
    lines.push(`function ${fn.name}(context) {`);
    const body = (fn.code || '').replace(/\r\n/g, '\n');
    const bodyLines = body.split('\n').map(l => (l.trim() === '' ? '' : '  ' + l));
    lines.push(...bodyLines);
    lines.push('}');
    lines.push('');
  }

  // объект fns для AGTable-источников данных и для прямого вызова по имени
  const names = flatten.map(f => f.name);
  lines.push('// Объект-карта функций (нужен AGTable с dataSource = "function")');
  lines.push('const fns = {');
  for (const n of names) lines.push(`  ${n},`);
  lines.push('};');

  return { code: lines.join('\n'), names };
}

// ----------------------------------------------------------------------------
// Инициализация контекста (Правило 2)
// ----------------------------------------------------------------------------
function buildContextInit(form) {
  const context = form && form.context ? form.context : {};
  const source = context.source || 'inline';
  const lines = [];

  if (source === 'inline') {
    lines.push('// Начальный контекст формы (inline)');
    lines.push(`const INITIAL_CONTEXT = ${JSON.stringify(context.inline || {}, null, 2)};`);
  } else {
    // url/fetch
    lines.push(`const CONTEXT_URL = ${JSON.stringify(context.url || '')};`);
    lines.push('const INITIAL_CONTEXT = {};');
  }

  const openFn = form && form.events && form.events.onOpen;
  const loadFn = form && form.events && form.events.onLoad;
  const submitFn = form && form.events && form.events.onSubmit;

  return {
    source,
    url: context.url || '',
    openFn,
    loadFn,
    submitFn,
    code: lines.join('\n')
  };
}

// ----------------------------------------------------------------------------
// Генератор Файла №1 — компонент формы BakedForm (Правило 1, 2, 3)
// ----------------------------------------------------------------------------
function buildFormFile(form, primitives, options) {
  const funcs = buildFunctionsBlock(form);
  const ctx = buildContextInit(form);

  const L = [];
  L.push('// ===========================================================================');
  L.push(`// Запечённая форма: ${form.name || form.id || 'форма'}`);
  L.push('// Файл №1 — компонент формы. Все функции и примитивы выписаны ЯВНО.');
  L.push('// Для запуска нужен Файл №2 (bakedRuntime) — импорт ниже.');
  L.push('// ===========================================================================');
  L.push(`import React, { useState, useEffect } from 'react';`);
  L.push(`import {`);
  L.push(`  AGTable,`);
  L.push(`  IconSvg,`);
  L.push(`  resolveTemplate,`);
  L.push(`  resolveCondition,`);
  L.push(`  resolveConditionalValue`);
  L.push(`} from './bakedRuntime';`);
  L.push('');
  L.push(funcs.code);
  L.push('');
  L.push(ctx.code);
  L.push('');
  L.push('export default function BakedForm() {');
  L.push('  const [context, setContext] = useState(INITIAL_CONTEXT);');
  L.push('  const [loading, setLoading] = useState(false);');
  L.push('  const [error, setError] = useState(null);');
  L.push('  const handleContextUpdate = (newContext) => {');
  L.push('    if (!newContext || typeof newContext !== \'object\') return;');
  L.push('    const { event, primitiveId, primitiveName, ...clean } = newContext;');
  L.push('    setContext(prev => ({ ...prev, ...clean }));');
  L.push('  };');
  L.push('');
  return L;
}

// ----------------------------------------------------------------------------
// Генератор Файла №2 — рантайм-пакет (AGTable, FilterSelect, хелперы, иконки)
// ----------------------------------------------------------------------------
// Пути импортов зависят от места сохранения запечённых файлов и задаются опциями
// componentsDir / utilsDir (объяснение в bakeForm). По умолчанию считается, что
// оба файла (BakedForm.jsx и bakedRuntime.js) лежат в дочерней папке src/
// (напр. src/newFolder), поэтому общие каталоги проекта поднимаются на уровень выше.
function buildRuntimeFile(usedIcons, componentsDir, utilsDir) {
  const cBase = componentsDir || '../components';
  const uBase = utilsDir || '../utils';
  return [
    '// ==========================================================================',
    '// Файл №2 — рантайм-пакет для запечённой формы (BakedForm).',
    '// Содержит AGTable, FilterSelect, resolve-хелперы, иконки и авторизацию.',
    `// Пути импортов: components и utils резолвятся из "${cBase}" / "${uBase}".`,
    '// Для переноса в другой проект рядом скопируйте AGTable.js, FilterSelect.js,',
    '// filterUtils.js, iconLibrary.js, auth.js и установите пакеты ag-grid/json5.',
    '// ==========================================================================',
    `import React from 'react';`,
    `import AGTable from '${cBase}/AGTable';`,
    `import FilterSelect from '${cBase}/FilterSelect';`,
    `import { resolveTemplate, resolveCondition, resolveConditionalValue } from '${uBase}/anchors';`,
    `import { withAuthHeaders } from '${uBase}/auth';`,
    `import { IconSvg, getIconById } from '${uBase}/iconLibrary';`,
    `export { AGTable, FilterSelect, IconSvg, getIconById, resolveTemplate, resolveCondition, resolveConditionalValue, withAuthHeaders };`,
    ''
  ].join('\n');
}

// Сбор всех объявлений css-переменных (resolveCondition / resolveConditionalValue)
function collectCssVars(children) {
  const out = [];
  const walk = (list) => {
    for (const ch of list || []) {
      out.push(...buildStyleBlock(ch).cssVars);
      if (ch.children) walk(ch.children);
    }
  };
  walk(children);
  return out;
}

// ----------------------------------------------------------------------------
// Точка входа: bakeForm(form, options) → { file1, file2, name }
// ----------------------------------------------------------------------------
export function bakeForm(form, options) {
  const prims = (options && options.primitives) || [];
  // Каталоги, из которых запечённый рантайм импортирует компоненты и утилиты.
  // По умолчанию запечённые файлы кладутся в дочернюю папку src/ (напр. src/newFolder),
  // поэтому общие каталоги — на уровень выше: '../components' и '../utils'.
  // При другом месте сохранения передайте options.componentsDir / options.utilsDir.
  const componentsDir = (options && options.componentsDir) || '../components';
  const utilsDir = (options && options.utilsDir) || '../utils';

  // Голова Файла №1 (шапка, функции, контекст, состояние)
  const head = buildFormFile(form, prims, options);
  const ctx = buildContextInit(form);
  const openFn = ctx.openFn;
  const loadFn = ctx.loadFn;
  const submitFn = ctx.submitFn;

  // css-переменные (объявления const ... = resolveCondition/resolveConditionalValue)
  const cssVars = collectCssVars(form.children || []);

  // useEffect загрузки контекста + onOpen/onLoad
  const fx = [];
  fx.push('  // Загрузка контекста (inline / url) и события onOpen/onLoad');
  fx.push('  useEffect(() => {');
  if (ctx.source === 'url') {
    // url/source: подключаем fetch загрузку контекста
    fx.push(`    const src = ${JSON.stringify(ctx.source)};`);
  }
  fx.push('    let cancelled = false;');
  fx.push('    (async () => {');
  fx.push('      let data = INITIAL_CONTEXT;');
  if (ctx.source === 'url') {
    // Источник url: CONTEXT_URL объявлена в buildContextInit, поэтому обращение безопасно
    fx.push('      if (src === \'url\' && CONTEXT_URL) {');
    fx.push('        setLoading(true); setError(null);');
    fx.push('        try {');
    fx.push('          const res = await fetch(CONTEXT_URL);');
    fx.push('          if (!res.ok) throw new Error(\'HTTP \' + res.status);');
    fx.push('          const json = await res.json();');
    fx.push('          if (!cancelled) { data = json; setContext(json); }');
    fx.push('        } catch (e) {');
    fx.push('          if (!cancelled) setError(\'Ошибка загрузки контекста: \' + e.message);');
    fx.push('        } finally { if (!cancelled) setLoading(false); }');
    fx.push('      }');
    fx.push('');
  }
  if (openFn) {
    fx.push(`      // onOpen`);
    fx.push(`      if (typeof fns[${JSON.stringify(openFn)}] === 'function') {`);
    fx.push(`        const r = fns[${JSON.stringify(openFn)}](data);`);
    fx.push('        if (r && typeof r === \'object\') data = { ...data, ...r };');
    fx.push('      }');
    fx.push('');
  }
  if (loadFn) {
    fx.push(`      // onLoad`);
    fx.push(`      if (typeof fns[${JSON.stringify(loadFn)}] === 'function') {`);
    fx.push(`        const r = fns[${JSON.stringify(loadFn)}](data);`);
    fx.push('        if (r && typeof r === \'object\') data = { ...data, ...r };');
    fx.push('      }');
    fx.push('');
  }
  fx.push('      if (!cancelled && data !== INITIAL_CONTEXT) setContext(data);');
  fx.push('    })();');
  fx.push('    return () => { cancelled = true; };');
  fx.push('    // eslint-disable-next-line react-hooks/exhaustive-deps');
  fx.push('  }, []);');
  fx.push('');

  // Дети формы (явный JSX)
  const bodyChildren = (form.children || []).map(ch => {
    const r = renderPrimitive(ch, prims, 1);
    return r.code;
  }).join('\n\n');

  // JSX-форма
  const canvas = form.canvas || {};
  const formStyle = JSON.stringify({
    ...canvasSizeStyle(canvas),
    backgroundColor: canvas.backgroundColor || '#ffffff',
    position: 'relative'
  });

  const jsx = [];
  jsx.push('  return (');
  jsx.push('    <div className="form-preview">');
  jsx.push('      {error && <div className="preview-error">{error}</div>}');
  jsx.push('      {loading && <div className="preview-loading">Загрузка контекста...</div>}');
  jsx.push(`      <form className="preview-form" style={${formStyle}} onSubmit={(e) => {`);
  jsx.push('        e.preventDefault();');
  if (submitFn) {
    jsx.push(`        if (typeof fns[${JSON.stringify(submitFn)}] === 'function') {`);
    jsx.push(`          const r = fns[${JSON.stringify(submitFn)}](context);`);
    jsx.push('          if (r && typeof r === \'object\') handleContextUpdate(r);');
    jsx.push('        }');
  }
  jsx.push('      }}>');
  jsx.push(bodyChildren);
  jsx.push('      </form>');
  jsx.push('    </div>');
  jsx.push('  );');
  jsx.push('}');
  jsx.push('');

  // Склейка Файла №1
  const file1 = head
    .concat(fx)
    .concat(cssVars.length ? ['', ...cssVars.map(v => '  ' + v)] : [])
    .concat(jsx)
    .join('\n');

  const file2 = buildRuntimeFile(
    Array.from((typeof USED_ICONS !== 'undefined' ? USED_ICONS : new Set())),
    componentsDir,
    utilsDir
  );

  return {
    file1,
    file2,
    name: safeIdent(form.name || form.id || 'form', 'form'),
    runtimeName: 'bakedRuntime'
  };
}
