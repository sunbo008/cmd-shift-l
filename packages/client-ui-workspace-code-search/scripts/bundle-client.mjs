/**
 * Emit `lib/client.js` as a dsh ModuleLoader factory (CJS-in-factory + CSS Modules).
 * Mirrors the harness `clientBundle` banner/footer contract for external packages.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const PKG_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const PACKAGE_NAME = '@dsh-plugin/client-ui-workspace-code-search'
const ENTRY = resolve(PKG_ROOT, 'src/client/index.ts')
const OUT = resolve(PKG_ROOT, 'lib/client.js')

/** Shell-seeded module table keys — keep as require() externals. */
const EXTERNAL = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  '@deepseek-ai/cordis',
  '@deepseek-ai/dsh-client-store',
  '@deepseek-ai/dsh-client-ui-slots',
  '@deepseek-ai/dsh-client-ui-primitives',
  '@deepseek-ai/dsh-client-ui-dockkit',
]

/**
 * @param {string} filePath
 * @param {string} local
 */
function hashedClass(filePath, local) {
  const digest = createHash('sha256').update(`${filePath}:${local}`).digest('hex').slice(0, 8)
  // CSS identifiers cannot start with a digit.
  return `c${digest}_${local}`
}

/** @type {esbuild.Plugin} */
const cssModulesPlugin = {
  name: 'css-modules-inline',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
      const source = await readFile(args.path, 'utf8')
      const classMap = /** @type {Record<string, string>} */ ({})
      const transformed = source.replace(
        /\.([A-Za-z_][\w-]*)/g,
        (match, local, offset) => {
          // Skip nested selectors that are not class starts at a boundary.
          const prev = source[offset - 1]
          if (prev !== undefined && /[\w-]/.test(prev)) return match
          const name = hashedClass(args.path, local)
          classMap[local] = name
          return `.${name}`
        },
      )
      const tagId = `${PACKAGE_NAME}/${args.path.split('/').pop()}`
      const js = [
        `const css = ${JSON.stringify(transformed)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
        '  const tag = document.createElement("style");',
        `  tag.dataset.plugin = ${JSON.stringify(PACKAGE_NAME)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
      return { contents: js, loader: 'js' }
    })
  },
}

const banner = `window.__ModuleLoader__.load({ id: ${JSON.stringify(PACKAGE_NAME)}, factory: (require) => {`
const footer = 'return module.exports; } });'

await mkdir(dirname(OUT), { recursive: true })

const result = await esbuild.build({
  absWorkingDir: PKG_ROOT,
  entryPoints: [ENTRY],
  outfile: OUT,
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  jsx: 'automatic',
  sourcemap: true,
  write: false,
  external: EXTERNAL,
  plugins: [cssModulesPlugin],
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV ?? 'production'),
  },
  logLevel: 'info',
})

for (const file of result.outputFiles ?? []) {
  let text = file.text
  if (file.path.endsWith('.js')) {
    text = `${banner}\nvar module = { exports: {} }; var exports = module.exports;\n${text}\n${footer}\n`
  }
  await writeFile(file.path, text)
}

console.log(`wrote ${OUT}`)
