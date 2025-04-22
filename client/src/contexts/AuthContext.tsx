import { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { AuthResponse, LoginCredentials, User } from '../types';
import { AuthService } from '../services/auth.service';
import { setToken, removeToken, getCurrentUser, isAuthenticated } from '../utils/auth';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuth: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth должен использоваться внутри AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(getCurrentUser());
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState<boolean>(isAuthenticated());

  useEffect(() => {
    const checkAuth = () => {
      const authenticated = isAuthenticated();
      setIsAuth(authenticated);
      if (authenticated) {
        setUser(getCurrentUser());
      } else {
        setUser(null);
      }
    };

    checkAuth();
    window.addEventListener('storage', checkAuth);

    return () => {
      window.removeEventListener('storage', checkAuth);
    };
  }, []);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await AuthService.login(credentials);
      handleAuthResponse(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Ошибка при входе в систему';
      setError(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = (response: AuthResponse) => {
    setToken(response.accessToken);
    setUser(response.user);
    setIsAuth(true);
  };

  const logout = () => {
    removeToken();
    setUser(null);
    setIsAuth(false);
  };

  const value = {
    user,
    isLoading,
    error,
    login,
    logout,
    isAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
