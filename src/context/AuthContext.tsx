import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AuthService, { MfaChallengeResponse, User } from "../services/authService";

interface PendingMfaChallenge {
  email: string;
  mfaToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pendingMfaChallenge: PendingMfaChallenge | null;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; usedBackupCode?: boolean }>;
  verifyMfa: (code: string) => Promise<{ usedBackupCode?: boolean }>;
  clearMfaChallenge: () => void;
  logout: () => void;
  refreshUser: (updatedUser: User) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  loading: true,
  pendingMfaChallenge: null,
  login: async () => ({ mfaRequired: false }),
  verifyMfa: async () => ({}),
  clearMfaChallenge: () => {},
  logout: () => {},
  refreshUser: () => {},
  isAuthenticated: false
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [pendingMfaChallenge, setPendingMfaChallenge] = useState<PendingMfaChallenge | null>(null);

  // Login function
  const login = async (email: string, password: string) => {
    try {
      const authResponse = await AuthService.login({ email, password });

      if ('mfaRequired' in authResponse) {
        const challenge = authResponse as MfaChallengeResponse;
        setPendingMfaChallenge({ email, mfaToken: challenge.mfaToken });
        setUser(null);
        return { mfaRequired: true };
      }

      const userData: User = {
        email: authResponse.email,
        name: authResponse.name,
        role: authResponse.role,
        must_change_password: authResponse.must_change_password || false,
      };
      setPendingMfaChallenge(null);
      setUser(userData);
      return { mfaRequired: false, usedBackupCode: authResponse.usedBackupCode };
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const refreshUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  const verifyMfa = async (code: string) => {
    if (!pendingMfaChallenge) {
      throw new Error("Aucun challenge MFA en cours");
    }

    try {
      const authResponse = await AuthService.verifyMfaLogin(pendingMfaChallenge.mfaToken, code);
      const userData: User = {
        email: authResponse.email,
        name: authResponse.name,
        role: authResponse.role,
      };
      setUser(userData);
      setPendingMfaChallenge(null);
      return { usedBackupCode: authResponse.usedBackupCode };
    } catch (error) {
      console.error('MFA verification failed:', error);
      throw error;
    }
  };

  const clearMfaChallenge = () => {
    setPendingMfaChallenge(null);
  };

  // Logout function
  const logout = () => {
    AuthService.logout();
    setPendingMfaChallenge(null);
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
              if (currentUser.role) {
                setUser(currentUser);
              } else {
                const profile = await AuthService.getProfile();
                setUser(profile);
              }
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
      pendingMfaChallenge,
      login,
      verifyMfa,
      clearMfaChallenge,
      logout,
      refreshUser,
      isAuthenticated: !!user
    }}>
      {children}
    </AuthContext.Provider>
  );
};
