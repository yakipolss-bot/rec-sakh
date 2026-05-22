/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from './auth.service';
import { usersService } from './users.service';

function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: AuthUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    setIsLoading(true);
    const token = getLocalStorage('accessToken');

    if (!token) {
      try {
        const session = await authService.getSession();
        if (session) {
          setUser(session.user);
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    try {
      const profile = await usersService.getMe();
      setUser({
        id: profile.id,
        email: profile.email,
        name: profile.name,
        role: profile.role,
        avatarUrl: profile.avatarUrl,
      });
    } catch {
      const payload = parseJwt(token);
      if (payload?.exp && (payload.exp as number) * 1000 >= Date.now()) {
        setUser({
          id: payload.sub as string || '',
          email: payload.email as string || '',
          name: (payload.name as string) || (payload.email as string)?.split('@')[0] || 'User',
          role: (payload.role as string) || 'authenticated',
          avatarUrl: null,
        });
      } else {
        try {
          const session = await authService.getSession();
          if (session) {
            setUser(session.user);
          } else {
            setUser(null);
          }
        } catch {
          removeLocalStorage('accessToken');
          removeLocalStorage('refreshToken');
          setUser(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      const token = getLocalStorage('accessToken');
      if (!token) {
        try {
          const session = await authService.getSession();
          if (session) {
            // Try to fetch fresh role from DB
            try {
              const profile = await usersService.getMe();
              setUser({
                id: session.user.id,
                email: session.user.email,
                name: session.user.name,
                role: profile.role || session.user.role,
                avatarUrl: session.user.avatarUrl,
              });
            } catch {
              setUser(session.user);
            }
          } else {
            setUser(null);
          }
        } catch {
          setUser(null);
        } finally {
          setIsLoading(false);
        }
        return;
      }

      try {
        const profile = await usersService.getMe();
        setUser({
          id: profile.id,
          email: profile.email,
          name: profile.name,
          role: profile.role,
          avatarUrl: profile.avatarUrl,
        });
      } catch {
        const payload = parseJwt(token);
        if (payload?.exp && (payload.exp as number) * 1000 >= Date.now()) {
          setUser({
            id: payload.sub as string || '',
            email: payload.email as string || '',
            name: (payload.name as string) || (payload.email as string)?.split('@')[0] || 'User',
            role: (payload.role as string) || 'authenticated',
            avatarUrl: null,
          });
        } else {
          try {
            const session = await authService.getSession();
            if (session) {
              // Try to fetch fresh role from DB
              try {
                const profile = await usersService.getMe();
                setUser({
                  id: session.user.id,
                  email: session.user.email,
                  name: session.user.name,
                  role: profile.role || session.user.role,
                  avatarUrl: session.user.avatarUrl,
                });
              } catch {
                setUser(session.user);
              }
            } else {
              setUser(null);
            }
          } catch {
            removeLocalStorage('accessToken');
            removeLocalStorage('refreshToken');
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };
    init();

    const sub = authService.onAuthStateChange((event, session) => {
      if (event === 'INITIAL_SESSION') {
        return;
      }
      if (session) {
        setUser(session.user);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    return () => sub.data?.subscription?.unsubscribe();
  }, []);

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, refresh, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
