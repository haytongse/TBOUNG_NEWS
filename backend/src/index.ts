import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { logger } from 'hono/logger'
import { sign, verify } from 'hono/jwt'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { pool, runMigrations } from './db.js'

const JWT_SECRET = 'news-police-jwt-secret-2026'
const PORT       = 3337

const app = new Hono()
app.use('*', logger())
app.use('*', cors({ origin: ['http://localhost:5173'], credentials: true }))
app.use('/uploads/*', serveStatic({ root: './' }))

// ── Auth middleware ───────────────────────────────────────────────────────────

async function authMiddleware(c: any, next: any) {
  const auth  = c.req.header('Authorization') ?? ''
  const token = auth.replace('Bearer ', '')
  if (!token) return c.json({ message: 'Unauthorized' }, 401)
  try {
    const payload = await verify(token, JWT_SECRET, 'HS256')
    c.set('jwtPayload', payload)
    await next()
  } catch {
    return c.json({ message: 'Invalid or expired token' }, 401)
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toMySQL(dateStr: string): string {
  return new Date(dateStr).toISOString().replace('T', ' ').slice(0, 19)
}

function mapArticle(row: any) {
  if (!row) return null
  return {
    ...row,
    featured:   !!row.featured,
    breaking:   !!row.breaking,
    show_video: !!row.show_video,
    category:   row.cat_id ? { id: row.cat_id, name: row.cat_name, name_kh: row.cat_name_kh, slug: row.cat_slug } : null,
  }
}

// ── Paginated article query ───────────────────────────────────────────────────

async function queryArticles(q: URLSearchParams) {
  const conditions: string[] = []
  const params: any[]        = []

  if (q.get('status'))              { conditions.push('a.status = ?');       params.push(q.get('status')) }
  if (q.get('featured')   === 'true') { conditions.push('a.featured = 1') }
  if (q.get('breaking')   === 'true') { conditions.push('a.breaking = 1') }
  if (q.get('show_video') === 'true')  { conditions.push("a.show_video = 1 AND a.video_url != ''") }
  if (q.get('show_video') === 'false') { conditions.push("(a.show_video = 0 OR a.video_url = '')") }
  if (q.get('category_id'))         { conditions.push('a.category_id = ?');  params.push(Number(q.get('category_id'))) }
  if (q.get('category_slug'))       { conditions.push('c.slug = ?');         params.push(q.get('category_slug')) }
  if (q.get('menu_id'))             { conditions.push('a.menu_id = ?');      params.push(Number(q.get('menu_id'))) }
  if (q.get('search')) {
    conditions.push('(a.title_kh LIKE ? OR a.title LIKE ?)')
    const s = `%${q.get('search')}%`; params.push(s, s)
  }

  const where  = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const limit  = Math.min(parseInt(q.get('limit') ?? '20'), 500)
  const page   = Math.max(parseInt(q.get('page')  ?? '1'),  1)
  const offset = (page - 1) * limit

  const [countRows] = await pool.execute<any[]>(
    `SELECT COUNT(*) AS n FROM articles a LEFT JOIN categories c ON c.id = a.category_id ${where}`, params
  )
  const total = (countRows as any[])[0].n

  const [rows] = await pool.execute<any[]>(
    `SELECT a.*,
            c.id AS cat_id, c.name AS cat_name, c.name_kh AS cat_name_kh, c.slug AS cat_slug
     FROM articles a
     LEFT JOIN categories c ON c.id = a.category_id
     ${where}
     ORDER BY a.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  )

  return {
    data:       (rows as any[]).map(mapArticle),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  }
}

// ── API Router ────────────────────────────────────────────────────────────────

const api = new Hono().basePath('/api')

// ─────────────────────────────────────────────
//  Public
// ─────────────────────────────────────────────

api.get('/v1/public/settings', async (c) => {
  const [rows] = await pool.execute<any[]>('SELECT `key`, value FROM settings')
  const s: Record<string, string> = {}
  ;(rows as any[]).forEach((r) => { s[r.key] = r.value })
  return c.json(s)
})

api.get('/v1/public/menus', async (c) => {
  const [rows] = await pool.execute('SELECT * FROM menus WHERE active = 1 ORDER BY order_num')
  return c.json(rows)
})

api.get('/v1/public/categories', async (c) => {
  const [rows] = await pool.execute(`
    SELECT c.*, COUNT(a.id) AS \`count\`
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id AND a.status = 'published'
    GROUP BY c.id
    ORDER BY c.id
  `)
  return c.json(rows)
})

api.get('/v1/public/articles', async (c) => {
  const q = new URLSearchParams(c.req.query() as Record<string, string>)
  return c.json(await queryArticles(q))
})

api.get('/v1/public/articles/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [rows] = await pool.execute<any[]>(`
    SELECT a.*, c.id AS cat_id, c.name AS cat_name, c.name_kh AS cat_name_kh, c.slug AS cat_slug
    FROM articles a
    LEFT JOIN categories c ON c.id = a.category_id
    WHERE a.id = ?`, [id])
  if (!(rows as any[]).length) return c.json({ message: 'Not found' }, 404)
  await pool.execute('UPDATE articles SET views = views + 1 WHERE id = ?', [id])
  return c.json(mapArticle((rows as any[])[0]))
})

api.get('/v1/public/sliders', async (c) => {
  const [rows] = await pool.execute('SELECT * FROM sliders WHERE active = 1 ORDER BY order_num')
  return c.json(rows)
})

// ─────────────────────────────────────────────
//  Auth
// ─────────────────────────────────────────────

api.post('/v1/auth/login', async (c) => {
  const { email, password } = await c.req.json<{ email: string; password: string }>()
  const [rows] = await pool.execute<any[]>(
    "SELECT * FROM users WHERE email = ? AND status = 'active'", [email]
  )
  const user = (rows as any[])[0]
  if (!user || user.password_hash !== password)
    return c.json({ message: 'Invalid email or password' }, 401)

  const token = await sign(
    { sub: user.id, role: user.role, exp: Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60 },
    JWT_SECRET, 'HS256'
  )
  const { password_hash: _, ...safeUser } = user
  return c.json({ data: { user: safeUser, token } })
})

api.post('/v1/account/logout', async (c) => c.json({ message: 'Logged out successfully' }))

// ─────────────────────────────────────────────
//  Admin — Articles
// ─────────────────────────────────────────────

api.get('/v1/admin/articles', authMiddleware, async (c) => {
  const q = new URLSearchParams(c.req.query() as Record<string, string>)
  return c.json(await queryArticles(q))
})

api.get('/v1/admin/articles/:id', authMiddleware, async (c) => {
  const [rows] = await pool.execute<any[]>('SELECT * FROM articles WHERE id = ?', [c.req.param('id')])
  if (!(rows as any[]).length) return c.json({ message: 'Not found' }, 404)
  return c.json(mapArticle((rows as any[])[0]))
})

api.post('/v1/admin/articles', authMiddleware, async (c) => {
  const b = await c.req.json<any>()
  const [result] = await pool.execute<any>(
    `INSERT INTO articles
       (title, title_kh, excerpt, excerpt_kh, content, content_kh,
        image, video_url, category_id, menu_id, author, status, featured, breaking, show_video, published_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
    [
      b.title ?? '', b.title_kh ?? '', b.excerpt ?? '', b.excerpt_kh ?? '',
      b.content ?? '', b.content_kh ?? '', b.image ?? '', b.video_url ?? '',
      b.category_id || null, b.menu_id || null, b.author ?? 'Admin',
      b.status ?? 'draft', b.featured ? 1 : 0, b.breaking ? 1 : 0, b.show_video ? 1 : 0,
      toMySQL(b.published_at ?? new Date().toISOString()),
    ]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM articles WHERE id = ?', [(result as any).insertId])
  return c.json(mapArticle((rows as any[])[0]), 201)
})

api.put('/v1/admin/articles/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const b  = await c.req.json<any>()
  const [check] = await pool.execute<any[]>('SELECT id FROM articles WHERE id = ?', [id])
  if (!(check as any[]).length) return c.json({ message: 'Not found' }, 404)
  await pool.execute(
    `UPDATE articles SET
       title=?, title_kh=?, excerpt=?, excerpt_kh=?, content=?, content_kh=?,
       image=?, video_url=?, category_id=?, menu_id=?, author=?, status=?,
       featured=?, breaking=?, show_video=?, published_at=?
     WHERE id=?`,
    [
      b.title ?? '', b.title_kh ?? '', b.excerpt ?? '', b.excerpt_kh ?? '',
      b.content ?? '', b.content_kh ?? '', b.image ?? '', b.video_url ?? '',
      b.category_id || null, b.menu_id || null, b.author ?? 'Admin',
      b.status ?? 'draft', b.featured ? 1 : 0, b.breaking ? 1 : 0, b.show_video ? 1 : 0,
      toMySQL(b.published_at ?? new Date().toISOString()), id,
    ]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM articles WHERE id = ?', [id])
  return c.json(mapArticle((rows as any[])[0]))
})

api.delete('/v1/admin/articles/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const [check] = await pool.execute<any[]>('SELECT id FROM articles WHERE id = ?', [id])
  if (!(check as any[]).length) return c.json({ message: 'Not found' }, 404)
  await pool.execute('DELETE FROM articles WHERE id = ?', [id])
  return c.json({ message: 'Deleted' })
})

// ─────────────────────────────────────────────
//  Admin — Categories
// ─────────────────────────────────────────────

api.get('/v1/admin/categories', authMiddleware, async (c) => {
  const [rows] = await pool.execute(`
    SELECT c.*, COUNT(a.id) AS \`count\`
    FROM categories c
    LEFT JOIN articles a ON a.category_id = c.id
    GROUP BY c.id ORDER BY c.id
  `)
  return c.json(rows)
})

api.post('/v1/admin/categories', authMiddleware, async (c) => {
  const b = await c.req.json<any>()
  const [result] = await pool.execute<any>(
    'INSERT INTO categories (name, name_kh, slug) VALUES (?,?,?)', [b.name, b.name_kh, b.slug]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM categories WHERE id = ?', [(result as any).insertId])
  return c.json((rows as any[])[0], 201)
})

api.put('/v1/admin/categories/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const b  = await c.req.json<any>()
  await pool.execute('UPDATE categories SET name=?, name_kh=?, slug=? WHERE id=?', [b.name, b.name_kh, b.slug, id])
  const [rows] = await pool.execute<any[]>('SELECT * FROM categories WHERE id = ?', [id])
  return c.json((rows as any[])[0])
})

api.delete('/v1/admin/categories/:id', authMiddleware, async (c) => {
  await pool.execute('DELETE FROM categories WHERE id = ?', [parseInt(c.req.param('id'))])
  return c.json({ message: 'Deleted' })
})

api.get('/v1/admin/tags', authMiddleware, async (c) => {
  const [rows] = await pool.execute('SELECT * FROM tags ORDER BY id')
  return c.json(rows)
})

// ─────────────────────────────────────────────
//  Admin — Menus
// ─────────────────────────────────────────────

api.get('/v1/admin/menus', authMiddleware, async (c) => {
  const [rows] = await pool.execute('SELECT * FROM menus ORDER BY order_num')
  return c.json(rows)
})

api.post('/v1/admin/menus', authMiddleware, async (c) => {
  const b = await c.req.json<any>()
  const [result] = await pool.execute<any>(
    'INSERT INTO menus (name, name_kh, slug, order_num, active) VALUES (?,?,?,?,?)',
    [b.name, b.name_kh, b.slug, b.order_num ?? 0, b.active ? 1 : 1]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM menus WHERE id = ?', [(result as any).insertId])
  return c.json((rows as any[])[0], 201)
})

api.put('/v1/admin/menus/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const b  = await c.req.json<any>()
  await pool.execute(
    'UPDATE menus SET name=?, name_kh=?, slug=?, order_num=?, active=? WHERE id=?',
    [b.name, b.name_kh, b.slug, b.order_num ?? 0, b.active ? 1 : 0, id]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM menus WHERE id = ?', [id])
  return c.json((rows as any[])[0])
})

api.delete('/v1/admin/menus/:id', authMiddleware, async (c) => {
  await pool.execute('DELETE FROM menus WHERE id = ?', [parseInt(c.req.param('id'))])
  return c.json({ message: 'Deleted' })
})

// ─────────────────────────────────────────────
//  Admin — Sliders
// ─────────────────────────────────────────────

api.get('/v1/admin/sliders', authMiddleware, async (c) => {
  const [rows] = await pool.execute('SELECT * FROM sliders ORDER BY order_num')
  return c.json(rows)
})

api.post('/v1/admin/sliders', authMiddleware, async (c) => {
  const b = await c.req.json<any>()
  const [result] = await pool.execute<any>(
    'INSERT INTO sliders (title, title_kh, image, link, order_num, active) VALUES (?,?,?,?,?,?)',
    [b.title, b.title_kh ?? '', b.image, b.link ?? '/', b.order_num ?? 0, 1]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM sliders WHERE id = ?', [(result as any).insertId])
  return c.json((rows as any[])[0], 201)
})

api.put('/v1/admin/sliders/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const b  = await c.req.json<any>()
  await pool.execute(
    'UPDATE sliders SET title=?, title_kh=?, image=?, link=?, order_num=?, active=? WHERE id=?',
    [b.title, b.title_kh ?? '', b.image, b.link ?? '/', b.order_num ?? 0, b.active ? 1 : 0, id]
  )
  const [rows] = await pool.execute<any[]>('SELECT * FROM sliders WHERE id = ?', [id])
  return c.json((rows as any[])[0])
})

api.delete('/v1/admin/sliders/:id', authMiddleware, async (c) => {
  await pool.execute('DELETE FROM sliders WHERE id = ?', [parseInt(c.req.param('id'))])
  return c.json({ message: 'Deleted' })
})

// ─────────────────────────────────────────────
//  Admin — Users
// ─────────────────────────────────────────────

api.get('/v1/admin/users', authMiddleware, async (c) => {
  const [rows] = await pool.execute('SELECT id, name, email, role, status, created_at FROM users')
  return c.json(rows)
})

api.post('/v1/admin/users', authMiddleware, async (c) => {
  const b = await c.req.json<any>()
  const [result] = await pool.execute<any>(
    'INSERT INTO users (name, email, password_hash, role, status) VALUES (?,?,?,?,?)',
    [b.name, b.email, b.password ?? 'changeme', b.role ?? 'editor', b.status ?? 'active']
  )
  const [rows] = await pool.execute<any[]>(
    'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?',
    [(result as any).insertId]
  )
  return c.json((rows as any[])[0], 201)
})

api.put('/v1/admin/users/:id', authMiddleware, async (c) => {
  const id = parseInt(c.req.param('id'))
  const b  = await c.req.json<any>()
  await pool.execute(
    'UPDATE users SET name=?, email=?, role=?, status=? WHERE id=?',
    [b.name, b.email, b.role, b.status, id]
  )
  const [rows] = await pool.execute<any[]>(
    'SELECT id, name, email, role, status, created_at FROM users WHERE id = ?', [id]
  )
  return c.json((rows as any[])[0])
})

api.delete('/v1/admin/users/:id', authMiddleware, async (c) => {
  await pool.execute('DELETE FROM users WHERE id = ?', [parseInt(c.req.param('id'))])
  return c.json({ message: 'Deleted' })
})

// ─────────────────────────────────────────────
//  Admin — Settings
// ─────────────────────────────────────────────

api.get('/v1/admin/settings', authMiddleware, async (c) => {
  const [rows] = await pool.execute<any[]>('SELECT `key`, value FROM settings')
  const s: Record<string, string> = {}
  ;(rows as any[]).forEach((r) => { s[r.key] = r.value })
  return c.json(s)
})

api.put('/v1/admin/settings', authMiddleware, async (c) => {
  const body = await c.req.json<Record<string, string>>()
  for (const [k, v] of Object.entries(body)) {
    await pool.execute(
      'INSERT INTO settings (`key`, value) VALUES (?,?) ON DUPLICATE KEY UPDATE value=?',
      [k, v, v]
    )
  }
  const [rows] = await pool.execute<any[]>('SELECT `key`, value FROM settings')
  const s: Record<string, string> = {}
  ;(rows as any[]).forEach((r) => { s[r.key] = r.value })
  return c.json(s)
})

// ─────────────────────────────────────────────
//  Admin — File Upload
// ─────────────────────────────────────────────

api.post('/v1/admin/upload', authMiddleware, async (c) => {
  const body   = await c.req.parseBody()
  const file   = body['file']
  const folder = (c.req.query('folder') ?? 'general').replace(/[^a-z0-9-_]/g, '')
  if (!(file instanceof File)) return c.json({ message: 'No file provided' }, 400)

  const ext       = file.name.split('.').pop() ?? 'bin'
  const filename  = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
  const uploadDir = join(process.cwd(), 'uploads', folder)
  if (!existsSync(uploadDir)) await mkdir(uploadDir, { recursive: true })
  await writeFile(join(uploadDir, filename), Buffer.from(await file.arrayBuffer()))
  return c.json({ data: { url: `/uploads/${folder}/${filename}` } }, 201)
})

// ─────────────────────────────────────────────
//  Legacy routes
// ─────────────────────────────────────────────

api.get('/categories', async (c) => {
  const [rows] = await pool.execute('SELECT * FROM categories ORDER BY id')
  return c.json({ data: rows })
})

api.get('/posts', async (c) => {
  const q = new URLSearchParams(c.req.query() as Record<string, string>)
  return c.json(await queryArticles(q))
})

api.get('/posts/:id', async (c) => {
  const id = parseInt(c.req.param('id'))
  const [rows] = await pool.execute<any[]>('SELECT * FROM articles WHERE id = ?', [id])
  if (!(rows as any[]).length) return c.json({ error: 'Not found' }, 404)
  await pool.execute('UPDATE articles SET views = views + 1 WHERE id = ?', [id])
  return c.json({ data: mapArticle((rows as any[])[0]) })
})

api.get('/stats', async (c) => {
  const [[total], [views], [cats]] = await Promise.all([
    pool.execute<any[]>('SELECT COUNT(*) AS n FROM articles'),
    pool.execute<any[]>('SELECT COALESCE(SUM(views),0) AS v FROM articles'),
    pool.execute<any[]>('SELECT COUNT(*) AS n FROM categories'),
  ])
  return c.json({ data: {
    totalPosts: (total as any[])[0].n,
    totalViews: (views as any[])[0].v,
    categories: (cats  as any[])[0].n,
  }})
})

app.route('/', api)

// ── Start server ──────────────────────────────────────────────────────────────

runMigrations()
  .then(() => {
    serve({ fetch: app.fetch, port: PORT }, () => {
      console.log(`Hono API → http://localhost:${PORT}`)
      console.log(`  DB: MySQL db_news @ localhost:3308 (Docker)`)
      console.log(`  Demo: admin@police.gov.kh / admin123`)
    })
  })
  .catch((err) => {
    console.error('[db] Migration failed:', err.message)
    process.exit(1)
  })
