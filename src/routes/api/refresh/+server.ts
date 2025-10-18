import type { RequestHandler } from '@sveltejs/kit';
import { VITE_SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET } from '$env/static/private';

export const POST: RequestHandler = async ({ request }) => {
  const { refresh_token } = await request.json();
  if (!refresh_token) return new Response(JSON.stringify({ error: 'missing refresh_token' }), { status: 400 });

  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
    client_id: VITE_SPOTIFY_CLIENT_ID
  });

  const res = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${VITE_SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body
  });

  const data = await res.json();
  return new Response(JSON.stringify(data), { status: res.ok ? 200 : 500 });
};
