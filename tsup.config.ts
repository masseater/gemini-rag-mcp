import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  target: 'node22',
  splitting: false,
  treeshake: true,
  bundle: true,
  minify: false,
  shims: true, // Enable shims for __dirname, __filename, import.meta.url
});
