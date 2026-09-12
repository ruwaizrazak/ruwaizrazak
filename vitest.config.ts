import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

// LEARN: `astro:content` is a virtual module that only exists inside an Astro
// build, so anything importing it (utils/collections.ts, utils/resolveInternalLink.ts)
// is unimportable under plain Vitest. Aliasing it to a stub lets those utils be
// unit-tested with fixture entries instead of the real content directory.
export default defineConfig({
  test: {
    environment: 'node',
    // Per-file override via a `// @vitest-environment jsdom` docblock — see
    // tests/unit/dom/*. Keeps the node-only tests fast.
    include: ['tests/unit/**/*.test.ts', 'tests/integrity/**/*.test.ts'],
    exclude: ['tests/e2e/**', 'node_modules/**', 'dist/**'],
    testTimeout: 20_000,
  },
  resolve: {
    alias: {
      'astro:content': fileURLToPath(
        new URL('./tests/helpers/astro-content-stub.ts', import.meta.url),
      ),
    },
  },
});
