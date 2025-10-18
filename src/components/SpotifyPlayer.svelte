<script lang="ts">
  import { onMount, onDestroy, createEventDispatcher } from 'svelte';
  import { browser } from '$app/environment';
  // token: optional initial token string
  // getToken: optional async function that returns a fresh access token (useful to refresh tokens server-side)
  export let token: string | null = null;
  export let getToken: (() => Promise<string | null>) | null = null;

  const dispatch = createEventDispatcher();

  let player: any = null;
  let deviceId: string | null = null;
  let isPaused = true;
  let name = 'Spotify Player';

  function onStateChanged(state: any) {
    if (!state) return;
    isPaused = state.paused;
    dispatch('state', state);
  }

  function ensureSdkLoaded() {
    if ((window as any).Spotify) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const existing = document.querySelector('script[src="https://sdk.scdn.co/spotify-player.js"]');
      if (existing) {
        // If script exists but SDK isn't ready yet, rely on onSpotifyWebPlaybackSDKReady
        resolve();
        return;
      }
      const tag = document.createElement('script');
      tag.src = 'https://sdk.scdn.co/spotify-player.js';
      tag.onload = () => resolve();
      document.head.appendChild(tag);
    });
  }

  function provideToken(cb: (t: string) => void) {
    // The SDK expects getOAuthToken to call cb with a valid token (can be async)
    (async () => {
      try {
        if (getToken) {
          const t = await getToken();
          if (t) cb(t);
          else console.error('getToken did not return a token');
        } else if (token) {
          cb(token);
        } else {
          console.error('No token or getToken provided to SpotifyPlayer');
        }
      } catch (e) {
        console.error('Error getting token for Web Playback SDK', e);
      }
    })();
  }

  onMount(async () => {
    if (!browser) return;

    await ensureSdkLoaded();

    // Attach the SDK ready callback. If another component set it, we still override to initialize our player.
    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      player = new (window as any).Spotify.Player({
        name,
        getOAuthToken: provideToken,
        volume: 0.8,
        // enableMediaSession: true // optional
      });

      // Ready
      player.addListener('ready', ({ device_id }: any) => {
        deviceId = device_id;
        console.log('Spotify Web Playback SDK ready — Device ID', device_id);
        dispatch('ready', { deviceId });
      });

      // Not ready
      player.addListener('not_ready', ({ device_id }: any) => {
        console.log('Device ID has gone offline', device_id);
        dispatch('not_ready', { deviceId: device_id });
      });

      // Initialization/auth/account/playback errors
      player.addListener('initialization_error', ({ message }: any) => {
        console.error('Spotify SDK initialization_error', message);
        dispatch('error', { type: 'initialization_error', message });
      });

      player.addListener('authentication_error', ({ message }: any) => {
        console.error('Spotify SDK authentication_error', message);
        dispatch('error', { type: 'authentication_error', message });
      });

      player.addListener('account_error', ({ message }: any) => {
        console.error('Spotify SDK account_error', message);
        dispatch('error', { type: 'account_error', message });
      });

      player.addListener('playback_error', ({ message }: any) => {
        console.error('Spotify SDK playback_error', message);
        dispatch('error', { type: 'playback_error', message });
      });

      player.addListener('autoplay_failed', () => {
        console.warn('Spotify SDK autoplay_failed');
        dispatch('autoplay_failed');
      });

      player.addListener('player_state_changed', onStateChanged);

      // Attempt to connect
      player.connect().then((success: boolean) => {
        if (success) console.log('Connected to the Spotify Web Playback SDK');
        else console.warn('Failed to connect to the Spotify Web Playback SDK');
      });
    };
  });

  onDestroy(() => {
    if (player) player.disconnect();
  });

  async function transferPlaybackAndPlay(device_id?: string, play: boolean = true) {
    const id = device_id ?? deviceId;
    if (!id) return;
    const t = getToken ? await getToken() : token;
    if (!t) return console.error('No token available to transfer playback');

    await fetch('https://api.spotify.com/v1/me/player', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ device_ids: [id], play })
    });
  }

  // Exported helpers for parent components
  export async function togglePlay() {
    if (!player) return;
    try {
      await player.togglePlay();
    } catch (e) {
      console.error('togglePlay failed', e);
    }
  }

  // local helpers used by the component template
  async function play() {
    if (!player) return;
    try {
      if (typeof player.resume === 'function') await player.resume();
      else await togglePlay();
    } catch (e) {
      console.error('play failed', e);
    }
  }

  async function pause() {
    if (!player) return;
    try {
      if (typeof player.pause === 'function') await player.pause();
      else await togglePlay();
    } catch (e) {
      console.error('pause failed', e);
    }
  }

  export async function activateElement() {
    if (!player) return;
    try {
      // player.activateElement is supported by the SDK to workaround autoplay rules on mobile
      if (typeof player.activateElement === 'function') await player.activateElement();
    } catch (e) {
      console.error('activateElement failed', e);
    }
  }

  // Play a specific Spotify URI (spotify:track:<id>) on this player's device. If device isn't active, transfer and play.
  export async function playUri(uri: string) {
    const t = getToken ? await getToken() : token;
    if (!t) return console.error('No token available to play URI');
    if (!deviceId) {
      // attempt to transfer playback to our device (if deviceId becomes available shortly after ready, caller can retry)
      console.warn('No deviceId yet — ensure player is ready before calling playUri');
      return;
    }

    await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${t}` },
      body: JSON.stringify({ uris: [uri] })
    });
  }
</script>

<style>
  .spotify-player {
    position: fixed;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    z-index: 1000;
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .spotify-player button { background: none; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.5rem 0.75rem; border-radius: 6px }
</style>

{#if token}
  <div class="spotify-player">
    <div>{name}</div>
    <div>
      <button on:click={play}>Play</button>
      <button on:click={pause}>Pause</button>
    </div>
  </div>
{/if}
