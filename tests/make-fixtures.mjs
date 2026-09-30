import { DatabaseSync } from 'node:sqlite'
import { mkdirSync, writeFileSync, rmSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const fixturesRoot = join(here, 'fixtures')
rmSync(fixturesRoot, { recursive: true, force: true })

const readyDir = join(fixturesRoot, 'ready', '.codegraph')
mkdirSync(readyDir, { recursive: true })
const dbPath = join(readyDir, 'codegraph.db')

const db = new DatabaseSync(dbPath)
db.exec(`
CREATE TABLE files (
  path TEXT PRIMARY KEY,
  content_hash TEXT NOT NULL,
  language TEXT NOT NULL,
  size INTEGER NOT NULL,
  modified_at INTEGER NOT NULL,
  indexed_at INTEGER NOT NULL,
  node_count INTEGER DEFAULT 0,
  errors TEXT,
  generated INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE nodes (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  name TEXT NOT NULL,
  qualified_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  language TEXT NOT NULL,
  start_line INTEGER NOT NULL,
  end_line INTEGER NOT NULL,
  start_column INTEGER NOT NULL,
  end_column INTEGER NOT NULL,
  docstring TEXT,
  signature TEXT,
  visibility TEXT,
  is_exported INTEGER DEFAULT 0,
  is_async INTEGER DEFAULT 0,
  is_static INTEGER DEFAULT 0,
  is_abstract INTEGER DEFAULT 0,
  decorators TEXT,
  type_parameters TEXT,
  return_type TEXT,
  updated_at INTEGER NOT NULL
);
`)
db.prepare(
  `INSERT INTO files (path, content_hash, language, size, modified_at, indexed_at)
   VALUES (?, 'h', 'ts', 1, 0, 0)`,
).run('src/foo.ts')
db.prepare(
  `INSERT INTO files (path, content_hash, language, size, modified_at, indexed_at)
   VALUES (?, 'h', 'ts', 1, 0, 0)`,
).run('src/other.ts')
db.prepare(
  `INSERT INTO nodes (
    id, kind, name, qualified_name, file_path, language,
    start_line, end_line, start_column, end_column, updated_at
  ) VALUES (?, 'function', ?, ?, ?, 'ts', 10, 12, 0, 1, 0)`,
).run('n1', 'Bar', 'src.foo.Bar', 'src/foo.ts')
db.close()

mkdirSync(join(fixturesRoot, 'missing'), { recursive: true })
const corruptDir = join(fixturesRoot, 'corrupt', '.codegraph')
mkdirSync(corruptDir, { recursive: true })
writeFileSync(join(corruptDir, 'codegraph.db'), 'not a sqlite database')

console.log('fixtures written')
