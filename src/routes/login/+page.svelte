<script lang="ts">
  // Read Vite client-side env directly. $env/static/public didn't export VITE_* in this setup.
  const clientId = import.meta.env.VITE_SPOTIFY_CLIENT_ID as string;

  const scopes = [
    'user-read-private',
    'user-read-email',
    'user-read-playback-state',
    'user-modify-playback-state',
    'streaming',
    'user-library-modify'
  ].join(' ');

  function login() {
    const state = crypto.randomUUID(); // optional, can store in cookie for CSRF protection
    const redirectUri = (import.meta.env.VITE_SPOTIFY_REDIRECT_URI as string) || 'https://siren-alpha.vercel.app/callback';
    const url = `https://accounts.spotify.com/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: redirectUri,
        state
      }).toString();
    window.location.href = url;
  }
</script>

<div class="login-container">
  <div class="card">
    <h1>Welcome to Siren</h1>
    <p>Sign in with your Spotify account to start listening.</p>
    <button class="spotify-btn" on:click={login}>Login with Spotify</button>
  </div>
</div>

<style>
  :global(body) {
    margin: 0;
    background: #000; /* black background */
    color: #fff;
    font-family: system-ui, -apple-system, 'Segoe UI', Roboto, 'Helvetica Neue', Arial;
  }

  .login-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .card {
    background: rgba(255,255,255,0.03);
    border-radius: 12px;
    padding: 2rem;
    text-align: center;
    box-shadow: 0 8px 40px rgba(0,0,0,0.6);
    max-width: 420px;
    width: 100%;
  }

  h1 { margin: 0 0 0.5rem 0; font-size: 1.5rem; color: #fff; }
  p { margin: 0 0 1.25rem 0; color: #ddd; }

  .spotify-btn {
    background: #1db954; /* Spotify green */
    color: #000; /* black text as requested */
    border: none;
    padding: 0.75rem 1.25rem;
    font-size: 1rem;
    border-radius: 999px;
    cursor: pointer;
    font-weight: 700;
    box-shadow: 0 6px 18px rgba(29,185,84,0.18);
    transition: transform 0.12s ease, box-shadow 0.12s ease;
  }

  .spotify-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 30px rgba(29,185,84,0.22);
  }

  .spotify-btn:active { transform: translateY(0); }
</style>
