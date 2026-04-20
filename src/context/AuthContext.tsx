import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import AuthService, { MfaChallengeResponse, User } from "../services/authService";

interface PendingMfaChallenge {
  email: string;
  mfaToken: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  pendingMfaChallenge: PendingMfaChallenge | null;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<{ mfaRequired: boolean; usedBackupCode?: boolean }>;
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
  const authCheckRan = useRef(false);

  // Login function
  const login = async (email: string, password: string, rememberMe = true) => {
    try {
      const authResponse = await AuthService.login({ email, password }, rememberMe);

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
      console.log('[AuthContext] checkAuth START — loading:', loading, 'user:', user);
      if (AuthService.isAuthenticated()) {
        console.log('[AuthContext] token présent et non expiré (client-side)');
        const currentUser = AuthService.getCurrentUser();
        if (currentUser) {
          try {
            console.log('[AuthContext] appel validateToken...');
            const isValid = await AuthService.validateToken();
            console.log('[AuthContext] validateToken result:', isValid);
            if (isValid) {
              if (currentUser.role) {
                console.log('[AuthContext] setUser:', currentUser);
                setUser(currentUser);
              } else {
                const profile = await AuthService.getProfile();
                console.log('[AuthContext] setUser (depuis profil):', profile);
                setUser(profile);
              }
            } else {
              console.log('[AuthContext] token invalide côté serveur → logout');
              AuthService.logout();
              setUser(null);
            }
          } catch (error) {
            console.error('[AuthContext] validateToken exception:', error);
            AuthService.logout();
            setUser(null);
          }
        } else {
          console.log('[AuthContext] getCurrentUser null → logout');
          AuthService.logout();
          setUser(null);
        }
      } else {
        console.log('[AuthContext] pas de token valide → user null');
        setUser(null);
      }
      console.log('[AuthContext] checkAuth END → setLoading(false)');
      setLoading(false);
    };

    // Guard against React Strict Mode double-invocation
    console.log('[AuthContext] useEffect fired, authCheckRan:', authCheckRan.current);
    if (!authCheckRan.current) {
      authCheckRan.current = true;
      checkAuth();
    } else {
      console.log('[AuthContext] checkAuth skipped (Strict Mode second run)');
    }

    // Event listeners must always be re-registered after Strict Mode cleanup
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'accessToken' && !e.newValue) {
        setUser(null);
      }
    };

    const handleSessionExpired = () => {
      setUser(null);
      setLoading(false);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:session-expired', handleSessionExpired);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:session-expired', handleSessionExpired);
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
