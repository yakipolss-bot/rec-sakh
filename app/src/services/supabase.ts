export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || 'https://fhdtteyrcczqlmvwjhps.supabase.co';
}

export function getSupabaseAnonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  if (!key) {
    console.warn('VITE_SUPABASE_ANON_KEY is not configured');
  }
  return key;
}

export function getOAuthUrl(provider: string): string {
  const redirectTo = `${window.location.origin}/auth`;
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  return `${url}/auth/v1/authorize?provider=${provider}&redirect_to=${encodeURIComponent(redirectTo)}&client_id=${anonKey}`;
}

export function parseUrlHash(): {
  accessToken: string | null;
  refreshToken: string | null;
  type: string | null;
} {
  const hash = window.location.hash;
  if (!hash) return { accessToken: null, refreshToken: null, type: null };

  const params = new URLSearchParams(hash.replace('#', '?'));
  return {
    accessToken: params.get('access_token'),
    refreshToken: params.get('refresh_token'),
    type: params.get('type'),
  };
}

export function clearUrlHash(): void {
  window.history.replaceState(null, '', window.location.pathname + window.location.search);
}
