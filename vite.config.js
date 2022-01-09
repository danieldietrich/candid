import { defineConfig } from 'vite'

export default defineConfig(Object.assign({
  build: {
    outDir: "docs"
  }
}, gitpodConfig()));

function gitpodConfig() {
  if (process.env.APP_ENV === 'gitpod') {
    return {
      server: {
        hmr: {
          clientPort: 443
        }
      }
    };
  }
}
