import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'packages/*/tests/**/*.spec.ts', 'packages/*/tests/**/*.spec.tsx'],
  },
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
  resolve: {
    alias: {
      '@dsh-plugin/workspace-code-search': resolve(
        import.meta.dirname,
        'packages/workspace-code-search/src/index.ts',
      ),
      '@dsh-plugin/api-workspace-code-search/client': resolve(
        import.meta.dirname,
        'packages/api-workspace-code-search/src/client.ts',
      ),
      '@dsh-plugin/api-workspace-code-search': resolve(
        import.meta.dirname,
        'packages/api-workspace-code-search/src/index.ts',
      ),
    },
  },
})
