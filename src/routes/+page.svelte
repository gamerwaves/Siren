<script lang="ts">
  import { onMount } from 'svelte';
  import SpotifyPlayer from '../components/SpotifyPlayer.svelte';
  import { getCurrentUser } from '$lib/spotify';

  let token = '';
  let userToken: string | null = null;
  let currentUser: any = null;
  let showUserMenu = false;
  let isPlaying = false;
  // Example static track for SDK demo
  const track = {
    name: 'Example Song',
    uri: 'spotify:track:11dFghVXANMlKmJXsNCbNl',
    artists: [{ name: 'Example Artist' }],
    album: { images: [{ url: '/favicon.svg' }] }
  };
  let playerRef: any = null;

  // helper for SpotifyPlayer: provide a function that returns a fresh token string (user token preferred)

  const togglePlay = async () => {
    const userTok = localStorage.getItem('spotify_token');
    if (userTok && playerRef) {
      try {
        if (track?.uri && typeof playerRef.playUri === 'function') {
          await playerRef.playUri(track.uri);
          return;
        }
        if (typeof playerRef.togglePlay === 'function') {
          await playerRef.togglePlay();
          return;
        }
      } catch (e) {
        console.warn('SDK play failed', e);
      }
    }
    console.warn('No SDK available and preview playback disabled');
  };

  onMount(async () => {
    // Read user OAuth token early and start fetching profile (non-blocking)
    if (typeof window !== 'undefined') {
      userToken = localStorage.getItem('spotify_token');
      if (userToken) {
        // do not await - fetch user profile in parallel so avatar can appear quickly
        getCurrentUser(userToken)
          .then(u => { currentUser = u; })
          .catch(e => { console.warn('Failed to load user profile', e); });
      }
    }

    // Ensure we have at least a client token available for any public API calls (not strictly necessary for SDK-only demo)
    await getTokenString();
  });

  // helper for SpotifyPlayer: provide a function that returns a fresh token string (user token preferred)
  const getTokenString = async (): Promise<string | null> => {
    try {
      const maybe = localStorage.getItem('spotify_token');
      if (maybe) return maybe;
      // attempt to refresh using stored refresh token
      const refresh = localStorage.getItem('spotify_refresh_token');
      if (!refresh) return null;
      const res = await fetch('/api/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refresh }) });
      if (!res.ok) {
        console.warn('Refresh token request failed', await res.text());
        return null;
      }
      const data = await res.json();
      if (data?.access_token) {
        localStorage.setItem('spotify_token', data.access_token);
        if (data.refresh_token) localStorage.setItem('spotify_refresh_token', data.refresh_token);
        return data.access_token;
      }
      return null;
    } catch (e) {
      console.error('getTokenString error', e);
      return null;
    }
  };
</script>

<style>
  main {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background: linear-gradient(to right, #a8ffa8 10%, white 50%, #ffc0c0 90%);
    font-family: system-ui, sans-serif;
    position: relative;
    overflow: hidden;
  }

  .song-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 1rem;
    padding: 1rem;
  }

  img {
    width: 150px;
    height: 150px;
    border-radius: 0.75rem;
    object-fit: cover;
    border: 2px solid #000;
  }

  h2 {
    margin-top: 0.75rem;
    font-size: 1.25rem;
    font-weight: 700;
    text-align: center;
  }

  p {
    margin: 0.25rem 0;
    color: #333;
    text-align: center;
  }

  .controls {
    margin-top: 1rem;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  button {
    border: none;
    background: #000;
    color: #fff;
    padding: 0.5rem 1rem;
    border-radius: 0.5rem;
    cursor: pointer;
  }

  /* removed bottom-buttons UI */

  /* avatar */
  .user-avatar {
    position: fixed;
    top: 1rem;
    right: 1rem;
    width: 44px;
    height: 44px;
    border-radius: 50%;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .user-avatar img { width: 100%; height: 100%; object-fit: cover }

  .user-menu {
    position: fixed;
    top: 60px;
    right: 1rem;
    background: white;
    border-radius: 8px;
    box-shadow: 0 6px 24px rgba(0,0,0,0.15);
    padding: 0.5rem;
    min-width: 160px;
    z-index: 1200;
  }

  .user-menu button { width: 100%; text-align: left; padding: 0.5rem; border: none; background: none }
</style>

<main>
  {#if currentUser}
    <button class="user-avatar" aria-haspopup="true" aria-expanded={showUserMenu} on:click={() => showUserMenu = !showUserMenu}>
      <img src={currentUser.images?.[0]?.url ?? '/favicon.svg'} alt="User avatar" />
    </button>
    {#if showUserMenu}
      <div class="user-menu" role="menu">
        <div style="padding:0.5rem 0; border-bottom:1px solid #eee">{currentUser.display_name}</div>
        <button role="menuitem" on:click={() => { localStorage.removeItem('spotify_token'); localStorage.removeItem('spotify_refresh_token'); window.location.href = '/login'; }}>Logout</button>
      </div>
    {/if}
  {/if}
    <div class="song-card">
      <img src={track.album.images[0]?.url} alt="{track.name} album art" />
      <h2>{track.name}</h2>
      <p>{track.artists[0]?.name}</p>

      <div class="controls">
        <button on:click={togglePlay}>
          Play
        </button>
      </div>
    </div>

  

  {#if typeof window !== 'undefined'}
  <SpotifyPlayer bind:this={playerRef} getToken={getTokenString} token={localStorage.getItem('spotify_token')} on:ready={(e) => console.log('player ready', e.detail)} />
  {/if}
</main>
