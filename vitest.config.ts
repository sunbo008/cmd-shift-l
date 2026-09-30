import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    include: ['tests/**/*.spec.ts', 'tests/**/*.spec.tsx'],
  },
  css: {
    modules: {
      classNameStrategy: 'non-scoped',
    },
  },
  resolve: {
    alias: {
      '@dsh-plugin/cmd-shift-l': resolve(import.meta.dirname, 'src/index.ts'),
    },
  },
})
