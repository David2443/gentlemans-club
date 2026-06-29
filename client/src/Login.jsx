import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { loginRequest } from './api';
import { useAuth } from './AuthGate';
import './Login.css';

const clearLegacyStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('barberId');
  localStorage.removeItem('userNume');
};

const isAdminUser = (user) => {
  if (!user) return false;

  return (
    user.isAdmin === true ||
    user.isMaster === true ||
    user.role === 'admin' ||
    user.role === 'master'
  );
};

const getBarberId = (user) => {
  return user?.barberId || '';
};

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const {
    user,
    checking,
    isAuthenticated,
    refreshAuth
  } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [eroare, setEroare] = useState('');
  const [loading, setLoading] = useState(false);

  const requestedPath = useMemo(() => {
    const from = location.state?.from;

    if (typeof from === 'string' && from && from !== '/login') {
      return from;
    }

    return '';
  }, [location.state]);

  const getRedirectPath = useCallback((authUser) => {
  if (!authUser) return '';

  if (isAdminUser(authUser)) {
    return '/master';
  }

  const barberId = getBarberId(authUser);

  if (barberId) {
    return `/admin/${encodeURIComponent(barberId)}`;
  }

  return '';
}, []);

  useEffect(() => {
    clearLegacyStorage();
  }, []);

  useEffect(() => {
    if (checking) return;
    if (!isAuthenticated || !user) return;

    const redirectPath = getRedirectPath(user);

    if (redirectPath) {
      navigate(redirectPath, { replace: true });
    }
  }, [
    checking,
    isAuthenticated,
    user,
    getRedirectPath,
    navigate
  ]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      setEroare('Completează username-ul și parola.');
      return;
    }

    setLoading(true);
    setEroare('');

    try {
      await loginRequest(cleanUsername, password);

      const authUser = await refreshAuth();

      if (!authUser) {
        throw new Error('Login reușit, dar sesiunea nu a putut fi verificată.');
      }

      const redirectPath = getRedirectPath(authUser);

      if (!redirectPath) {
        throw new Error('Contul nu are rol valid pentru panou.');
      }

      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Eroare login:', err);

      const mesaj =
        err?.message?.includes('Failed to fetch') ||
        err?.message?.includes('NetworkError')
          ? 'Nu se poate conecta la server. Verifică dacă backend-ul rulează.'
          : err?.message || 'Date de autentificare greșite.';

      setEroare(mesaj);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-container">
      <section className="login-card">
        <div className="login-brand">
          <span>Gentleman&apos;s Club</span>
          <h1>Admin Login</h1>
          <p>Acces securizat pentru specialiști și panoul master.</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <div className="input-group">
            <label>Username</label>

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="ex: dani"
              autoComplete="username"
              disabled={loading}
            />
          </div>

          <div className="input-group">
            <label>Parolă</label>

            <div className="password-field">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                disabled={loading}
              />

              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                disabled={loading}
              >
                {showPassword ? 'Ascunde' : 'Arată'}
              </button>
            </div>
          </div>

          {eroare && (
            <p className="error-msg">
              {eroare}
            </p>
          )}

          <button
            type="submit"
            className="btn-login"
            disabled={loading || checking}
          >
            {loading || checking ? 'Se verifică...' : 'Intră în panou'}
          </button>
        </form>

        <button
          type="button"
          className="login-back-home"
          onClick={() => navigate('/')}
          disabled={loading}
        >
          ← Înapoi pe site
        </button>
      </section>
    </main>
  );
}

export default Login;