<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';

  let token: string | null = "BQDqM2jceqUG0LBC_9RPsAOg4AMwtBjONqosE00OmJrhmS9vlH";
  let player: Spotify.Player | null = null;
  let deviceId: string | null = null;
  let isReady = false;
  let currentTrack: any = null;
  let isPlaying = false;

  // Remove hardcoded URI, will fetch a random track

  // Will define after SDK ready
  let play: ((uri: string) => Promise<void>) | null = null;
  let pause: (() => Promise<void>) | null = null;
  let resume: (() => Promise<void>) | null = null;
  let togglePlay: (() => void) | null = null;

  onMount(() => {
    if (!browser) return;

    token = localStorage.getItem('spotify_token');
    if (!token) {
      window.location.href = '/login';
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://sdk.scdn.co/spotify-player.js';
    document.body.appendChild(script);

    (window as any).onSpotifyWebPlaybackSDKReady = () => {
      player = new (window as any).Spotify.Player({
        name: 'Siren Player',
        getOAuthToken: (cb: any) => cb(token),
        volume: 0.8
      });

      player.addListener('ready', async ({ device_id }: any) => {
        deviceId = device_id;
        isReady = true;
        console.log('Ready with Device ID', device_id);

        // Initialize playback functions
        play = async (uri: string) => {
          if (!deviceId || !token) return;
          await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
            method: 'PUT',
            body: JSON.stringify({ uris: [uri] }),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
          });
          isPlaying = true;
        };

        pause = async () => {
          if (!token) return;
          await fetch(`https://api.spotify.com/v1/me/player/pause`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          isPlaying = false;
        };

        resume = async () => {
          if (!token) return;
          await fetch(`https://api.spotify.com/v1/me/player/play`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          });
          isPlaying = true;
        };

        togglePlay = () => {
          if (!play || !pause || !resume) return;
          if (isPlaying) pause();
          else resume();
        };

        // Search for a random track and queue it (paused)
        if (token) {
          // Pick a random search term (single letter)
          const letters = 'abcdefghijklmnopqrstuvwxyz';
          const randomLetter = letters[Math.floor(Math.random() * letters.length)];
          // Search for tracks with the random letter
          const searchRes = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(randomLetter)}&type=track&limit=50`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const searchData = await searchRes.json();
          const tracks = searchData.tracks?.items || [];
          if (tracks.length > 0) {
            const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
            const randomUri = randomTrack.uri;
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
              method: 'PUT',
              body: JSON.stringify({ uris: [randomUri] }),
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
            });
            await pause(); // immediately pause so it queues but doesn't play
          } else {
            console.error('No tracks found for random search');
          }
        }
      });

      player.addListener('player_state_changed', (state: any) => {
        if (!state) return;
        currentTrack = state.track_window.current_track;
        isPlaying = !state.paused;
      });

      player.addListener('initialization_error', ({ message }: any) => console.error('Init error:', message));
      player.addListener('authentication_error', ({ message }: any) => console.error('Auth error:', message));
      player.addListener('account_error', ({ message }: any) => console.error('Account error:', message));
      player.addListener('playback_error', ({ message }: any) => console.error('Playback error:', message));

      player.connect();
    };
  });
</script>

<style>
  .player {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #232323;
    color: white;
    text-align: center;
    gap: 12px;
    border-radius: 20px;
    box-shadow: 0 4px 24px 0 rgba(0,0,0,0.4);
    padding: 20px;
    max-width: 340px;
    width: 100%;
    max-height: 420px;
    overflow: auto;
  }

  .controls {
    display: flex;
    gap: 16px;
  }

  button {
    background: #1db954;
    border: none;
    color: white;
    padding: 12px 20px;
    font-size: 1rem;
    border-radius: 24px;
    cursor: pointer;
    transition: 0.2s;
  }

  button:hover {
    background: #1ed760;
  }

  img {
    width: 160px;
    height: 160px;
    border-radius: 8px;
    box-shadow: 0 2px 12px 0 rgba(0,0,0,0.25);
  }

</style>

<div class="player">

  {#if !isReady}
    <p>Loading Spotify SDK...</p>
  {:else if currentTrack}
    <div>
      <img src={currentTrack.album.images[0].url} alt="Album cover" />
      <h2>{currentTrack.name}</h2>
      <p>{currentTrack.artists[0].name}</p>
    </div>
    <div class="controls">
      <button on:click={togglePlay}>{isPlaying ? 'Pause' : 'Play'}</button>
    </div>
  {:else}
    <p>Loading track...</p>
  {/if}
</div>
