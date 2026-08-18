// Страница со всеми SVG-иконками и возможностью добавления своих
import React, { useState } from 'react';
import {
  getAllIcons,
  getCustomIcons,
  addCustomIcon,
  removeCustomIcon,
  IconSvg
} from '../utils/iconLibrary';

function IconsPage() {
  const [icons, setIcons] = useState(() => getAllIcons());
  const [customIcons, setCustomIcons] = useState(() => getCustomIcons());
  const [search, setSearch] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newSvg, setNewSvg] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  // Обновление списков после изменения пользовательских иконок
  const refresh = () => {
    setIcons(getAllIcons());
    setCustomIcons(getCustomIcons());
  };

  // Фильтрация по поиску
  const filteredIcons = icons.filter(icon =>
    icon.name.toLowerCase().includes(search.toLowerCase())
  );

  // Добавление новой иконки
  const handleAdd = () => {
    const trimmedName = newName.trim();
    const trimmedSvg = newSvg.trim();

    if (!trimmedName) {
      setError('Укажите название иконки');
      return;
    }
    if (!trimmedSvg) {
      setError('Вставьте SVG-код иконки');
      return;
    }
    // Проверка, что это похоже на SVG
    if (!trimmedSvg.includes('<svg') && !trimmedSvg.includes('<path') && !trimmedSvg.includes('<circle') && !trimmedSvg.includes('<rect') && !trimmedSvg.includes('<polygon') && !trimmedSvg.includes('<line') && !trimmedSvg.includes('<polyline')) {
      setError('Похоже, это не SVG-код. Вставьте разметку SVG (например, <path .../>)');
      return;
    }

    // Извлекаем внутреннюю разметку из полного <svg>...</svg>, если вставлен полный SVG
    let innerSvg = trimmedSvg;
    const svgMatch = trimmedSvg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (svgMatch) {
      innerSvg = svgMatch[1].trim();
    }

    addCustomIcon({ name: trimmedName, svg: innerSvg });
    setNewName('');
    setNewSvg('');
    setError('');
    setShowAddForm(false);
    refresh();
  };

  // Удаление пользовательской иконки
  const handleRemove = (id) => {
    removeCustomIcon(id);
    refresh();
  };

  // Копирование SVG-кода в буфер обмена
  const handleCopy = (icon) => {
    const fullSvg = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${icon.svg}</svg>`;
    navigator.clipboard.writeText(fullSvg)
      .then(() => {
        setCopiedId(icon.id);
        setTimeout(() => setCopiedId(null), 1500);
      })
      .catch(() => {});
  };

  return (
    <div className="icons-page">
      <div className="icons-page-header">
        <div>
          <h1>Библиотека иконок</h1>
          <p className="icons-page-subtitle">
            Всего иконок: {icons.length} (встроенных: {icons.length - customIcons.length}, своих: {customIcons.length})
          </p>
        </div>
        <div className="icons-page-actions">
          <button
            className="btn btn-primary"
            onClick={() => { setShowAddForm(!showAddForm); setError(''); }}
          >
            {showAddForm ? '✕ Отмена' : '＋ Добавить свою иконку'}
          </button>
        </div>
      </div>

      {/* Форма добавления своей иконки */}
      {showAddForm && (
        <div className="icons-add-form">
          <div className="icons-add-title">Добавление SVG-иконки</div>
          <div className="property-row">
            <label className="property-label">Название</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Например: Моя иконка"
            />
          </div>
          <div className="property-row property-row-column">
            <label className="property-label">SVG-код</label>
            <textarea
              className="icons-add-textarea"
              value={newSvg}
              onChange={(e) => setNewSvg(e.target.value)}
              rows={5}
              placeholder={'Вставьте SVG-разметку, например:\n<path d="M12 2 L22 22 H2 Z"/>'}
            />
          </div>
          {error && <div className="icons-add-error">{error}</div>}
          <div className="icons-add-actions">
            <button className="btn btn-primary" onClick={handleAdd}>Сохранить</button>
            <button className="btn" onClick={() => { setShowAddForm(false); setError(''); }}>Отмена</button>
          </div>
        </div>
      )}

      {/* Поиск */}
      <div className="icons-search">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Поиск иконок по названию..."
        />
      </div>

      {/* Сетка иконок */}
      <div className="icons-grid">
        {filteredIcons.length === 0 && (
          <div className="icons-empty">Иконки не найдены</div>
        )}
        {filteredIcons.map(icon => {
          const isCustom = icon.id.startsWith('custom-');
          return (
            <div key={icon.id} className="icon-card" title={icon.name}>
              <div className="icon-card-preview">
                <IconSvg icon={icon} size={32} />
              </div>
              <div className="icon-card-name">{icon.name}</div>
              <div className="icon-card-actions">
                <button
                  className="btn btn-sm"
                  onClick={() => handleCopy(icon)}
                  title="Скопировать SVG-код"
                >
                  {copiedId === icon.id ? '✓ Скопировано' : 'Копировать'}
                </button>
                {isCustom && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleRemove(icon.id)}
                    title="Удалить иконку"
                  >
                    Удалить
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default IconsPage;