import { runMigrations, pool } from './db.js'

runMigrations()
  .then(() => {
    console.log('[db] All migrations completed.')
    pool.end()
  })
  .catch((err) => {
    console.error('[db] Migration failed:', err.message)
    pool.end()
    process.exit(1)
  })
