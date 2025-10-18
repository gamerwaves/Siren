<script lang="ts">
  import { onMount } from 'svelte';
  export let data;

  onMount(() => {
    if (data?.accessToken) {
      // Save only the token in browser; user data will be fetched from Spotify when needed
      localStorage.setItem('spotify_token', data.accessToken);
      if (data?.refreshToken) localStorage.setItem('spotify_refresh_token', data.refreshToken);
      if (data?.expiresIn) localStorage.setItem('spotify_expires_in', String(data.expiresIn));

      // Redirect to main page
      window.location.href = '/';
    } else {
      console.error('No token received from server:', data);
    }
  });
</script>

<p>Logging in...</p>
