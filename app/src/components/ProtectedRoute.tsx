import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authService } from '@/services/auth.service';

interface ProtectedRouteProps {
  allowedRoles?: string[];
  children?: React.ReactNode;
}

function parseJwt(token: string): Record<string, unknown> | null {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

function getLocalStorage(key: string): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(key);
}

function removeLocalStorage(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(key);
}

export default function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const token = getLocalStorage('accessToken');
    if (!token) {
      setStatus('unauthenticated');
      return;
    }

    const payload = parseJwt(token);
    if (!payload || !payload.exp || (payload.exp as number) * 1000 < Date.now()) {
      authService
        .refresh()
        .then(() => {
          const newToken = getLocalStorage('accessToken');
          const newPayload = newToken ? parseJwt(newToken) : null;
          setRole((newPayload?.role as string) || null);
          setStatus('authenticated');
        })
        .catch(() => {
          removeLocalStorage('accessToken');
          removeLocalStorage('refreshToken');
          setStatus('unauthenticated');
        });
    } else {
      setRole((payload.role as string) || null);
      setStatus('authenticated');
    }
  }, []);

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[var(--bg-primary)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[var(--accent-ocean)] border-t-transparent rounded-full animate-spin" />
          <span className="sakh-caption text-[var(--text-muted)]">Проверка авторизации...</span>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
