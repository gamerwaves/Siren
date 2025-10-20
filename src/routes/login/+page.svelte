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
    const url = `https://accounts.spotify.com/authorize?` +
      new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scopes,
        redirect_uri: 'http://127.0.0.1:5173/callback',
        state
      }).toString();
    window.location.href = url;
  }
</script>

<button on:click={login}>Login with Spotify</button>
