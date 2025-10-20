import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: [
      '8b0da2dc4f9b.ngrok-free.app',
      'localhost',
      'dwait.local',
      '0629f13f381f.ngrok-free.app'
    ]
  }
});
