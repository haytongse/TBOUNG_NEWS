import { useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faNewspaper, faStar, faFolder, faEye, faCheck, faXmark,
  faPlus, faPen, faTrash, faGear, faUsers, faBars,
  faCircleCheck, faCircleExclamation, faTags, faImage, faUpload, faFloppyDisk,
  faPhotoFilm, faVideo, faBell,
  faChevronLeft, faChevronRight, faMagnifyingGlass, faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import api from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import type { Article, Category, ArticleForm } from '../types'
import RichTextEditor from '../components/RichTextEditor'

// ── Types ─────────────────────────────────────────────────────────────────────

type Tab = 'articles' | 'categories' | 'sliders' | 'users' | 'settings'
type StatusFilter = 'all' | 'published' | 'draft'

// ── Constants ─────────────────────────────────────────────────────────────────

const defaultForm: ArticleForm = {
  title: '', title_kh: '', excerpt: '', excerpt_kh: '',
  content: '', content_kh: '', image: '',
  category_id: null, author: 'Admin',
  status: 'draft', featured: false, breaking: false,
  video_url: '', show_video: false,
  published_at: new Date().toISOString().slice(0, 16),
}

const INPUT_CLS = 'w-full px-3 py-2 border border-slate-200 rounded-lg text-[13.5px] text-slate-700 bg-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all'
const LABEL_CLS = 'block text-[12.5px] font-semibold text-slate-600 mb-1'
const SECTION_CLS = 'bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-3'

const ITEMS_PER_PAGE = 10

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseYoutubeId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname.includes('youtube.com')) return u.searchParams.get('v')
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('?')[0]
    return null
  } catch { return null }
}

function getYoutubeEmbedUrl(url: string): string | null {
  const id = parseYoutubeId(url)
  return id ? `https://www.youtube.com/embed/${id}` : null
}

function getYoutubeThumbnail(url: string): string | null {
  const id = parseYoutubeId(url)
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null
}

function YoutubePreview({ url }: { url: string }) {
  const embedUrl = getYoutubeEmbedUrl(url)
  if (!embedUrl) return <p className="text-xs text-red-400">Invalid YouTube URL</p>
  return (
    <div className="rounded overflow-hidden aspect-video bg-black">
      <iframe src={embedUrl} className="w-full h-full" allowFullScreen
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
    </div>
  )
}

// ── Status badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: 'published' | 'draft' | string }) {
  const styles: Record<string, string> = {
    published: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    draft:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
    archived:  'bg-slate-100 text-slate-500 border border-slate-200',
  }
  const dots: Record<string, string> = {
    published: 'bg-emerald-500',
    draft:     'bg-yellow-500',
    archived:  'bg-slate-400',
  }
  const cls = styles[status] ?? 'bg-slate-100 text-slate-500 border border-slate-200'
  const dot = dots[status] ?? 'bg-slate-400'
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full ${cls}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot}`} />
      {status}
    </span>
  )
}

// ── Searchable Select ─────────────────────────────────────────────────────────

interface SearchSelectOption { value: number | string; label: string }
interface SearchSelectProps {
  value: number | string | null
  onChange: (v: number | string | null) => void
  options: SearchSelectOption[]
  placeholder?: string
  className?: string
}

function SearchSelect({ value, onChange, options, placeholder = 'Select…', className = '' }: SearchSelectProps) {
  const [open, setOpen]       = useState(false)
  const [query, setQuery]     = useState('')
  const containerRef          = useRef<HTMLDivElement>(null)

  const selected = options.find((o) => o.value === value)

  const filtered = query.trim()
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false); setQuery('')
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function select(opt: SearchSelectOption | null) {
    onChange(opt ? opt.value : null)
    setOpen(false); setQuery('')
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen((v) => !v); setQuery('') }}
        className={`${INPUT_CLS} flex items-center justify-between text-left`}
      >
        <span className={selected ? 'text-slate-700' : 'text-slate-400'}>
          {selected ? selected.label : placeholder}
        </span>
        <FontAwesomeIcon icon={faChevronRight} className={`text-[10px] text-slate-400 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Search input */}
          <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-100">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="text-slate-300 text-[11px] flex-shrink-0" />
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ស្វែងរក / Search…"
              className="flex-1 text-[12.5px] text-slate-700 outline-none placeholder:text-slate-300 bg-transparent"
            />
            {query && (
              <button type="button" onClick={() => setQuery('')} className="text-slate-300 hover:text-slate-500 text-[10px]">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            )}
          </div>

          {/* Options list */}
          <ul className="max-h-48 overflow-y-auto py-1">
            <li
              onClick={() => select(null)}
              className={`px-3 py-2 text-[12.5px] cursor-pointer transition-colors text-slate-400 hover:bg-slate-50 ${!value ? 'bg-blue-50 text-blue-600 font-medium' : ''}`}
            >
              — {placeholder} —
            </li>
            {filtered.length === 0 ? (
              <li className="px-3 py-2 text-[12px] text-slate-400 text-center">No results</li>
            ) : filtered.map((opt) => (
              <li
                key={opt.value}
                onClick={() => select(opt)}
                className={`px-3 py-2 text-[12.5px] cursor-pointer transition-colors hover:bg-slate-50 ${opt.value === value ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-700'}`}
              >
                {opt.value === value && <FontAwesomeIcon icon={faCheck} className="text-[10px] mr-1.5" />}
                {opt.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Main Admin component ──────────────────────────────────────────────────────

// ── Admin i18n ────────────────────────────────────────────────────────────────

const adminUi = {
  kh: {
    news: 'ព័ត៌មាន', categories: 'ប្រភេទ', sliders: 'Slider', users: 'អ្នកប្រើ', settings: 'ការកំណត់',
    addNews: '+ បន្ថែមអត្ថបទ', addCategory: '+ បន្ថែមប្រភេទ', addSlider: '+ បន្ថែម Slider', addUser: '+ បន្ថែមអ្នកប្រើ',
    search: 'ស្វែងរក...', logout: 'ចាកចេញ',
    save: 'រក្សាទុក', cancel: 'បោះបង់', delete: 'លុប', edit: 'កែ', create: 'បង្កើត', update: 'ធ្វើបច្ចុប្បន្នភាព',
    deleteConfirm: 'តើអ្នកពិតជាចង់លុបទេ?', cannotUndo: 'សកម្មភាពនេះមិនអាចត្រឡប់វិញបានទេ។',
    noData: 'រកមិនឃើញទិន្នន័យ',
  },
  en: {
    news: 'News', categories: 'Categories', sliders: 'Sliders', users: 'Users', settings: 'Settings',
    addNews: '+ Add Article', addCategory: '+ Add Category', addSlider: '+ Add Slider', addUser: '+ Add User',
    search: 'Search...', logout: 'Logout',
    save: 'Save', cancel: 'Cancel', delete: 'Delete', edit: 'Edit', create: 'Create', update: 'Update',
    deleteConfirm: 'Are you sure you want to delete?', cannotUndo: 'This action cannot be undone.',
    noData: 'No data found',
  },
}

export default function Admin() {
  const { user, logout } = useAuth()
  const [adminLang, setAdminLang] = useState<'kh' | 'en'>(() => (localStorage.getItem('admin_lang') as 'kh' | 'en') ?? 'kh')
  const al = adminUi[adminLang]
  const toggleLang = (l: 'kh' | 'en') => { setAdminLang(l); localStorage.setItem('admin_lang', l) }

  const [tab, setTab]               = useState<Tab>('articles')
  const [posts, setPosts]           = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [form, setForm]             = useState<ArticleForm>(defaultForm)
  const [editId, setEditId]         = useState<number | null>(null)
  const [showForm, setShowForm]     = useState(false)
  const [saving, setSaving]         = useState(false)
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [previewArticle, setPreviewArticle] = useState<Article | null>(null)
  const [sideOpen, setSideOpen]     = useState(false)
  const [contentTab, setContentTab] = useState<'kh' | 'en'>('kh')
  const [search, setSearch]         = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [page, setPage]             = useState(1)
  const [siteSettings, setSiteSettings] = useState<Record<string, string>>({})

  // ── Category CRUD state ──────────────────────────────────────────────────────
  const defaultCatForm = { name: '', name_kh: '', slug: '' }
  const [catForm, setCatForm]       = useState(defaultCatForm)
  const [catEditId, setCatEditId]   = useState<number | null>(null)
  const [showCatForm, setShowCatForm] = useState(false)
  const [catSaving, setCatSaving]   = useState(false)
  const [catDeleteId, setCatDeleteId] = useState<number | null>(null)
  const [catSearch, setCatSearch]     = useState('')
  const [catPage, setCatPage]         = useState(1)

  const showMsg = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type }); setTimeout(() => setToast(null), 3000)
  }

  const loadArticles = async () => {
    try {
      const r = await api.get<{ data: Article[] }>('/admin/articles?limit=200')
      setPosts(r.data.data)
    } catch { showMsg('Failed to load', 'error') }
  }
  const loadCategories = () => {
    api.get<Category[]>('/admin/categories').then((r) => setCategories(r.data)).catch(() => {})
  }

  const slugify = (s: string) => s.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')

  const openAddCat = () => { setCatEditId(null); setCatForm(defaultCatForm); setShowCatForm(true) }
  const openEditCat = (c: Category) => { setCatEditId(c.id); setCatForm({ name: c.name, name_kh: c.name_kh, slug: c.slug }); setShowCatForm(true) }
  const closeCatForm = () => { setShowCatForm(false); setCatEditId(null); setCatForm(defaultCatForm) }

  const handleCatSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setCatSaving(true)
    try {
      if (catEditId !== null) { await api.put(`/admin/categories/${catEditId}`, catForm); showMsg('Category updated!') }
      else { await api.post('/admin/categories', catForm); showMsg('Category created!') }
      loadCategories(); closeCatForm()
    } catch { showMsg('Save failed', 'error') } finally { setCatSaving(false) }
  }

  const handleCatDelete = async (id: number) => {
    try {
      await api.delete(`/admin/categories/${id}`)
      loadCategories(); setCatDeleteId(null); showMsg('Category deleted')
    } catch { showMsg('Delete failed', 'error') }
  }

  useEffect(() => {
    loadArticles(); loadCategories()
    api.get<Record<string, string>>('/admin/settings').then((r) => setSiteSettings(r.data)).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload = { ...form, published_at: new Date(form.published_at).toISOString() }
      if (editId !== null) { await api.put(`/admin/articles/${editId}`, payload); showMsg('Updated!') }
      else                  { await api.post('/admin/articles', payload); showMsg('Created!') }
      await loadArticles(); setForm(defaultForm); setEditId(null); setShowForm(false)
    } catch { showMsg('Save failed', 'error') } finally { setSaving(false) }
  }

  const handleEdit = (p: Article) => {
    setForm({
      title: p.title, title_kh: p.title_kh,
      excerpt: p.excerpt, excerpt_kh: p.excerpt_kh,
      content: p.content, content_kh: p.content_kh,
      image: p.image, category_id: p.category_id,
      author: p.author, status: p.status,
      featured: p.featured, breaking: p.breaking,
      video_url: p.video_url ?? '', show_video: p.show_video,
      published_at: p.published_at.slice(0, 16),
    })
    setEditId(p.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/admin/articles/${id}`)
    await loadArticles(); setDeleteId(null); showMsg('Deleted')
  }

  const navItems: { key: Tab; icon: typeof faNewspaper; label: string }[] = [
    { key: 'articles',   icon: faNewspaper,  label: al.news },
    { key: 'categories', icon: faTags,       label: al.categories },
    { key: 'sliders',    icon: faPhotoFilm,  label: al.sliders },
    { key: 'users',      icon: faUsers,      label: al.users },
    { key: 'settings',   icon: faGear,       label: al.settings },
  ]

  const currentNav = navItems.find((n) => n.key === tab)

  // Filtered + paginated articles
  const filteredPosts = posts.filter((p) => {
    const matchSearch = !search || p.title_kh.toLowerCase().includes(search.toLowerCase()) || p.title.toLowerCase().includes(search.toLowerCase())
    const matchStatus = statusFilter === 'all' || p.status === statusFilter
    return matchSearch && matchStatus
  })
  const totalPages = Math.max(1, Math.ceil(filteredPosts.length / ITEMS_PER_PAGE))
  const pagedPosts = filteredPosts.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE)

  const openAddForm = () => { setEditId(null); setForm(defaultForm); setContentTab('kh'); setShowForm(true) }
  const closeForm   = () => { setShowForm(false); setEditId(null); setForm(defaultForm) }

  const deleteArticle = posts.find((p) => p.id === deleteId)

  return (
    <div className="flex h-screen bg-slate-100 overflow-hidden font-[Inter,Arial,sans-serif]">

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-[#1e2430] flex flex-col transition-transform duration-200
        ${sideOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static md:flex
      `}>
        {/* Logo area */}
        <div className="bg-[#181f2c] px-5 py-4 flex-shrink-0 flex items-center gap-3">
          {siteSettings.logo_url ? (
            <img src={siteSettings.logo_url} alt="" className="w-9 h-9 object-contain rounded-full bg-white p-0.5 flex-shrink-0" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-green-600 flex items-center justify-center flex-shrink-0 text-white text-xs font-bold">A</div>
          )}
          <div className="min-w-0">
            <h1 className="font-bold text-sm text-white tracking-wide truncate">
              {siteSettings.site_name || 'Admin Panel'}
            </h1>
            {siteSettings.site_name_en && (
              <p className="text-[10px] text-slate-400 truncate">{siteSettings.site_name_en}</p>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.key}
              onClick={() => { setTab(item.key); setSideOpen(false) }}
              className={`
                w-full text-left flex items-center gap-3 px-5 py-3 text-sm transition-colors
                ${tab === item.key
                  ? 'border-l-[3px] border-green-500 bg-[#2a3345] text-white font-medium'
                  : 'border-l-[3px] border-transparent text-[#9ba8bb] hover:bg-[#2a3345] hover:text-white'}
              `}
            >
              <FontAwesomeIcon icon={item.icon} className="w-4 text-[13px]" />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        {/* User + logout pinned at bottom */}
        <div className="flex-shrink-0 border-t border-[#2a3345] px-4 py-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-7 h-7 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-[12px] text-white font-medium truncate">{user?.name ?? 'Admin'}</p>
              <p className="text-[10px] text-slate-400 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 text-[11.5px] text-slate-400 hover:text-red-400 transition-colors py-1"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="text-[11px]" />
            {adminLang === 'kh' ? 'ចាកចេញ (Logout)' : 'Logout'}
          </button>
        </div>
      </aside>

      {/* Mobile backdrop */}
      {sideOpen && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setSideOpen(false)} />}

      {/* ── Main content ────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">

        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 h-[52px] flex-shrink-0 flex items-center px-5 z-20">
          {/* Hamburger (mobile) */}
          <button
            onClick={() => setSideOpen(!sideOpen)}
            className="md:hidden mr-3 text-gray-500 hover:text-gray-800 transition-colors"
          >
            <FontAwesomeIcon icon={sideOpen ? faXmark : faBars} />
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-sm text-slate-500 flex-1">
            <span className="text-slate-800 font-semibold">{currentNav?.label}</span>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3">
            {/* Language toggle */}
            <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
              <button
                onClick={() => toggleLang('kh')}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-colors ${adminLang === 'kh' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >ខ្មែរ</button>
              <button
                onClick={() => toggleLang('en')}
                className={`px-2.5 py-1 rounded-md text-[11.5px] font-bold transition-colors ${adminLang === 'en' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >EN</button>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 transition-colors relative">
              <FontAwesomeIcon icon={faBell} className="text-[15px]" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </button>
            <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? 'A'}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-5">

          {/* ── Articles tab ──────────────────────────────────────────────── */}
          {tab === 'articles' && (
            <div>
              {/* Page header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faNewspaper} className="text-slate-600 text-lg" />
                  <h1 className="text-lg font-bold text-slate-800">{adminLang === 'kh' ? 'ព័ត៌មាន / អត្ថបទ' : 'News / Articles'}</h1>
                </div>
                <button
                  onClick={openAddForm}
                  className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors"
                >
                  <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
                  {al.addNews}
                </button>
              </div>

              {/* Stat cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-5">
                {[
                  { label: adminLang === 'kh' ? 'អត្ថបទសរុប' : 'Total Articles', value: posts.length,                                  icon: faNewspaper, color: 'text-blue-500',   bg: 'bg-blue-50' },
                  { label: adminLang === 'kh' ? 'ពិសេស'      : 'Featured',       value: posts.filter((p) => p.featured).length,        icon: faStar,      color: 'text-yellow-500', bg: 'bg-yellow-50' },
                  { label: adminLang === 'kh' ? 'ប្រភេទ'      : 'Categories',     value: categories.length,                             icon: faFolder,    color: 'text-green-500',  bg: 'bg-green-50' },
                  { label: adminLang === 'kh' ? 'ទស្សនៈសរុប'  : 'Total Views',    value: posts.reduce((s, p) => s + p.views, 0).toLocaleString(), icon: faEye, color: 'text-purple-500', bg: 'bg-purple-50' },
                ].map((s) => (
                  <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl ${s.bg} flex items-center justify-center flex-shrink-0`}>
                      <FontAwesomeIcon icon={s.icon} className={`text-lg ${s.color}`} />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-slate-800">{s.value}</p>
                      <p className="text-xs text-slate-400">{s.label}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Toolbar */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 flex flex-col sm:flex-row gap-3 sm:items-center mb-3">
                {/* Search */}
                <div className="relative flex-1 max-w-xs">
                  <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[12px]" />
                  <input
                    type="text"
                    placeholder={adminLang === 'kh' ? 'ស្វែងរកអត្ថបទ...' : 'Search articles...'}
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1) }}
                    className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all"
                  />
                </div>

                {/* Status filter tabs */}
                <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-1">
                  {(['all', 'published', 'draft'] as StatusFilter[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => { setStatusFilter(s); setPage(1) }}
                      className={`px-3 py-1 rounded-md text-[12.5px] font-medium transition-colors capitalize ${
                        statusFilter === s
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                      }`}
                    >
                      {s === 'all' ? 'All' : s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead className="bg-slate-50 border-b border-slate-200">
                      <tr>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">SL</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Preview</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Title KH</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Title EN</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Category</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Video</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Views</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Published At</th>
                        <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Flags</th>
                        <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pagedPosts.map((p, idx) => {
                        const cat = categories.find((c) => c.id === p.category_id)
                        const sl = (page - 1) * ITEMS_PER_PAGE + idx + 1
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            {/* SL */}
                            <td className="px-4 py-3">
                              <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold items-center justify-center">{sl}</span>
                            </td>
                            {/* Thumbnail */}
                            <td className="px-4 py-3">
                              {p.image ? (
                                <div
                                  className="relative rounded-lg overflow-hidden cursor-pointer group"
                                  style={{ width: 56, height: 56 }}
                                  onClick={() => setPreviewArticle(p)}
                                >
                                  <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                                  <p className="absolute bottom-1 left-1 right-1 text-white text-[10px] font-semibold leading-tight line-clamp-1">{p.title_kh}</p>
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <FontAwesomeIcon icon={faEye} className="text-white text-sm" />
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-lg bg-slate-100 flex items-center justify-center" style={{ width: 56, height: 56 }}>
                                  <FontAwesomeIcon icon={faImage} className="text-slate-300" />
                                </div>
                              )}
                            </td>
                            {/* Title KH */}
                            <td className="px-4 py-3 max-w-[160px]">
                              <p className="font-medium text-slate-800 truncate">{p.title_kh}</p>
                            </td>
                            {/* Title EN */}
                            <td className="px-4 py-3 max-w-[160px] hidden lg:table-cell">
                              <p className="text-slate-500 truncate">{p.title}</p>
                            </td>
                            {/* Category */}
                            <td className="px-4 py-3 hidden md:table-cell">
                              {cat
                                ? <span className="inline-block bg-blue-50 text-blue-700 border border-blue-100 text-[11px] font-medium px-2 py-0.5 rounded-full">{cat.name_kh}</span>
                                : <span className="text-slate-300">—</span>
                              }
                            </td>
                            {/* Video */}
                            <td className="px-4 py-3 text-center hidden xl:table-cell">
                              {p.video_url
                                ? <span className="inline-flex items-center gap-1 bg-red-50 text-red-600 border border-red-100 text-[11px] px-2 py-0.5 rounded-full"><FontAwesomeIcon icon={faVideo} className="text-[10px]" />Video</span>
                                : <span className="text-slate-200">—</span>
                              }
                            </td>
                            {/* Views */}
                            <td className="px-4 py-3 text-right hidden md:table-cell">
                              <span className="flex items-center justify-end gap-1 text-slate-500">
                                <FontAwesomeIcon icon={faEye} className="text-[10px]" />
                                {p.views.toLocaleString()}
                              </span>
                            </td>
                            {/* Status */}
                            <td className="px-4 py-3 text-center">
                              <StatusBadge status={p.status} />
                            </td>
                            {/* Published At */}
                            <td className="px-4 py-3 text-slate-400 text-[12px] whitespace-nowrap hidden lg:table-cell">
                              {new Date(p.published_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </td>
                            {/* Flags */}
                            <td className="px-4 py-3 text-center hidden xl:table-cell">
                              <div className="flex items-center justify-center gap-1">
                                {p.featured && <span className="bg-yellow-50 text-yellow-600 border border-yellow-100 text-[10px] font-medium px-1.5 py-0.5 rounded">Featured</span>}
                                {p.breaking && <span className="bg-red-50 text-red-600 border border-red-100 text-[10px] font-medium px-1.5 py-0.5 rounded">Breaking</span>}
                                {!p.featured && !p.breaking && <span className="text-slate-200">—</span>}
                              </div>
                            </td>
                            {/* Action */}
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1.5">
                                <Link
                                  to={`/post/${p.id}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                                  title="Preview"
                                >
                                  <FontAwesomeIcon icon={faEye} className="text-[11px]" />
                                </Link>
                                <button
                                  onClick={() => handleEdit(p)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                  title="Edit"
                                >
                                  <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                                </button>
                                <button
                                  onClick={() => setDeleteId(p.id)}
                                  className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                                  title="Delete"
                                >
                                  <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                  {filteredPosts.length === 0 && (
                    <div className="py-16 text-center">
                      <FontAwesomeIcon icon={faNewspaper} className="text-4xl text-slate-200 mb-3" />
                      <p className="text-slate-400 text-sm">No articles found</p>
                    </div>
                  )}
                </div>

                {/* Pagination */}
                {filteredPosts.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 gap-2">
                    <p className="text-[12.5px] text-slate-500">
                      {filteredPosts.length} articles · page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronLeft} className="text-[11px]" />
                      </button>
                      {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                        const pg = totalPages <= 7 ? i + 1 : i + Math.max(1, Math.min(page - 3, totalPages - 6))
                        return (
                          <button
                            key={pg}
                            onClick={() => setPage(pg)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors ${
                              pg === page ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                            }`}
                          >
                            {pg}
                          </button>
                        )
                      })}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Categories tab ────────────────────────────────────────────── */}
          {tab === 'categories' && (() => {
            const filteredCats = categories.filter((c) =>
              !catSearch ||
              c.name_kh.toLowerCase().includes(catSearch.toLowerCase()) ||
              c.name.toLowerCase().includes(catSearch.toLowerCase())
            )
            const catTotalPages = Math.max(1, Math.ceil(filteredCats.length / ITEMS_PER_PAGE))
            const pagedCats = filteredCats.slice((catPage - 1) * ITEMS_PER_PAGE, catPage * ITEMS_PER_PAGE)
            return (
              <div>
                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon icon={faTags} className="text-slate-600 text-lg" />
                    <h1 className="text-lg font-bold text-slate-800">{adminLang === 'kh' ? 'ប្រភេទ / Categories' : 'Categories / ប្រភេទ'}</h1>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                      <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
                      <input
                        type="text"
                        placeholder={adminLang === 'kh' ? 'ស្វែងរកប្រភេទ...' : 'Search categories...'}
                        value={catSearch}
                        onChange={(e) => { setCatSearch(e.target.value); setCatPage(1) }}
                        className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all w-48"
                      />
                    </div>
                    <button
                      onClick={openAddCat}
                      className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
                    >
                      <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
                      {al.addCategory}
                    </button>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-[13px]">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">SL</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name KH</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Name EN</th>
                          <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Slug</th>
                          <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Articles</th>
                          <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {pagedCats.map((c, idx) => {
                          const hasArticles = (c.count ?? 0) > 0
                          const sl = (catPage - 1) * ITEMS_PER_PAGE + idx + 1
                          return (
                            <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                              {/* SL */}
                              <td className="px-4 py-3">
                                <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold items-center justify-center">{sl}</span>
                              </td>
                              {/* Name KH */}
                              <td className="px-4 py-3">
                                <p className="font-medium text-slate-800">{c.name_kh}</p>
                              </td>
                              {/* Name EN */}
                              <td className="px-4 py-3 hidden md:table-cell">
                                <p className="text-slate-500">{c.name}</p>
                              </td>
                              {/* Slug */}
                              <td className="px-4 py-3 hidden lg:table-cell">
                                <span className="font-mono text-[12px] text-slate-400">{c.slug}</span>
                              </td>
                              {/* Articles count */}
                              <td className="px-4 py-3 text-center">
                                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${hasArticles ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                  {c.count ?? 0}
                                </span>
                              </td>
                              {/* Action */}
                              <td className="px-4 py-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => openEditCat(c)}
                                    className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                                    title="Edit"
                                  >
                                    <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                                  </button>
                                  <button
                                    onClick={() => !hasArticles && setCatDeleteId(c.id)}
                                    disabled={hasArticles}
                                    title={hasArticles ? `Cannot delete — has ${c.count} article(s)` : 'Delete'}
                                    className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${hasArticles ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                                  >
                                    <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {filteredCats.length === 0 && (
                      <div className="py-16 text-center">
                        <FontAwesomeIcon icon={faTags} className="text-4xl text-slate-200 mb-3" />
                        <p className="text-slate-400 text-sm">{adminLang === 'kh' ? 'រកមិនឃើញប្រភេទ' : 'No categories found'}</p>
                      </div>
                    )}
                  </div>

                  {/* Pagination */}
                  {filteredCats.length > 0 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 gap-2">
                      <p className="text-[12.5px] text-slate-500">
                        {filteredCats.length} categories · page {catPage} of {catTotalPages}
                      </p>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setCatPage((p) => Math.max(1, p - 1))}
                          disabled={catPage === 1}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <FontAwesomeIcon icon={faChevronLeft} className="text-[11px]" />
                        </button>
                        {Array.from({ length: Math.min(catTotalPages, 7) }, (_, i) => {
                          const pg = catTotalPages <= 7 ? i + 1 : i + Math.max(1, Math.min(catPage - 3, catTotalPages - 6))
                          return (
                            <button
                              key={pg}
                              onClick={() => setCatPage(pg)}
                              className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors ${
                                pg === catPage ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'
                              }`}
                            >
                              {pg}
                            </button>
                          )
                        })}
                        <button
                          onClick={() => setCatPage((p) => Math.min(catTotalPages, p + 1))}
                          disabled={catPage === catTotalPages}
                          className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Category form modal */}
                {showCatForm && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
                      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                        <h2 className="font-bold text-slate-800">{catEditId !== null ? (adminLang === 'kh' ? 'កែប្រភេទ' : 'Edit Category') : (adminLang === 'kh' ? 'បន្ថែមប្រភេទ' : 'Add Category')}</h2>
                        <button onClick={closeCatForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                          <FontAwesomeIcon icon={faXmark} />
                        </button>
                      </div>
                      <form onSubmit={handleCatSubmit} className="px-6 py-5 flex flex-col gap-4">
                        <div>
                          <label className={LABEL_CLS}>ឈ្មោះ (Khmer)</label>
                          <input
                            className={INPUT_CLS}
                            value={catForm.name_kh}
                            onChange={(e) => setCatForm((f) => ({ ...f, name_kh: e.target.value }))}
                            placeholder="ឈ្មោះប្រភេទ"
                            required
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Name (English)</label>
                          <input
                            className={INPUT_CLS}
                            value={catForm.name}
                            onChange={(e) => {
                              const name = e.target.value
                              setCatForm((f) => ({ ...f, name, slug: catEditId === null ? slugify(name) : f.slug }))
                            }}
                            placeholder="Category name"
                            required
                          />
                        </div>
                        <div>
                          <label className={LABEL_CLS}>Slug</label>
                          <input
                            className={INPUT_CLS}
                            value={catForm.slug}
                            onChange={(e) => setCatForm((f) => ({ ...f, slug: slugify(e.target.value) }))}
                            placeholder="category-slug"
                            required
                          />
                        </div>
                        <div className="flex gap-3 pt-1">
                          <button type="button" onClick={closeCatForm}
                            className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                            Cancel
                          </button>
                          <button type="submit" disabled={catSaving}
                            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13px] bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                            <FontAwesomeIcon icon={faFloppyDisk} className="text-[12px]" />
                            {catSaving ? 'Saving…' : catEditId !== null ? 'Update' : 'Create'}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Category delete confirm */}
                {catDeleteId !== null && (
                  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <FontAwesomeIcon icon={faTrash} className="text-red-500 text-lg" />
                      </div>
                      <h3 className="font-bold text-slate-800 mb-1">{adminLang === 'kh' ? 'លុបប្រភេទ?' : 'Delete Category?'}</h3>
                      <p className="text-slate-500 text-sm mb-5">{al.cannotUndo}</p>
                      <div className="flex gap-3">
                        <button onClick={() => setCatDeleteId(null)}
                          className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                          {al.cancel}
                        </button>
                        <button onClick={() => handleCatDelete(catDeleteId)}
                          className="flex-1 px-4 py-2 text-[13px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                          {al.delete}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })()}

          {/* ── Sliders tab ───────────────────────────────────────────────── */}
          {tab === 'sliders' && <SlidersPanel onToast={showMsg} />}

          {/* ── Users tab ─────────────────────────────────────────────────── */}
          {tab === 'users' && <UsersPanel onToast={showMsg} currentUserId={user?.id} currentUserRole={user?.role} />}

          {/* ── Settings tab ──────────────────────────────────────────────── */}
          {tab === 'settings' && <SettingsPanel onToast={showMsg} />}

        </main>
      </div>

      {/* ── Article Modal (full-screen) ──────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-[86rem] rounded-2xl shadow-2xl max-h-[94vh] flex flex-col my-auto">

            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200 flex-shrink-0">
              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                <FontAwesomeIcon icon={faNewspaper} className="text-white text-[13px]" />
              </div>
              <h2 className="text-base font-bold text-slate-800">
                {editId !== null ? 'Edit Article' : 'New Article'}
              </h2>
              <button
                onClick={closeForm}
                className="ml-auto w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* Modal body */}
            <form onSubmit={handleSubmit} className="flex-1 flex min-h-0">

              {/* LEFT — scrollable content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-5 border-r border-slate-100">

                {/* Language tabs */}
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="flex items-center bg-slate-50 border-b border-slate-200 px-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setContentTab('kh')}
                      className={`px-5 py-2 text-sm font-medium rounded-t -mb-px transition-colors ${contentTab === 'kh' ? 'bg-white border-t border-x border-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      🇰🇭 ខ្មែរ
                    </button>
                    <button
                      type="button"
                      onClick={() => setContentTab('en')}
                      className={`px-5 py-2 text-sm font-medium rounded-t -mb-px transition-colors ${contentTab === 'en' ? 'bg-white border-t border-x border-slate-200 text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                      🇬🇧 English
                    </button>
                    <div className="ml-auto flex gap-2 pb-1">
                      <button
                        type="button"
                        onClick={() => { setForm((x) => ({ ...x, title: x.title_kh, excerpt: x.excerpt_kh, content: x.content_kh })); setContentTab('en') }}
                        className="text-[12px] bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-md transition-colors"
                        title="Copy Khmer → English"
                      >
                        Copy to 🇬🇧 →
                      </button>
                      <button
                        type="button"
                        onClick={() => { setForm((x) => ({ ...x, title_kh: x.title, excerpt_kh: x.excerpt, content_kh: x.content })); setContentTab('kh') }}
                        className="text-[12px] bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-2.5 py-1 rounded-md transition-colors"
                        title="Copy English → Khmer"
                      >
                        Copy to 🇰🇭 →
                      </button>
                    </div>
                  </div>

                  {/* KH panel */}
                  <div className={`p-4 space-y-4 ${contentTab === 'kh' ? '' : 'hidden'}`}>
                    <div>
                      <label className={LABEL_CLS}>ចំណងជើង *</label>
                      <input
                        value={form.title_kh}
                        onChange={(e) => setForm((x) => ({ ...x, title_kh: e.target.value }))}
                        placeholder="ចំណងជើងអត្ថបទ..."
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>សង្ខេប</label>
                      <textarea
                        rows={3}
                        value={form.excerpt_kh}
                        onChange={(e) => setForm((x) => ({ ...x, excerpt_kh: e.target.value }))}
                        placeholder="សង្ខេបអត្ថបទ..."
                        className={INPUT_CLS + ' resize-y'}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>ខ្លឹមសារ</label>
                      <RichTextEditor
                        key={`content_kh_${editId ?? 'new'}`}
                        value={form.content_kh}
                        onChange={(html) => setForm((x) => ({ ...x, content_kh: html }))}
                        placeholder="សរសេរខ្លឹមសារនៅទីនេះ..."
                        uploadFolder="articles"
                      />
                    </div>
                  </div>

                  {/* EN panel */}
                  <div className={`p-4 space-y-4 ${contentTab === 'en' ? '' : 'hidden'}`}>
                    <div>
                      <label className={LABEL_CLS}>Title *</label>
                      <input
                        value={form.title}
                        onChange={(e) => setForm((x) => ({ ...x, title: e.target.value }))}
                        placeholder="Article title..."
                        className={INPUT_CLS}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Excerpt</label>
                      <textarea
                        rows={3}
                        value={form.excerpt}
                        onChange={(e) => setForm((x) => ({ ...x, excerpt: e.target.value }))}
                        placeholder="Short description..."
                        className={INPUT_CLS + ' resize-y'}
                      />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Content</label>
                      <RichTextEditor
                        key={`content_en_${editId ?? 'new'}`}
                        value={form.content}
                        onChange={(html) => setForm((x) => ({ ...x, content: html }))}
                        placeholder="Write content here..."
                        uploadFolder="articles"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* RIGHT — fixed sidebar */}
              <div className="w-72 flex-shrink-0 flex flex-col overflow-y-auto">

                {/* Scrollable sidebar sections */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">

                  {/* PUBLISH */}
                  <div className={SECTION_CLS}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Publish</p>

                    <div>
                      <label className={LABEL_CLS}>Status</label>
                      <select
                        value={form.status}
                        onChange={(e) => setForm((x) => ({ ...x, status: e.target.value as 'published' | 'draft' }))}
                        className={INPUT_CLS}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>

                    <div>
                      <label className={LABEL_CLS}>Schedule Date</label>
                      <input
                        type="datetime-local"
                        value={form.published_at}
                        onChange={(e) => setForm((x) => ({ ...x, published_at: e.target.value }))}
                        className={INPUT_CLS}
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-1">
                      <label className="flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.featured}
                          onChange={(e) => setForm((x) => ({ ...x, featured: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300 accent-yellow-500"
                        />
                        <FontAwesomeIcon icon={faStar} className="text-yellow-400 text-[12px]" />
                        Featured
                      </label>
                      <label className="flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.breaking}
                          onChange={(e) => setForm((x) => ({ ...x, breaking: e.target.checked }))}
                          className="w-4 h-4 rounded border-slate-300 accent-red-500"
                        />
                        <span className="text-red-500 text-[12px] font-bold">!</span>
                        Breaking News
                      </label>
                    </div>
                  </div>

                  {/* CATEGORY */}
                  <div className={SECTION_CLS}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Category</p>
                    <SearchSelect
                      value={form.category_id}
                      onChange={(v) => setForm((x) => ({ ...x, category_id: v ? Number(v) : null }))}
                      options={categories.map((c) => ({ value: c.id, label: `${c.name_kh} (${c.name})` }))}
                      placeholder="ជ្រើសប្រភេទ / Select category"
                    />
                  </div>

                  {/* THUMBNAIL */}
                  <div className={SECTION_CLS}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Thumbnail</p>
                    <ImageUploader
                      value={form.image}
                      onChange={(url) => setForm((x) => ({ ...x, image: url }))}
                      folder="articles"
                      onError={showMsg}
                    />
                  </div>

                  {/* YOUTUBE VIDEO */}
                  <div className={SECTION_CLS}>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">YouTube Video</p>
                    <div>
                      <label className={LABEL_CLS}>YouTube URL</label>
                      <input
                        type="text"
                        value={form.video_url}
                        onChange={(e) => {
                          const url = e.target.value
                          const thumb = getYoutubeThumbnail(url)
                          setForm((x) => ({
                            ...x,
                            video_url: url,
                            image: x.image || thumb || x.image,
                            show_video: !!thumb,
                          }))
                        }}
                        placeholder="https://www.youtube.com/watch?v=..."
                        className={INPUT_CLS}
                      />
                    </div>
                    {form.video_url && (
                      <>
                        <label className="flex items-center gap-2 text-[13px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={form.show_video}
                            onChange={(e) => setForm((x) => ({ ...x, show_video: e.target.checked }))}
                            className="w-4 h-4 rounded border-slate-300 accent-red-500"
                          />
                          <FontAwesomeIcon icon={faVideo} className="text-red-500 text-[11px]" />
                          Show video player
                        </label>
                        <YoutubePreview url={form.video_url} />
                      </>
                    )}
                  </div>
                </div>

                {/* Pinned footer */}
                <div className="flex-shrink-0 border-t border-slate-200 p-4 flex flex-col gap-2 bg-white">
                  <button
                    type="submit"
                    disabled={saving}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 text-white py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors disabled:opacity-50"
                  >
                    <FontAwesomeIcon icon={saving ? faCheck : (editId !== null ? faFloppyDisk : faPlus)} />
                    {saving ? 'Saving...' : editId !== null ? 'Save Changes' : 'Publish Article'}
                  </button>
                  <button
                    type="button"
                    onClick={closeForm}
                    className="w-full flex items-center justify-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2 rounded-xl text-[13px] transition-colors"
                  >
                    <FontAwesomeIcon icon={faXmark} className="text-[11px]" />
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Article image preview modal ─────────────────────────────────────── */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewArticle(null)}>
          <div className="relative w-full max-w-3xl" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setPreviewArticle(null)} className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1.5 transition-colors">
              <FontAwesomeIcon icon={faXmark} /> Close
            </button>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <div className="relative">
                <img src={previewArticle.image} alt={previewArticle.title_kh} className="w-full object-cover" style={{ maxHeight: '75vh' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-lg leading-snug">{previewArticle.title_kh}</p>
                  {previewArticle.title && <p className="text-slate-300 text-sm mt-1">{previewArticle.title}</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete modal ─────────────────────────────────────────────────────── */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full">
            <div className="flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
                <FontAwesomeIcon icon={faTrash} className="text-2xl text-red-500" />
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1">{adminLang === 'kh' ? 'លុបអត្ថបទ?' : 'Delete Article?'}</h3>
              {deleteArticle && (
                <p className="text-slate-500 text-sm mb-4 line-clamp-2">{deleteArticle.title_kh || deleteArticle.title}</p>
              )}
              <p className="text-slate-400 text-xs mb-5">{al.cannotUndo}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-600 hover:bg-slate-50 py-2.5 rounded-xl text-sm font-medium transition-colors"
              >
                {al.cancel}
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2"
              >
                <FontAwesomeIcon icon={faTrash} />
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ────────────────────────────────────────────────────────────── */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-lg flex items-center gap-2.5 text-sm text-white transition-all ${toast.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
          <FontAwesomeIcon icon={toast.type === 'success' ? faCircleCheck : faCircleExclamation} />
          {toast.msg}
        </div>
      )}
    </div>
  )
}

// ── Sliders Panel ─────────────────────────────────────────────────────────────

interface SliderRow { id: number; title: string; title_kh: string; image: string; link: string; order_num: number; active: number }

const SLIDER_PER_PAGE = 10

function SlidersPanel({ onToast }: { onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const imgRef = useRef<HTMLInputElement>(null)
  const [sliders, setSliders]     = useState<SliderRow[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]     = useState<number | null>(null)
  const [previewSlider, setPreviewSlider] = useState<SliderRow | null>(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [form, setForm] = useState({ title: '', title_kh: '', image: '', link: '/', order_num: 0, active: 1 })

  const load = () => api.get<SliderRow[]>('/admin/sliders').then((r) => setSliders(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const resetForm = () => { setForm({ title: '', title_kh: '', image: '', link: '/', order_num: sliders.length, active: 1 }); setEditId(null); setShowForm(false) }

  const handleEdit = (s: SliderRow) => {
    setForm({ title: s.title, title_kh: s.title_kh, image: s.image, link: s.link, order_num: s.order_num, active: s.active })
    setEditId(s.id); setShowForm(true)
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/admin/sliders/${id}`); load(); setDeleteId(null); onToast('Deleted')
  }

  const toggleActive = async (s: SliderRow) => {
    await api.put(`/admin/sliders/${s.id}`, { ...s, active: s.active ? 0 : 1 }); load()
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    if (!file.type.startsWith('image/')) { onToast('Please select an image', 'error'); return }
    if (file.size > 5 * 1024 * 1024) { onToast('Max 5MB', 'error'); return }
    setUploading(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await api.post<{ data: { url: string } }>('/admin/upload?folder=sliders', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setForm((f) => ({ ...f, image: res.data.data.url }))
      onToast('Image uploaded!')
    } catch { onToast('Upload failed', 'error') }
    finally { setUploading(false); if (imgRef.current) imgRef.current.value = '' }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.image) { onToast('Please add an image', 'error'); return }
    setSaving(true)
    try {
      if (editId) await api.put(`/admin/sliders/${editId}`, form)
      else        await api.post('/admin/sliders', form)
      load(); resetForm(); onToast(editId ? 'Updated!' : 'Created!')
    } catch { onToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const filtered = sliders.filter((s) =>
    !search ||
    s.title_kh.toLowerCase().includes(search.toLowerCase()) ||
    s.title.toLowerCase().includes(search.toLowerCase())
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / SLIDER_PER_PAGE))
  const paged = filtered.slice((page - 1) * SLIDER_PER_PAGE, page * SLIDER_PER_PAGE)

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faPhotoFilm} className="text-slate-600 text-lg" />
          <h1 className="text-lg font-bold text-slate-800">Sliders / <span className="font-normal text-slate-500">({sliders.length})</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
            <input
              type="text"
              placeholder="Search sliders..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all w-48"
            />
          </div>
          <button
            onClick={() => { resetForm(); setShowForm(true) }}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
            Add Slider
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">SL</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Preview</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Title EN</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden xl:table-cell">Link</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Order</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((s, idx) => {
                const sl = (page - 1) * SLIDER_PER_PAGE + idx + 1
                return (
                  <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                    {/* SL */}
                    <td className="px-4 py-3">
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold items-center justify-center">{sl}</span>
                    </td>
                    {/* Preview */}
                    <td className="px-4 py-3">
                      {s.image ? (
                        <div
                          className="relative rounded-lg overflow-hidden cursor-pointer group"
                          style={{ width: 96, height: 56 }}
                          onClick={() => setPreviewSlider(s)}
                        >
                          <img src={s.image} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                          <p className="absolute bottom-1.5 left-2 right-2 text-white text-[11px] font-semibold leading-tight line-clamp-1">{s.title_kh}</p>
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <FontAwesomeIcon icon={faEye} className="text-white text-base" />
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-lg bg-slate-100 flex items-center justify-center" style={{ width: 96, height: 56 }}>
                          <FontAwesomeIcon icon={faImage} className="text-slate-300 text-lg" />
                        </div>
                      )}
                    </td>
                    {/* Title EN */}
                    <td className="px-4 py-3 max-w-[160px] hidden lg:table-cell">
                      <p className="text-slate-500 truncate">{s.title || <span className="text-slate-300">—</span>}</p>
                    </td>
                    {/* Link */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="font-mono text-[12px] text-slate-400 truncate block max-w-[140px]">{s.link}</span>
                    </td>
                    {/* Order */}
                    <td className="px-4 py-3 text-center hidden md:table-cell">
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold items-center justify-center">{s.order_num}</span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => toggleActive(s)} title={s.active ? 'Click to deactivate' : 'Click to activate'}>
                        {s.active
                          ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active
                            </span>
                          : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium px-2 py-0.5 rounded-full">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Hidden
                            </span>
                        }
                      </button>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setPreviewSlider(s)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                          title="Preview"
                        >
                          <FontAwesomeIcon icon={faEye} className="text-[11px]" />
                        </button>
                        <button
                          onClick={() => handleEdit(s)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                        </button>
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                          title="Delete"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <FontAwesomeIcon icon={faPhotoFilm} className="text-4xl text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No sliders found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 gap-2">
            <p className="text-[12.5px] text-slate-500">
              {filtered.length} sliders · page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="text-[11px]" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : i + Math.max(1, Math.min(page - 3, totalPages - 6))
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors ${pg === page ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center overflow-y-auto py-6 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faPhotoFilm} className="text-slate-600" />
                {editId ? 'Edit Slider' : 'Add Slider'}
              </h3>
              <button onClick={resetForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={LABEL_CLS}>រូបភាព Slider *</label>
                <div
                  className="relative rounded-xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 hover:border-blue-400 transition-colors cursor-pointer"
                  onClick={() => imgRef.current?.click()}
                  style={{ aspectRatio: '16/5', minHeight: 120 }}
                >
                  {form.image ? (
                    <>
                      <img src={form.image} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-sm font-medium flex items-center gap-2"><FontAwesomeIcon icon={faUpload} />Change Image</span>
                      </div>
                    </>
                  ) : (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
                      <FontAwesomeIcon icon={faImage} className="text-3xl text-slate-300" />
                      <p className="text-sm font-medium">{uploading ? 'Uploading...' : 'Click to upload image'}</p>
                      <p className="text-xs text-slate-300">PNG, JPG, WebP • Max 5MB</p>
                    </div>
                  )}
                  {uploading && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>}
                </div>
                <input ref={imgRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                {form.image && <button type="button" onClick={() => setForm((f) => ({ ...f, image: '' }))} className="mt-1 text-xs text-red-400 hover:text-red-600">Remove image</button>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>ចំណងជើង (ខ្មែរ) *</label>
                  <input required value={form.title_kh} onChange={(e) => setForm((f) => ({ ...f, title_kh: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Title (English)</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} className={INPUT_CLS} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Link (URL)</label>
                  <input value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} className={INPUT_CLS} />
                </div>
                <div>
                  <label className={LABEL_CLS}>Order</label>
                  <input type="number" min="0" value={form.order_num} onChange={(e) => setForm((f) => ({ ...f, order_num: parseInt(e.target.value) || 0 }))} className={INPUT_CLS} />
                </div>
              </div>

              <label className="flex items-center gap-2.5 text-[13px] text-slate-600 cursor-pointer">
                <input type="checkbox" checked={!!form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked ? 1 : 0 }))} className="w-4 h-4 rounded" />
                Active (visible)
              </label>

              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving || uploading}
                  className="flex-1 bg-slate-800 hover:bg-slate-900 text-white py-2.5 rounded-xl text-[13.5px] font-semibold transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                  <FontAwesomeIcon icon={saving ? faCheck : faFloppyDisk} />
                  {saving ? 'Saving...' : editId ? 'Save Changes' : 'Add Slider'}
                </button>
                <button type="button" onClick={resetForm}
                  className="border border-slate-200 text-slate-600 hover:bg-slate-50 px-5 py-2.5 rounded-xl text-[13px] transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faXmark} />Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slider preview modal */}
      {previewSlider && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPreviewSlider(null)}>
          <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setPreviewSlider(null)}
              className="absolute -top-10 right-0 text-white/70 hover:text-white text-sm flex items-center gap-1.5 transition-colors"
            >
              <FontAwesomeIcon icon={faXmark} /> Close
            </button>
            <div className="rounded-xl overflow-hidden shadow-2xl">
              <div className="relative">
                <img src={previewSlider.image} alt={previewSlider.title_kh} className="w-full object-cover" style={{ maxHeight: '85vh' }} />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <p className="text-white font-bold text-lg leading-snug">{previewSlider.title_kh}</p>
                  {previewSlider.title && <p className="text-slate-300 text-sm mt-1">{previewSlider.title}</p>}
                  <p className="text-slate-400 text-xs mt-2 font-mono">{previewSlider.link}</p>
                </div>
                <span className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full">#{previewSlider.order_num}</span>
                <span className={`absolute top-3 left-3 text-[11px] font-medium px-2 py-0.5 rounded-full border ${previewSlider.active ? 'bg-emerald-500/90 text-white border-emerald-400' : 'bg-slate-500/90 text-white border-slate-400'}`}>
                  {previewSlider.active ? 'Active' : 'Hidden'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-lg" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Delete Slider?</h3>
            <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 text-[13px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Users Panel ───────────────────────────────────────────────────────────────

interface UserRow { id: number; name: string; email: string; role: string; status: string; created_at: string }

const USER_PER_PAGE = 10
const defaultUserForm = { name: '', email: '', password: '', role: 'editor', status: 'active' }

function UsersPanel({ onToast, currentUserId, currentUserRole }: { onToast: (msg: string, type?: 'success' | 'error') => void; currentUserId?: number; currentUserRole?: string }) {
  const [users, setUsers]         = useState<UserRow[]>([])
  const [showForm, setShowForm]   = useState(false)
  const [editId, setEditId]       = useState<number | null>(null)
  const [saving, setSaving]       = useState(false)
  const [deleteId, setDeleteId]   = useState<number | null>(null)
  const [search, setSearch]       = useState('')
  const [page, setPage]           = useState(1)
  const [form, setForm]           = useState(defaultUserForm)

  const load = () => api.get<UserRow[]>('/admin/users').then((r) => setUsers(r.data)).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setForm(defaultUserForm); setEditId(null); setShowForm(true) }
  const openEdit = (u: UserRow) => { setForm({ name: u.name, email: u.email, password: '', role: u.role, status: u.status }); setEditId(u.id); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditId(null); setForm(defaultUserForm) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      const payload: Record<string, string> = { name: form.name, email: form.email, role: form.role, status: form.status }
      if (form.password) payload.password = form.password
      if (editId !== null) { await api.put(`/admin/users/${editId}`, payload); onToast('User updated!') }
      else { await api.post('/admin/users', { ...payload, password: form.password || 'changeme' }); onToast('User created!') }
      load(); closeForm()
    } catch { onToast('Save failed', 'error') } finally { setSaving(false) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/admin/users/${id}`); load(); setDeleteId(null); onToast('User deleted') }
    catch { onToast('Delete failed', 'error') }
  }

  const filtered = users.filter((u) => {
    if (currentUserRole !== 'superAdmin' && u.role === 'superAdmin') return false
    return !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase())
  })
  const totalPages = Math.max(1, Math.ceil(filtered.length / USER_PER_PAGE))
  const paged = filtered.slice((page - 1) * USER_PER_PAGE, page * USER_PER_PAGE)

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      superAdmin: 'bg-purple-50 text-purple-700 border-purple-200',
      admin:      'bg-blue-50 text-blue-700 border-blue-200',
      editor:     'bg-slate-50 text-slate-600 border-slate-200',
    }
    return map[role] ?? map.editor
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <FontAwesomeIcon icon={faUsers} className="text-slate-600 text-lg" />
          <h1 className="text-lg font-bold text-slate-800">Users / <span className="font-normal text-slate-500">អ្នកប្រើ</span></h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[11px]" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1) }}
              className="pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-700 bg-white placeholder:text-slate-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-50 transition-all w-48"
            />
          </div>
          <button
            onClick={openAdd}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-900 text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            <FontAwesomeIcon icon={faPlus} className="text-[11px]" />
            Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider w-10">SL</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden md:table-cell">Email</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="text-center px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider hidden lg:table-cell">Created</th>
                <th className="text-right px-4 py-3 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paged.map((u, idx) => {
                const sl = (page - 1) * USER_PER_PAGE + idx + 1
                const isSelf = u.id === currentUserId
                return (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    {/* SL */}
                    <td className="px-4 py-3">
                      <span className="inline-flex w-6 h-6 rounded-full bg-slate-100 text-slate-500 text-[11px] font-bold items-center justify-center">{sl}</span>
                    </td>
                    {/* Name + avatar */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-green-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-800">{u.name}</p>
                          {isSelf && <p className="text-[11px] text-green-600 font-medium">You</p>}
                        </div>
                      </div>
                    </td>
                    {/* Email */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <p className="text-slate-500">{u.email}</p>
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border capitalize ${roleBadge(u.role)}`}>
                        {u.role}
                      </span>
                    </td>
                    {/* Status */}
                    <td className="px-4 py-3 text-center">
                      {u.status === 'active'
                        ? <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-medium px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />Active</span>
                        : <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 border border-slate-200 text-[11px] font-medium px-2 py-0.5 rounded-full"><span className="w-1.5 h-1.5 rounded-full bg-slate-400" />Inactive</span>
                      }
                    </td>
                    {/* Created */}
                    <td className="px-4 py-3 text-slate-400 text-[12px] hidden lg:table-cell">
                      {new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="w-7 h-7 flex items-center justify-center rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
                          title="Edit"
                        >
                          <FontAwesomeIcon icon={faPen} className="text-[11px]" />
                        </button>
                        <button
                          onClick={() => !isSelf && setDeleteId(u.id)}
                          disabled={isSelf}
                          title={isSelf ? 'Cannot delete your own account' : 'Delete'}
                          className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors ${isSelf ? 'bg-slate-50 text-slate-300 cursor-not-allowed' : 'bg-red-50 hover:bg-red-100 text-red-500'}`}
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-[11px]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center">
              <FontAwesomeIcon icon={faUsers} className="text-4xl text-slate-200 mb-3" />
              <p className="text-slate-400 text-sm">No users found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-slate-100 gap-2">
            <p className="text-[12.5px] text-slate-500">{filtered.length} users · page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronLeft} className="text-[11px]" />
              </button>
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const pg = totalPages <= 7 ? i + 1 : i + Math.max(1, Math.min(page - 3, totalPages - 6))
                return (
                  <button key={pg} onClick={() => setPage(pg)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12.5px] font-medium transition-colors ${pg === page ? 'bg-slate-800 text-white' : 'border border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                    {pg}
                  </button>
                )
              })}
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                <FontAwesomeIcon icon={faChevronRight} className="text-[11px]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
              <h2 className="font-bold text-slate-800 flex items-center gap-2">
                <FontAwesomeIcon icon={faUsers} className="text-slate-500" />
                {editId !== null ? 'Edit User' : 'Add User'}
              </h2>
              <button onClick={closeForm} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors">
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label className={LABEL_CLS}>Full Name</label>
                <input className={INPUT_CLS} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="John Doe" required />
              </div>
              <div>
                <label className={LABEL_CLS}>Email</label>
                <input type="email" className={INPUT_CLS} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="user@example.com" required />
              </div>
              <div>
                <label className={LABEL_CLS}>{editId !== null ? 'New Password (leave blank to keep)' : 'Password'}</label>
                <input
                  type="password"
                  className={INPUT_CLS}
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  placeholder={editId !== null ? '••••••••' : 'Min 6 characters'}
                  required={editId === null}
                  minLength={editId === null ? 6 : 0}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={LABEL_CLS}>Role</label>
                  <select className={INPUT_CLS} value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value }))}>
                    <option value="editor">Editor</option>
                    <option value="admin">Admin</option>
                    <option value="superAdmin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className={LABEL_CLS}>Status</label>
                  <select className={INPUT_CLS} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={closeForm}
                  className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 text-[13px] bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-medium transition-colors disabled:opacity-60">
                  <FontAwesomeIcon icon={faFloppyDisk} className="text-[12px]" />
                  {saving ? 'Saving…' : editId !== null ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <FontAwesomeIcon icon={faTrash} className="text-red-500 text-lg" />
            </div>
            <h3 className="font-bold text-slate-800 mb-1">Delete User?</h3>
            <p className="text-slate-500 text-sm mb-5">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)}
                className="flex-1 px-4 py-2 text-[13px] border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 transition-colors">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2 text-[13px] bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Settings Panel ────────────────────────────────────────────────────────────

function SettingsPanel({ onToast }: { onToast: (msg: string, type?: 'success' | 'error') => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [settings, setSettings]       = useState<Record<string, string>>({})
  const [logoPreview, setLogoPreview] = useState<string>('')
  const [uploading, setUploading]     = useState(false)
  const [saving, setSaving]           = useState(false)

  useEffect(() => {
    api.get<Record<string, string>>('/admin/settings').then((r) => {
      setSettings(r.data)
      setLogoPreview(r.data.logo_url ?? '')
    }).catch(() => {})
  }, [])

  const handleLogoFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) { onToast('Please select an image file (PNG, JPG, SVG, WebP)', 'error'); return }
    if (file.size > 2 * 1024 * 1024) { onToast('Logo file must be under 2MB', 'error'); return }
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const res = await api.post<{ data: { url: string } }>('/admin/upload?folder=settings', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      const url = res.data.data.url
      setLogoPreview(url)
      await api.put('/admin/settings', { logo_url: url })
      setSettings((s) => ({ ...s, logo_url: url }))
      onToast('Logo uploaded and saved!')
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (link) link.href = url
    } catch { onToast('Upload failed', 'error') }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = '' }
  }

  const removeLogo = async () => {
    await api.put('/admin/settings', { logo_url: '' })
    setLogoPreview('')
    setSettings((s) => ({ ...s, logo_url: '' }))
    const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
    if (link) link.href = '/vite.svg'
    onToast('Logo removed')
  }

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.put('/admin/settings', settings)
      onToast('Settings saved!')
    } catch { onToast('Save failed', 'error') }
    finally { setSaving(false) }
  }

  const set = (k: string, v: string) => setSettings((s) => ({ ...s, [k]: v }))

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <FontAwesomeIcon icon={faGear} className="text-slate-600 text-lg" />
        <h1 className="text-lg font-bold text-slate-800">Settings / <span className="font-normal text-slate-500">ការកំណត់</span></h1>
      </div>

      {/* Logo Card */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <FontAwesomeIcon icon={faImage} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700 text-sm">Logo / រូបតំណាង</h3>
        </div>
        <div className="p-6 flex flex-col md:flex-row gap-6 items-start">
          <div className="flex-shrink-0">
            <p className="text-xs text-slate-500 mb-2">Preview</p>
            <div className="w-32 h-32 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden">
              {logoPreview && logoPreview !== '/uploads/settings/logo.png' ? (
                <img src={logoPreview} alt="logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center text-slate-300">
                  <FontAwesomeIcon icon={faImage} className="text-3xl mb-1" />
                  <p className="text-xs">No logo</p>
                </div>
              )}
            </div>
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-slate-700 mb-1">Upload Logo</h4>
            <p className="text-xs text-slate-400 mb-4">PNG, JPG, SVG or WebP • Max 2MB • Recommended: square 200×200px+</p>
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" onChange={handleLogoFile} className="hidden" />
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading}
                className="bg-gray-900 hover:bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
                <FontAwesomeIcon icon={uploading ? faCheck : faUpload} />
                {uploading ? 'Uploading...' : 'Choose Logo File'}
              </button>
              {logoPreview && logoPreview !== '/uploads/settings/logo.png' && (
                <button type="button" onClick={removeLogo}
                  className="border border-red-200 text-red-500 hover:bg-red-50 px-4 py-2 rounded-lg text-sm transition-colors flex items-center gap-2">
                  <FontAwesomeIcon icon={faTrash} />Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Site Settings Form */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center gap-2">
          <FontAwesomeIcon icon={faGear} className="text-slate-500" />
          <h3 className="font-semibold text-slate-700 text-sm">Site Settings</h3>
        </div>
        <form onSubmit={saveSettings} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label="ឈ្មោះគេហទំព័រ (ខ្មែរ)" value={settings.site_name ?? ''} onChange={(v) => set('site_name', v)} />
            <SettingField label="Site Name (English)" value={settings.site_name_en ?? ''} onChange={(v) => set('site_name_en', v)} />
          </div>
          <SettingField label="Description" value={settings.site_description ?? ''} onChange={(v) => set('site_description', v)} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label="Contact Email" value={settings.contact_email ?? ''} onChange={(v) => set('contact_email', v)} type="email" />
            <SettingField label="Hotline / Phone" value={settings.hotline ?? settings.contact_phone ?? ''} onChange={(v) => set('hotline', v)} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label="Facebook URL" value={settings.facebook_url ?? ''} onChange={(v) => set('facebook_url', v)} type="url" />
            <SettingField label="Telegram URL" value={settings.telegram_url ?? ''} onChange={(v) => set('telegram_url', v)} type="url" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SettingField label="អាសយដ្ឋាន (ខ្មែរ)" value={settings.address_kh ?? ''} onChange={(v) => set('address_kh', v)} />
            <SettingField label="Address (English)" value={settings.address_en ?? ''} onChange={(v) => set('address_en', v)} />
          </div>
          <div className="pt-2">
            <button type="submit" disabled={saving}
              className="bg-gray-900 hover:bg-gray-800 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-2">
              <FontAwesomeIcon icon={saving ? faCheck : faFloppyDisk} />
              {saving ? 'Saving...' : 'Save Settings'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Setting Field ─────────────────────────────────────────────────────────────

function SettingField({ label, value, onChange, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <input type={type} value={value} onChange={(e) => onChange(e.target.value)} className={INPUT_CLS} />
    </div>
  )
}

// ── Image Uploader ────────────────────────────────────────────────────────────

function ImageUploader({
  value, onChange, folder, onError,
}: {
  value: string
  onChange: (url: string) => void
  folder: string
  onError: (msg: string, type: 'error') => void
}) {
  const inputRef  = useRef<HTMLInputElement>(null)
  const multiRef  = useRef<HTMLInputElement>(null)
  const [uploading, setUploading]       = useState(false)
  const [gallery, setGallery]           = useState<string[]>([])
  const [copied, setCopied]             = useState<string | null>(null)
  const [multiLoading, setMultiLoading] = useState(false)

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    if (!file.type.startsWith('image/')) { onError('Please select an image file', 'error'); return null }
    if (file.size > 5 * 1024 * 1024) { onError('Max file size is 5MB', 'error'); return null }
    const fd = new FormData(); fd.append('file', file)
    const res = await api.post<{ data: { url: string } }>(`/admin/upload?folder=${folder}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    return res.data.data.url
  }, [folder, onError])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadFile(file)
      if (url) onChange(url)
    } catch { onError('Upload failed', 'error') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  const handleMultiFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setMultiLoading(true)
    const urls: string[] = []
    for (const file of files) {
      try {
        const url = await uploadFile(file)
        if (url) urls.push(url)
      } catch { /* skip */ }
    }
    setGallery((g) => [...g, ...urls])
    setMultiLoading(false)
    if (multiRef.current) multiRef.current.value = ''
  }

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(url); setTimeout(() => setCopied(null), 1500)
    })
  }

  return (
    <div className="space-y-3">
      {/* Thumbnail click-to-upload */}
      <div
        onClick={() => inputRef.current?.click()}
        className="relative cursor-pointer rounded-xl overflow-hidden border-2 border-dashed border-slate-200 hover:border-blue-400 transition-colors bg-slate-50"
        style={{ aspectRatio: '16/9', maxHeight: 200 }}
      >
        {value ? (
          <>
            <img src={value} alt="thumbnail" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-sm font-medium flex items-center gap-2"><FontAwesomeIcon icon={faUpload} />Change image</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-2">
            <FontAwesomeIcon icon={faImage} className="text-4xl text-slate-300" />
            <p className="text-sm font-medium">Click to upload</p>
            <p className="text-xs text-slate-300">PNG, JPG, WebP • Max 5MB</p>
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2 items-center">
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="Or paste image URL..."
          className="flex-1 px-3 py-1.5 border border-slate-200 rounded-lg text-xs text-slate-500 bg-white outline-none focus:border-blue-400 transition-colors" />
        {value && (
          <button type="button" onClick={() => onChange('')}
            className="text-xs text-red-400 hover:text-red-600 px-2 py-1.5 rounded-lg border border-red-100 hover:bg-red-50 transition-colors flex items-center gap-1">
            <FontAwesomeIcon icon={faXmark} />
          </button>
        )}
      </div>

      {/* Multi-image gallery */}
      <div className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
            <FontAwesomeIcon icon={faPhotoFilm} className="text-blue-400" />
            Multiple images
          </span>
          <button type="button" onClick={() => multiRef.current?.click()} disabled={multiLoading}
            className="text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-colors disabled:opacity-50">
            <FontAwesomeIcon icon={faUpload} className="text-[10px]" />
            {multiLoading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
        {gallery.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {gallery.map((url) => (
              <div key={url} className="relative group rounded-lg overflow-hidden border border-slate-200 bg-white">
                <img src={url} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1">
                  <button type="button" onClick={() => copyUrl(url)}
                    className="text-[10px] bg-white text-slate-800 px-2 py-0.5 rounded font-medium hover:bg-yellow-400 hover:text-white transition-colors">
                    {copied === url ? '✓ Copied!' : 'Copy URL'}
                  </button>
                  <button type="button" onClick={() => onChange(url)}
                    className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-medium hover:bg-blue-700 transition-colors">
                    Set Thumb
                  </button>
                </div>
                <button type="button" onClick={() => setGallery((g) => g.filter((u) => u !== url))}
                  className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 text-white rounded-full text-[8px] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {gallery.length === 0 && !multiLoading && (
          <p className="text-xs text-slate-400 text-center py-2">Upload → hover → Copy URL → paste into editor</p>
        )}
      </div>

      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <input ref={multiRef} type="file" accept="image/*" multiple onChange={handleMultiFiles} className="hidden" />
    </div>
  )
}
