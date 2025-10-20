// Client-side fetch wrapper that attempts to refresh the Spotify access token on 401
// and retries the original request once. If refresh fails, clears tokens and redirects to /login.

export async function redirectToLogin() {
  try {
    localStorage.removeItem('spotify_token');
    localStorage.removeItem('spotify_refresh_token');
  } catch (e) {
    // ignore
  }
  if (typeof window !== 'undefined') window.location.href = '/login';
}

export async function fetchWithAuth(input: RequestInfo, init?: RequestInit): Promise<Response> {
  // Only run in browser
  if (typeof window === 'undefined') return fetch(input, init);

  const makeRequest = async (token?: string) => {
    const finalInit: RequestInit = { ...(init || {}) };
    const headers = new Headers(finalInit.headers || undefined);
    if (token) headers.set('Authorization', `Bearer ${token}`);
    finalInit.headers = headers;
    return fetch(input, finalInit);
  };

  let token: string | null = null;
  try { token = localStorage.getItem('spotify_token'); } catch (e) { token = null; }

  let res = await makeRequest(token ?? undefined);
  if (res.status !== 401) return res;

  // Try refreshing using our refresh endpoint
  let refreshToken: string | null = null;
  try { refreshToken = localStorage.getItem('spotify_refresh_token'); } catch (e) { refreshToken = null; }
  if (!refreshToken) {
    await redirectToLogin();
    throw new Error('Unauthorized');
  }

  try {
    const refreshRes = await fetch('/api/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken })
    });

    if (!refreshRes.ok) {
      await redirectToLogin();
      throw new Error('Refresh failed');
    }

    const data = await refreshRes.json();
    if (!data?.access_token) {
      await redirectToLogin();
      throw new Error('Refresh response missing access_token');
    }

    // Store tokens
    try {
      localStorage.setItem('spotify_token', data.access_token);
      if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
    } catch (e) {
      // ignore
    }

    // Retry original request with new token
    const newToken = data.access_token;
    res = await makeRequest(newToken);
    if (res.status === 401) {
      await redirectToLogin();
      throw new Error('Unauthorized after refresh');
    }

    return res;
  } catch (err) {
    await redirectToLogin();
    throw err;
  }
}
