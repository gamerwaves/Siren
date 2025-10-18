import type { PageServerLoad } from './$types';
import { redirect, error } from '@sveltejs/kit';
import { VITE_SPOTIFY_CLIENT_ID, VITE_SPOTIFY_REDIRECT_URI, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

export const load: PageServerLoad = async ({ url, fetch }) => {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');

  if (!code) throw redirect(302, '/login');

  if (!VITE_SPOTIFY_CLIENT_ID || !VITE_SPOTIFY_REDIRECT_URI || !SPOTIFY_CLIENT_SECRET) {
    console.error('Missing Spotify env vars. Please set VITE_SPOTIFY_CLIENT_ID, VITE_SPOTIFY_REDIRECT_URI and SPOTIFY_CLIENT_SECRET');
    throw error(500, 'Server not configured with Spotify credentials');
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: VITE_SPOTIFY_REDIRECT_URI
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
  'Authorization': 'Basic ' + Buffer.from(`${VITE_SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  if (!res.ok) {
    // Try to read body for diagnostics
    let bodyText: string;
    try {
      bodyText = await res.text();
    } catch (e) {
      bodyText = '<unable to read response body>';
    }
    console.error('Spotify token endpoint returned', res.status, bodyText);
    throw error(502, `Spotify token endpoint error ${res.status}: ${bodyText}`);
  }

  const data = await res.json(); // { access_token, token_type, scope, expires_in, refresh_token }

  // Debug: log the token response body so we can see what Spotify returned during development
  // (keep this in dev only — it's helpful while diagnosing 4xx/5xx issues)
  try {
    console.error('Spotify token response:', data);
  } catch (e) {
    // ignore logging errors
  }

  const accessToken = data.access_token as string;
  const refreshToken = data.refresh_token as string | undefined;
  const expiresIn = data.expires_in as number | undefined;

  // Fetch the current user's profile so the client can store user info
  const userRes = await fetch('https://api.spotify.com/v1/me', {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  if (!userRes.ok) {
    let bodyText: string;
    try {
      bodyText = await userRes.text();
    } catch (e) {
      bodyText = '<unable to read response body>';
    }
    console.error('Spotify /me endpoint returned', userRes.status, bodyText);
    // If Spotify returns 403, that commonly means the user (or app) isn't allowed to access /me.
    // Possible causes: user not added as a test user in the Spotify Dashboard, or the app is in a state
    // that disallows the requested scopes. Provide a clearer error to help diagnose.
    if (userRes.status === 403) {
      throw error(502, `Spotify /me endpoint error 403: access forbidden. Check your app's settings on https://developer.spotify.com/dashboard (make sure the redirect URI matches and that any test users are registered). Response: ${bodyText}`);
    }

    throw error(502, `Spotify /me endpoint error ${userRes.status}: ${bodyText}`);
  }

  const user = await userRes.json();

  // Return token, refresh token and user to the page
  return {
    accessToken,
    refreshToken,
    expiresIn,
    user
  };
};
