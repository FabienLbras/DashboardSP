import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AuthService, { User } from "../services/authService";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  login: async () => {},
  logout: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const authResponse = await AuthService.login({ email, password });
      const userData: User = {
        email: authResponse.email,
        name: authResponse.name
      };
      setUser(userData);
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  // Check authentication on mount and token changes
  useEffect(() => {
    const checkAuth = async () => {
      setLoading(true);
      
      if (AuthService.isAuthenticated()) {
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          // Validate token with backend
          try {
            const isValid = await AuthService.validateToken();
            if (isValid) {
              setUser(currentUser);
            } else {
              // Token is invalid, logout
              AuthService.logout();
              setUser(null);
            }
          } catch (error) {
            console.error('Token validation failed:', error);
            AuthService.logout();
            setUser(null);
          }
        } else {
          AuthService.logout();
          setUser(null);
        }
      } else {
        setUser(null);
      }
      
      setLoading(false);
    };

    checkAuth();

    // Listen for storage changes (logout from other tabs)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue) {
        // Token was removed, logout
        setUser(null);
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      isAuthenticated: !!user 
    }}>
      {children}
    </AuthContext.Provider>
  );
};