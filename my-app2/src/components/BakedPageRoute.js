// Страница-обёртка сгенерированной страницы (src/baked/{n}/)
// Загружает компонент страницы через реестр и рендерит его с метаданными.
import React, { useState, useEffect, createElement } from 'react';
import { useParams, Link } from 'react-router-dom';
import { loadBakedPage, listBakedPages } from '../baked/pagesRegistry';

function BakedPageRoute() {
  const { pageFolder } = useParams();
  const [Page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Метаданные страницы (имя для заголовка)
  const meta = listBakedPages().find(p => p.folder === pageFolder) || null;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPage(null);

    loadBakedPage(pageFolder)
      .then(Component => {
        if (cancelled) return;
        if (!Component) {
          setError(`Страница «${pageFolder}» не найдена в каталоге src/baked/`);
        } else {
          setPage(() => Component);
        }
      })
      .catch(e => {
        if (!cancelled) setError('Не удалось загрузить страницу: ' + e.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [pageFolder]);

  if (loading) {
    return <div className="route-loading centered">Загрузка сгенерированной страницы...</div>;
  }

  if (error) {
    return (
      <div className="route-empty">
        <h2>Ошибка</h2>
        <p>{error}</p>
        <Link to="/pages" className="btn btn-primary">🗂️ К списку страниц</Link>
      </div>
    );
  }

  return (
    <div className="baked-page-route">
      <div className="preview-bar">
        <Link to="/pages" className="btn btn-secondary" title="К списку сгенерированных страниц">
          ← Страницы
        </Link>
        <span className="preview-title">🗂️ {meta ? meta.name : pageFolder}</span>
        <span className="preview-badge">Сгенерированная страница</span>
        <span className="baked-page-folder" title="Каталог страницы">src/baked/{pageFolder}/</span>
      </div>
      <div className="baked-page-container">
        {Page ? createElement(Page) : null}
      </div>
    </div>
  );
}

export default BakedPageRoute;
