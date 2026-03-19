import React, { createContext, useContext, useState, useEffect } from 'react';
import { validatePassword } from '@/lib/password-validator';

// ⚠️ MODO DESENVOLVIMENTO - Mude para false antes de fazer deploy
const USE_MOCK_AUTH = false;

const MOCK_USER = {
  id: 1,
  email: 'dev@test.com',
  fullName: 'Dev User'
};

const MOCK_TOKEN = 'mock-jwt-token-for-development';

interface User {
  id: number;
  email: string;
  fullName?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isInitializing: boolean;
  authToken: string | null;
  mustChangePassword: boolean;
  clearMustChangePassword: () => void;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Restaura usuário do localStorage ao carregar (ou SSO quando vindo do Hub)
  useEffect(() => {
    const hash = window.location.hash;
    // Aceita sso_token (Hub) ou access_token (OAuth padrão)
    const ssoMatch = hash.match(/(?:sso_token|access_token)=([^&]+)/);

    // SSO: token passado pelo Hub - validar e fazer login automático
    if (ssoMatch) {
      const token = decodeURIComponent(ssoMatch[1]);

      const applySsoLogin = (apiUser: { id: string | number; email: string; name?: string }) => {
        const userObj: User = {
          id: typeof apiUser.id === 'string' ? parseInt(apiUser.id, 10) : apiUser.id,
          email: apiUser.email,
          fullName: apiUser.name || apiUser.email,
        };
        setUser(userObj);
        setAuthToken(token);
        setMustChangePassword(false);
        localStorage.setItem('authToken', token);
        localStorage.setItem('user', JSON.stringify(userObj));
        localStorage.setItem('loginTime', Date.now().toString());
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
        if (window.location.pathname === '/' || window.location.pathname === '') {
          window.location.replace('/dashboard');
        }
      };

      const apiUrl = import.meta.env.VITE_API_URL || 'https://o2controle-backend.onrender.com/api';

      fetch(`${apiUrl}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : Promise.reject(res)))
        .then(({ user: apiUser }) => applySsoLogin(apiUser))
        .catch(() => {
          // Fallback: decodifica JWT localmente se /me falhar (CORS, rede, etc.)
          try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            if (payload.id && payload.email) {
              applySsoLogin({
                id: payload.id,
                email: payload.email,
                name: payload.fullName || payload.email,
              });
            }
          } catch {
            // Token inválido - fluxo normal (mostrar login)
          }
        })
        .finally(() => setIsInitializing(false));
      return;
    }

    // Fluxo normal: restore do localStorage
    if (USE_MOCK_AUTH) {
      setUser(MOCK_USER);
      setAuthToken(MOCK_TOKEN);
      setIsInitializing(false);
      return;
    }

    try {
      const storedUser = localStorage.getItem('user');
      const storedToken = localStorage.getItem('authToken');
      if (storedUser && storedToken) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          setAuthToken(storedToken);
        } catch (parseError) {
          console.error('Erro ao fazer parse do usuário:', parseError);
          localStorage.removeItem('user');
          localStorage.removeItem('authToken');
          localStorage.removeItem('loginTime');
        }
      }
    } catch (error) {
      console.error('Erro ao restaurar autenticação:', error);
      localStorage.removeItem('user');
      localStorage.removeItem('authToken');
      localStorage.removeItem('loginTime');
    } finally {
      setIsInitializing(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Validação básica
      if (!email || !password) {
        throw new Error('E-mail e senha são obrigatórios');
      }

      if (!email.includes('@')) {
        throw new Error('E-mail inválido');
      }

      // Validar força de senha
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        throw new Error(`Senha fraca: ${passwordValidation.errors.join(', ')}`);
      }

      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.status === 429) {
        const data = await response.json();
        throw new Error(`Muitas tentativas de login. Tente novamente em ${data.retryAfter} segundos.`);
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao fazer login');
      }

      const data = await response.json();
      setUser(data.user);
      setAuthToken(data.token);
      setMustChangePassword(data.mustChangePassword === true);
      localStorage.setItem('authToken', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('loginTime', Date.now().toString());
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (USE_MOCK_AUTH) return;
    setUser(null);
    setAuthToken(null);
    setMustChangePassword(false);
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
  };

  const clearMustChangePassword = () => setMustChangePassword(false);

  return (
    <AuthContext.Provider
      value={{
        isInitializing,
        user,
        authToken,
        isLoading,
        mustChangePassword,
        clearMustChangePassword,
        login,
        logout,
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
