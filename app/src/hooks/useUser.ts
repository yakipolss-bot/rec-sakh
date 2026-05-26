import { useEffect, useState, useRef, useCallback } from 'react';
import usersService from '@/services/users.service';
import authService from '@/services/auth.service';
import type { UserProfile } from '@/models/users/UserProfile';
import type { ActivityEntry } from '@/models/users/ActivityEntry';
import type { BillingOperation } from '@/models/users/BillingOperation';
import type { Subscription } from '@/models/users/Subscription';
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
        if (mounted) setUser(profile);
      } catch {
        try {
          const fallback = await authService.getProfile();
          if (mounted && fallback) {
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
          // Silently fall back to auth context user if API is unavailable
          if (mounted && authUser) {
            setUser(mapAuthUserToProfile(authUser));
            setError(null);
          }
        }
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    fetchUser();

    return () => { mounted = false; };
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
        if (fallback) {
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
        // Silently fall back to auth context user
        if (authUser) {
          setUser(mapAuthUserToProfile(authUser));
          setError(null);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return { user, isLoading, error, refetch };
}

export function useUserActivity() {
  const [activity, setActivity] = useState<ActivityEntry[]>([]);
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
  const [billing, setBilling] = useState<BillingOperation[]>([]);
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
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const mountedRef = useRef(true);

  const refetch = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await usersService.getSubscriptions();
      if (mountedRef.current) {
        setSubscriptions(data);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('Failed to fetch subscriptions'));
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    refetch();
    return () => { mountedRef.current = false; };
  }, [refetch]);

  return { subscriptions, isLoading, error, refetch };
}
