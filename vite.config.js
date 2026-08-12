import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        research: resolve(__dirname, 'research.html'),
        wordpressDevelopment: resolve(__dirname, 'wordpress-development.html'),
        conversionApi: resolve(__dirname, 'conversion-api-setup.html')
      }
    }
  }
});
