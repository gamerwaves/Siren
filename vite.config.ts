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
      '8b0da2dc4f9b.ngrok-free.app', // <--- add your ngrok hostname here
      'localhost'
    ]
  }
});
