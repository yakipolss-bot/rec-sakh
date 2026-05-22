import { useEffect, useState } from 'react';
import { usersService, type UserProfile } from '@/services/users.service';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/services/auth-context';

interface UseUserOptions {
  enabled?: boolean;
}

function mapAuthUserToProfile(authUser: ReturnType<typeof useAuth>['user']): UserProfile {
  return {
    id: authUser?.id ?? '',
    name: authUser?.name ?? 'User',
    email: authUser?.email ?? '',
    role: authUser?.role ?? 'authenticated',
    avatarUrl: authUser?.avatarUrl ?? null,
    karma: 0,
    level: 'user',
    registeredAt: new Date().toISOString(),
    commentsCount: 0,
    adsCount: 0,
  };
}

export function useUser(options: UseUserOptions = {}) {
  const { user: authUser } = useAuth();
  const { enabled = true } = options;
  const [user, setUser] = useState<UserProfile | null>(authUser ? mapAuthUserToProfile(authUser) : null);
  const [isLoading, setIsLoading] = useState(!authUser);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!enabled) {
      setIsLoading(false);
      return;
    }

    let mounted = true;

    const fetchUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const profile = await usersService.getMe();
        if (mounted) {
          setUser(profile);
        }
      } catch {
        try {
          const fallback = await authService.getProfile();
          if (mounted) {
            setUser({
              id: fallback.id,
              email: fallback.email,
              name: fallback.name,
              role: fallback.role || 'authenticated',
              avatarUrl: fallback.avatarUrl,
              karma: 0,
              level: 'user',
              registeredAt: new Date().toISOString(),
              commentsCount: 0,
              adsCount: 0,
            });
          }
        } catch {
          if (mounted) {
            setError(new Error('Failed to fetch user'));
          }
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchUser();

    return () => {
      mounted = false;
    };
  }, [enabled]);

  const refetch = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const profile = await usersService.getMe();
      setUser(profile);
    } catch {
      try {
        const fallback = await authService.getProfile();
        setUser({
          id: fallback.id,
          email: fallback.email,
          name: fallback.name,
          role: fallback.role || 'authenticated',
          avatarUrl: fallback.avatarUrl,
          karma: 0,
          level: 'user',
          registeredAt: new Date().toISOString(),
          commentsCount: 0,
          adsCount: 0,
        });
      } catch {
        setError(new Error('Failed to fetch user'));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, error, refetch };
}

export function useUserActivity() {
  const [activity, setActivity] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchActivity = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersService.getActivity();
        if (mounted) {
          setActivity(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch activity'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchActivity();

    return () => {
      mounted = false;
    };
  }, []);

  return { activity, isLoading, error };
}

export function useUserBilling() {
  const [billing, setBilling] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchBilling = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersService.getBillingHistory();
        if (mounted) {
          setBilling(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch billing'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchBilling();

    return () => {
      mounted = false;
    };
  }, []);

  return { billing, isLoading, error };
}

export function useUserSubscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const fetchSubscriptions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await usersService.getSubscriptions();
        if (mounted) {
          setSubscriptions(data);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchSubscriptions();

    return () => {
      mounted = false;
    };
  }, []);

  return { subscriptions, isLoading, error };
}
