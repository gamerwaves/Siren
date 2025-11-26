<div align="center">
  <a href="https://moonshot.hackclub.com" target="_blank">
    <img src="https://hc-cdn.hel1.your-objectstorage.com/s/v3/35ad2be8c916670f3e1ac63c1df04d76a4b337d1_moonshot.png" 
         alt="This project is part of Moonshot, a 4-day hackathon in Florida visiting Kennedy Space Center and Universal Studios!" 
         style="width: 100%;">
  </a>
</div>

# Siren

## What is this?
Siren is a tinderswipe-like app but for songs. It picks a random song and plays it using the Spotify Playback SDK.

__THIS REQUIRES A SPOTIFY PREMIUM ACCOUNT!!!__

## Developing

Once you've cloned and installed dependencies with `npm install` (or `pnpm install` or `yarn`), start a development server:

```sh
npm run dev

# or start the server and open the app in a new browser tab
npm run dev -- --open
```

## Building

To build siren:

```sh
npm run build
```

You can preview the production build with `npm run preview`.

> To deploy Siren, you may need to install an [adapter](https://svelte.dev/docs/kit/adapters) for your target environment.
