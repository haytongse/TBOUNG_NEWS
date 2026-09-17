import { runMigrations, pool } from './db.js'

runMigrations()
  .then(() => {
    console.log('[db] All migrations completed.')
    pool.end()
  })
  .catch((err) => {
    console.error('[db] Migration failed:', err.message)
    console.error('[db] Code:', err.code)
    console.error('[db] Host:', err.address || err.host)
    console.error('[db] Port:', err.port)
    console.error('[db] Full error:', err)
    pool.end()
    process.exit(1)
  })
