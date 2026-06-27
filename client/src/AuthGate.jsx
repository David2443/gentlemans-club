import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react';
import { Navigate, useLocation, useParams } from 'react-router-dom';
import { getMe, logoutRequest } from './api';
import './Login.css';
const AuthContext = createContext(null);

const clearLegacyStorage = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('isAdmin');
  localStorage.removeItem('barberId');
  localStorage.removeItem('userNume');
};

const normalizeAuthUser = (data) => {
  const user = data?.user || data?.utilizator || data || {};

  return {
    id: user.id || user._id || '',
    nume: user.nume || user.name || user.username || '',
    username: user.username || '',
    barberId: user.barberId || data?.barberId || '',
    isAdmin: user.isAdmin === true || data?.isAdmin === true,
    isMaster: user.isMaster === true || data?.isMaster === true,
    role: user.role || data?.role || ''
  };
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

function AuthLoadingScreen() {
  return (
    <main className="login-container">
      <section className="login-card">
        <h2>Se verifică accesul</h2>

        <p
          style={{
            margin: 0,
            color: 'rgba(255,255,255,0.6)',
            fontWeight: 800,
            lineHeight: 1.6
          }}
        >
          Te rugăm așteaptă câteva secunde.
        </p>
      </section>
    </main>
  );
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);

  const refreshAuth = useCallback(async () => {
    clearLegacyStorage();

    try {
      const data = await getMe();
      const authUser = normalizeAuthUser(data);

      if (!authUser.id && !authUser.username && !authUser.barberId && !isAdminUser(authUser)) {
        setUser(null);
        return null;
      }

      setUser(authUser);
      return authUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let alive = true;

    const run = async () => {
      setChecking(true);

      const authUser = await refreshAuth();

      if (!alive) return;

      setUser(authUser);
      setChecking(false);
    };

    run();

    return () => {
      alive = false;
    };
  }, [refreshAuth]);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Chiar dacă serverul nu răspunde, curățăm frontend-ul.
    } finally {
      clearLegacyStorage();
      setUser(null);
    }
  }, []);

  const value = useMemo(() => {
    return {
      user,
      checking,
      isAuthenticated: Boolean(user),
      isAdmin: isAdminUser(user),
      refreshAuth,
      logout
    };
  }, [user, checking, refreshAuth, logout]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth trebuie folosit în interiorul AuthProvider.');
  }

  return context;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
  enforceBarber = false
}) {
  const { user, checking, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();
  const params = useParams();

  if (checking) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname }}
      />
    );
  }

  if (requireAdmin && !isAdmin) {
    if (user?.barberId) {
      return <Navigate to={`/admin/${encodeURIComponent(user.barberId)}`} replace />;
    }

    return <Navigate to="/login" replace />;
  }

  if (enforceBarber && !isAdmin) {
    const routeBarberId = params.id;

    if (!user?.barberId) {
      return <Navigate to="/login" replace />;
    }

    if (routeBarberId && routeBarberId !== user.barberId) {
      return <Navigate to={`/admin/${encodeURIComponent(user.barberId)}`} replace />;
    }
  }

  return children;
}