<script lang="ts">
  import SongCard from './SongCard.svelte';
  import type { Track } from '$lib/spotify';
  import { onMount } from 'svelte';
  import { getRecommendations, likeSong } from '$lib/spotify';
  import { browser } from '$app/environment';
  import { onDestroy } from 'svelte';

  // CommonJS import fix for svelte-gestures
  let createGesture: any;
  if (browser) {
    // Only import in browser to avoid SSR issues
    import('svelte-gestures').then(pkg => {
      createGesture = pkg.createGesture;
    });
  }

  let tracks: Track[] = [];
  let token = '';

  onMount(async () => {
    token = localStorage.getItem('spotify_token') ?? '';
    if (token) tracks = await getRecommendations(token);
  });

  async function swipeRight(track: Track) {
    if (!token) return;
    await likeSong(track.id, token);
    nextTrack();
  }

  function swipeLeft(track: Track) {
    nextTrack();
  }

  function nextTrack() {
    tracks.shift();
    if (tracks.length < 3 && token) {
      getRecommendations(token).then(newTracks => tracks.push(...newTracks));
    }
  }
</script>

{#if browser && createGesture}
  <div class="relative w-full h-full">
    {#each tracks as track (track.id)}
      <div
        use:createGesture={{
          onEnd: (e: any) => {
            if (e.detail.deltaX > 100) swipeRight(track);
            else if (e.detail.deltaX < -100) swipeLeft(track);
          }
        }}
        class="absolute top-0 left-0 w-full flex justify-center"
      >
        <SongCard song={track} />
      </div>
    {/each}
  </div>
{:else}
  <p>Loading tracks...</p>
{/if}

<style>
  .absolute {
    touch-action: pan-y;
    cursor: grab;
  }
</style>
