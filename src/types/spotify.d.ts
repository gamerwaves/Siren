// Minimal Spotify Web Playback SDK types used in this project
// This file provides minimal declarations so TypeScript won't error when referencing `Spotify`.

declare namespace Spotify {
  interface Player {
    addListener(event: string, cb: (...args: any[]) => void): void;
    removeListener?(event: string, cb?: (...args: any[]) => void): void;
    connect(): Promise<boolean>;
    getCurrentState(): Promise<any>;
    // any other members used can be added here as needed
  }

  interface PlayerConstructor {
    new (options: any): Player;
  }

  const Player: PlayerConstructor;
}

declare global {
  interface Window {
    onSpotifyWebPlaybackSDKReady?: () => void;
    Spotify?: typeof Spotify & { Player: Spotify.PlayerConstructor };
  }
}

export {};
