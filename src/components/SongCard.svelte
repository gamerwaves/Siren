<script lang="ts">
  import type { Track } from '$lib/spotify';
  export let song: Track;
</script>

<div class="song-card p-4 bg-white shadow-lg rounded-lg w-72">
  <img src={song.album.images[0].url} alt={song.name} class="rounded-lg mb-3" />
  <h3 class="font-bold">{song.name}</h3>
  <p class="text-gray-600">{song.artists[0].name}</p>
</div>
