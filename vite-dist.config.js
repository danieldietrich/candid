import path from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/index.ts'),
      name: 'Candid',
      fileName: (format) => `candid.${format}.js`
    }
  },
  publicDir: false // omit assets in library build
});
