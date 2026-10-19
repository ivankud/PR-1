// Страница со списком сгенерированных страниц (src/baked/{n}/).
// Список образует каталог генерации: каждая страница открывается отдельным маршрутом.
import React, { useState, useEffect, createElement } from 'react';
import { Link } from 'react-router-dom';
import { listBakedPages, loadBakedPage } from '../baked/pagesRegistry';

function GeneratedPagesList() {
  const pages = listBakedPages();
  // Предпросмотр выбранной страницы прямо в списке
  const [previewFolder, setPreviewFolder] = useState(null);
  const [PreviewPage, setPreviewPage] = useState(null);
  const [previewError, setPreviewError] = useState(null);

  useEffect(() => {
    if (!previewFolder) {
      setPreviewPage(null);
      return;
    }
    let cancelled = false;
    setPreviewError(null);
    setPreviewPage(null);

    loadBakedPage(previewFolder)
      .then(Component => {
        if (cancelled) return;
        if (!Component) {
          setPreviewError(`Страница «${previewFolder}» не найдена`);
        } else {
          setPreviewPage(() => Component);
        }
      })
      .catch(e => {
        if (!cancelled) setPreviewError('Ошибка загрузки страницы: ' + e.message);
      });

    return () => { cancelled = true; };
  }, [previewFolder]);

  return (
    <div className="pages-list">
      <header className="form-menu-header">
        <h1>Сгенерированные страницы</h1>
        <div className="form-menu-actions">
          <Link to="/" className="btn btn-secondary" title="К исходным формам">
            📋 Исходные формы
          </Link>
        </div>
      </header>

      {pages.length === 0 && (
        <div className="form-list-empty">
          Сгенерированных страниц нет. Откройте форму в редакторе, выберите
          «⚙️ Сгенерировать страницу» и сохраните каталог в <code>src/baked/</code>.
        </div>
      )}

      {pages.length > 0 && (
        <div className="form-list">
          {pages.map(page => (
            <div key={page.folder} className="form-card">
              <div className="form-card-icon">🗂️</div>
              <div className="form-card-info">
                <div className="form-card-name">{page.name}</div>
                <div className="form-card-meta">
                  src/baked/{page.folder}/
                  {page.generatedAt ? ` · ${page.generatedAt.slice(0, 10)}` : ''}
                </div>
              </div>
              <div className="form-card-actions">
                <Link
                  to={`/pages/${encodeURIComponent(page.folder)}`}
                  className="btn btn-secondary"
                  title={`Открыть страницу «${page.name}»`}
                >
                  Открыть
                </Link>
                <button
                  className="btn btn-secondary"
                  onClick={() => setPreviewFolder(page.folder)}
                  title="Показать страницу на этой же странице"
                >
                  👁 Предпросмотр
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {previewFolder && (
        <div className="pages-preview">
          <div className="preview-bar">
            <span className="preview-title">
              {pages.find(p => p.folder === previewFolder)?.name || previewFolder}
            </span>
            <span className="preview-badge">Предпросмотр</span>
            <button className="btn btn-secondary" onClick={() => setPreviewFolder(null)}>
              ✖ Закрыть
            </button>
          </div>
          {previewError && <div className="preview-error">{previewError}</div>}
          <div className="baked-page-container">
            {PreviewPage ? createElement(PreviewPage) : null}
          </div>
        </div>
      )}

      <footer className="form-menu-footer">
        <p>
          Сгенерированные страницы хранятся в <code>src/baked/&#123;n&#125;/</code>:
          компонент страницы, метаданные <code>page.js</code>, модуль импортов
          <code>*.imports.js</code> и объединённые стили <code>page.css</code>.
          Реестр страниц — <code>src/baked/pagesRegistry.js</code>.
        </p>
      </footer>
    </div>
  );
}

export default GeneratedPagesList;
