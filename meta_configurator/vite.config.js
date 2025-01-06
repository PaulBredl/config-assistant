import {fileURLToPath, URL} from 'node:url';

import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import vueJsx from "@vitejs/plugin-vue-jsx";
import wasm from 'vite-plugin-wasm';

// Use process.env.USE_BASE_PATH to determine if base path should be included
const useMetaConfiguratorBasePath = process.env.USE_META_CONFIGURATOR_BASE_PATH === 'true';

// https://vitejs.dev/config/
export default defineConfig({
  base: useMetaConfiguratorBasePath ? '/meta-configurator/' : '/',
  plugins: [vue(), vueJsx(), wasm()],
  build: {
    outDir: 'dist',
    minify: true,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    // add test config here
  },
});
