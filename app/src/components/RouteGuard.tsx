import { Navigate } from 'react-router-dom';
import { useAuth } from '@/services/auth-context';
import { Loader2 } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  roles?: string[];
  fallback?: string;
}

export default function RouteGuard({ children, roles, fallback = '/auth' }: RouteGuardProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 size={24} className="animate-spin text-[var(--text-muted)]" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to={fallback} replace />;
  }

  if (roles && roles.length > 0 && !roles.includes(user.role)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <h1 className="text-2xl font-bold text-[var(--text-primary)]">Доступ запрещён</h1>
        <p className="text-[var(--text-secondary)]">У вас нет прав для просмотра этой страницы.</p>
        <Navigate to="/" replace />
      </div>
    );
  }

  return <>{children}</>;
}
