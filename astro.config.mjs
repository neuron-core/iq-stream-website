// @ts-check
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://iq-stream.dev',
  // Not the default _astro/: Vercel's Astro preset marks every response under /_astro/ immutable for a year,
  // 404s included, so a browser that asks for a new file mid-deploy keeps the 404. vercel.json caches /_assets/
  // for a year only when the file exists.
  build: { assets: '_assets' },
  // A parent's scoped styles reach a child component through its `class` prop.
  scopedStyleStrategy: 'class',
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // Breakpoint mixins are available in every <style lang="scss"> block.
          loadPaths: [fileURLToPath(new URL('./src/styles', import.meta.url))],
          additionalData: '@use "breakpoints" as *;\n',
        },
      },
    },
  },
});
