/**
 * Emit browser `lib/client.js` (ModuleLoader factory).
 * Host `lib/index.js` + types come from `tsc -p tsconfig.build.json`.
 */
import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(await readFile(resolve(pkgRoot, 'package.json'), 'utf8'))
const id = pkg.name

/** Shell-seeded module-table keys (mirror dsh PLATFORM_MODULES). */
const CLIENT_EXTERNAL = [
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
 * Hash every CSS Modules local class, including compound selectors.
 * @param {string} filePath
 * @param {string} source
 */
function compileCssModule(filePath, source) {
  const classMap = /** @type {Record<string, string>} */ ({})
  const nameFor = (local) => {
    const existing = classMap[local]
    if (existing !== undefined) return existing
    const hash = createHash('sha256').update(`${filePath}:${local}`).digest('hex').slice(0, 8)
    const name = `c${hash}_${local}`
    classMap[local] = name
    return name
  }
  const rewritten = source.replace(/\.([A-Za-z_][\w-]*)/g, (match, local, offset) => {
    const prev = source[offset - 1]
    if (prev !== undefined && /[\w-]/.test(prev)) return match
    return `.${nameFor(local)}`
  })
  return { css: rewritten, classMap }
}

/** @type {esbuild.Plugin} */
const cssModulesPlugin = {
  name: 'dsh-css-modules-inline',
  setup(build) {
    build.onLoad({ filter: /\.module\.css$/ }, async (args) => {
      const source = await readFile(args.path, 'utf8')
      const { css, classMap } = compileCssModule(args.path, source)
      const tagId = `${id}/${args.path.split('/').pop()}`
      const contents = [
        `const css = ${JSON.stringify(css)};`,
        `const tagId = ${JSON.stringify(tagId)};`,
        'if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {',
        '  const tag = document.createElement("style");',
        `  tag.dataset.plugin = ${JSON.stringify(id)};`,
        '  tag.dataset.pluginCss = tagId;',
        '  tag.textContent = css;',
        '  document.head.appendChild(tag);',
        '}',
        `export default ${JSON.stringify(classMap)};`,
      ].join('\n')
      return { contents, loader: 'js' }
    })
  },
}

await mkdir(resolve(pkgRoot, 'lib'), { recursive: true })

const result = await esbuild.build({
  absWorkingDir: pkgRoot,
  entryPoints: [resolve(pkgRoot, 'src/client/index.ts')],
  outfile: resolve(pkgRoot, 'lib/client.js'),
  bundle: true,
  format: 'cjs',
  platform: 'browser',
  target: 'es2024',
  jsx: 'automatic',
  sourcemap: true,
  write: false,
  external: CLIENT_EXTERNAL,
  plugins: [cssModulesPlugin],
  logLevel: 'info',
})

const out = result.outputFiles.find((f) => f.path.endsWith('client.js'))
if (out === undefined) throw new Error('build-client: missing client.js output')
const map = result.outputFiles.find((f) => f.path.endsWith('client.js.map'))

const body = out.text.replace(/\/\/# sourceMappingURL=.*$/gm, '').trimEnd()
const wrapped = [
  `window.__ModuleLoader__.load({ id: ${JSON.stringify(id)}, factory: (require) => {`,
  'var module = { exports: {} }; var exports = module.exports;',
  body,
  'return module.exports; } });',
  '//# sourceMappingURL=client.js.map',
  '',
].join('\n')

await writeFile(resolve(pkgRoot, 'lib/client.js'), wrapped)
if (map !== undefined) {
  await writeFile(resolve(pkgRoot, 'lib/client.js.map'), map.text)
}

console.log(`build: lib/client.js (${wrapped.length} bytes) for ${id}`)
