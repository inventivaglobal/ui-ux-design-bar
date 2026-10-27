import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rolldownOptions: {
      onwarn(warning, defaultHandler) {
        // MUI's RSC markers have no server/client boundary in this client-only SPA.
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE' && warning.message.includes('use client')) return;
        defaultHandler(warning);
      },
    },
  },
});
