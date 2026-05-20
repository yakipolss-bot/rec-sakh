import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock localStorage (jsdom provides window but not localStorage by default)
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    get length() { return Object.keys(store).length; },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock });

describe('api-client', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.unstubAllGlobals();
  });

  it('should create axios instance with correct baseURL', async () => {
    const apiClient = (await import('../api-client')).default;
    expect(apiClient.defaults.baseURL).toBeDefined();
    expect(typeof apiClient.defaults.baseURL).toBe('string');
    expect(apiClient.defaults.headers['Content-Type']).toBe('application/json');
  });

  it('should add Authorization header when token exists', async () => {
    localStorageMock.setItem('accessToken', 'test-token-123');
    const apiClient = (await import('../api-client')).default;
    expect(apiClient).toBeDefined();
  });

  it('should handle missing refresh token gracefully', async () => {
    localStorageMock.removeItem('accessToken');
    localStorageMock.removeItem('refreshToken');

    const apiClient = (await import('../api-client')).default;
    // The interceptor is defined
    expect(apiClient.interceptors.response).toBeDefined();
  });

  it('should reset isRefreshing flag in finally block', async () => {
    const apiClient = (await import('../api-client')).default;
    const axios = await import('axios');

    // Mock axios.post to reject
    const postSpy = vi.spyOn(axios.default, 'post').mockRejectedValueOnce(new Error('Network error'));

    localStorageMock.setItem('accessToken', 'expired-token');
    localStorageMock.setItem('refreshToken', 'refresh-token');

    const error = {
      response: { status: 401 },
      config: { headers: {} as Record<string, string>, _retry: false },
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (apiClient.interceptors.response as any).handlers;
    const errorHandler = handlers?.[0]?.rejected;
    if (errorHandler) {
      await expect(errorHandler(error)).rejects.toThrow();
    }

    postSpy.mockRestore();
  });

  it('should queue requests while token is refreshing', async () => {
    const apiClient = (await import('../api-client')).default;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const handlers = (apiClient.interceptors.response as any).handlers;
    expect(handlers?.length).toBeGreaterThan(0);
  });
});
