import 'dotenv/config'
import mysql from 'mysql2/promise'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const MIG_DIR   = join(__dirname, '../migrations')

export const pool = mysql.createPool({
  host:               process.env.DB_HOST     ?? 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     ?? 'root',
  password:           process.env.DB_PASSWORD ?? '',
  database:           process.env.DB_DATABASE ?? 'db_news',
  charset:            'utf8mb4',
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit:    10,
})

export async function runMigrations() {
  await pool.execute(`
    CREATE TABLE IF NOT EXISTS migrations (
      id     INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
      name   VARCHAR(255) NOT NULL UNIQUE,
      run_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `)

  const [rows] = await pool.execute('SELECT name FROM migrations')
  const applied = new Set((rows as any[]).map((r) => r.name))

  const files = readdirSync(MIG_DIR).filter((f) => f.endsWith('.sql')).sort()

  for (const file of files) {
    if (applied.has(file)) continue
    const sql = readFileSync(join(MIG_DIR, file), 'utf8')
    await pool.query(sql)
    await pool.execute('INSERT IGNORE INTO migrations (name) VALUES (?)', [file])
    console.log(`[db] Applied migration: ${file}`)
  }
}
