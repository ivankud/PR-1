// Страница авторизации для сохранения логина и пароля,
// которые используются при запросах к API
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getCredentials,
  saveCredentials,
  clearCredentials,
  hasCredentials
} from '../utils/auth';

function LoginPage() {
  const navigate = useNavigate();

  // Состояние формы
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saved, setSaved] = useState(hasCredentials());

  // Показываем сохранённые данные при открытии
  React.useEffect(() => {
    const credentials = getCredentials();
    if (credentials) {
      setLogin(credentials.login);
      // Пароль не заполняем в поле по соображениям безопасности,
      // но показываем, что он сохранён
    }
  }, []);

  // Обработчик сохранения
  const handleSave = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!login.trim()) {
      setError('Введите логин');
      return;
    }
    if (!password) {
      setError('Введите пароль');
      return;
    }

    try {
      saveCredentials(login.trim(), password);
      setSaved(true);
      setSuccess('Учётные данные успешно сохранены');
    } catch (err) {
      setError('Ошибка сохранения: ' + err.message);
    }
  };

  // Обработчик удаления
  const handleClear = () => {
    clearCredentials();
    setLogin('');
    setPassword('');
    setSaved(false);
    setSuccess('');
    setError('');
  };

  // Возврат на главную
  const handleBack = () => {
    navigate('/');
  };

  return (
    <div className="route-page login-page">
      <div className="login-container">
        <div className="login-card">
          <div className="login-header">
            <div className="login-icon">🔐</div>
            <h1>Авторизация</h1>
            <p className="login-subtitle">
              Сохраните логин и пароль, которые будут автоматически
              подставляться в запросы к указанным API
            </p>
          </div>

          <form className="login-form" onSubmit={handleSave}>
            <div className="login-field">
              <label className="login-label" htmlFor="login">Логин</label>
              <input
                id="login"
                type="text"
                className="login-input"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                autoComplete="username"
              />
            </div>

            <div className="login-field">
              <label className="login-label" htmlFor="password">Пароль</label>
              <input
                id="password"
                type="password"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="login-message login-error">{error}</div>
            )}
            {success && (
              <div className="login-message login-success">{success}</div>
            )}
            {saved && !success && (
              <div className="login-message login-info">
                ✓ Учётные данные сохранены. Пароль скрыт для безопасности —
                введите новый, чтобы обновить.
              </div>
            )}

            <div className="login-actions">
              <button type="submit" className="btn btn-primary btn-block">
                Сохранить
              </button>
              {saved && (
                <button
                  type="button"
                  className="btn btn-danger btn-block"
                  onClick={handleClear}
                >
                  Удалить сохранённые данные
                </button>
              )}
            </div>
          </form>

          <div className="login-footer">
            <button className="btn btn-secondary" onClick={handleBack}>
              ← На главную
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;