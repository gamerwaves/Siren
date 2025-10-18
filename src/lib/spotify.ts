export interface Track {
  id: string;
  name: string;
  artists: { name: string }[];
  album: { images: { url: string }[] };
  preview_url?: string;
}

export async function getRecommendations(token: string, seedTracks: string[] = []): Promise<Track[]> {
  const url = `https://api.spotify.com/v1/recommendations?limit=10&seed_tracks=${seedTracks.join(',')}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  return data.tracks;
}

export async function likeSong(trackId: string, token: string): Promise<void> {
  await fetch(`https://api.spotify.com/v1/me/tracks?ids=${trackId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` }
  });
}

export async function getCurrentUser(token: string): Promise<any> {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to fetch current user');
  return res.json();
}
