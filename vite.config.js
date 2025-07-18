import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/cantonese-vocab-app/', // IMPORTANT: Replace with your repository name.
                                  // This path is relative to your domain (e.g., yourusername.github.io/YOUR_REPO_NAME/)
});