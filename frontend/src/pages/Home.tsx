import { useEffect, useState, useCallback } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faNewspaper, faChevronLeft, faChevronRight, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { format } from 'date-fns'
import api from '../api/client'
import type { Article, Category, ArticlesResponse } from '../types'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import HeroSlider from '../components/HeroSlider'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'

export default function Home() {
  const [searchParams] = useSearchParams()
  const catParam    = searchParams.get('cat')
  const searchParam = searchParams.get('search')
  const allParam    = searchParams.get('all')

  const [posts, setPosts]           = useState<Article[]>([])
  const [featured, setFeatured]     = useState<Article[]>([])
  const [breaking, setBreaking]     = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [total, setTotal]           = useState(0)
  const [page, setPage]             = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading]       = useState(true)
  const [activeCategory, setActiveCategory] = useState<Category | null>(null)

  const { lang, isKh } = useLanguage()
  const t = ui[lang]

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    try {
      if (allParam) {
        const res = await api.get<ArticlesResponse>('/public/articles?status=published&show_video=false&limit=500')
        setPosts(res.data.data); setTotal(res.data.total); setTotalPages(1)
      } else {
        const params = new URLSearchParams({ page: String(page), limit: '10', status: 'published', show_video: 'false' })
        if (catParam)         params.set('category_slug', catParam)
        else if (searchParam) params.set('search', searchParam)
        const res = await api.get<ArticlesResponse>(`/public/articles?${params}`)
        setPosts(res.data.data); setTotal(res.data.total); setTotalPages(res.data.totalPages)
      }
    } finally { setLoading(false) }
  }, [catParam, searchParam, allParam, page])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  useEffect(() => {
    api.get<ArticlesResponse>('/public/articles?status=published&featured=true&limit=2').then((r) => setFeatured(r.data.data)).catch(() => {})
    api.get<ArticlesResponse>('/public/articles?status=published&breaking=true&limit=1').then((r) => setBreaking(r.data.data)).catch(() => {})
    api.get<Category[]>('/public/categories').then((r) => {
      setCategories(r.data)
      setActiveCategory(catParam ? (r.data.find((c) => c.slug === catParam) ?? null) : null)
    }).catch(() => {})
  }, [catParam])

  const activeCatName = activeCategory ? (isKh ? activeCategory.name_kh : activeCategory.name) : null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Slider + featured articles — merged side-by-side */}
      {(
        <section className="bg-primary-800 py-4 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3" style={{ height: '380px' }}>
              {/* Slider — left 2/3 */}
              <div className="h-60 md:h-full md:col-span-2 overflow-hidden rounded-lg">
                <HeroSlider />
              </div>
              {/* Right column: breaking news + featured */}
              <div className="hidden md:flex flex-col gap-2 overflow-hidden" style={{ height: '380px' }}>

                {/* Breaking news — 1 article, full thumbnail */}
                {breaking[0] && (
                  <Link to={`/post/${breaking[0].id}`}
                    className="group relative rounded-lg overflow-hidden shrink-0"
                    style={{ flex: '1 1 55%' }}>
                    <img
                      src={breaking[0].image}
                      alt=""
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <span className="absolute top-2 left-2 bg-red-700 text-white text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1">
                      <FontAwesomeIcon icon={faCircleExclamation} className="text-gold-300 text-[9px]" />
                      {isKh ? 'ព័ត៌មានបន្ទាន់' : 'Breaking'}
                    </span>
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white font-bold text-sm leading-snug line-clamp-3 group-hover:text-gold-300 transition-colors">
                        {isKh ? breaking[0].title_kh : breaking[0].title}
                      </p>
                      <p className="text-gray-300 text-[10px] mt-1">{format(new Date(breaking[0].published_at), 'dd/MM/yyyy')}</p>
                    </div>
                  </Link>
                )}

                {/* Featured article */}
                {featured[0] && (
                  <div className="rounded-lg overflow-hidden shrink-0" style={{ flex: '1 1 45%' }}>
                    <PostCard post={featured[0]} variant="featured" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <main className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-1 h-6 bg-gold-500 rounded" />
                <h2 className="text-lg font-bold text-primary-800">
                  {searchParam
                    ? `${t.searchResults}: "${searchParam}"`
                    : activeCatName ?? t.latestNews}
                </h2>
                <span className="text-sm text-gray-400">({total} {t.items})</span>
              </div>
              {!catParam && !searchParam && !allParam && (
                <Link to="/?all=1" className="text-sm text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1">
                  {t.viewAll} <FontAwesomeIcon icon={faChevronRight} className="text-[10px]" />
                </Link>
              )}
            </div>

            <div className="flex gap-2 flex-wrap mb-4">
              <Link
                to="/?all=1"
                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${allParam ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'}`}>
                {t.all}
              </Link>
              {categories.map((cat) => (
                <Link key={cat.id} to={`/?cat=${cat.slug}`}
                  className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${catParam === cat.slug ? 'bg-primary-700 text-white' : 'bg-white text-gray-600 hover:bg-primary-50 border border-gray-200'}`}>
                  {isKh ? cat.name_kh : cat.name}
                </Link>
              ))}
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
                    <div className="h-48 bg-gray-200" />
                    <div className="p-4 space-y-2"><div className="h-3 bg-gray-200 rounded w-1/4" /><div className="h-4 bg-gray-200 rounded w-3/4" /><div className="h-3 bg-gray-200 rounded" /></div>
                  </div>
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="bg-white rounded-lg p-12 text-center text-gray-400 shadow-sm">
                <FontAwesomeIcon icon={faNewspaper} className="text-4xl mb-3 text-gray-300" />
                <p className="mt-2">{t.noNews}</p>
                <p className="text-sm mt-1">{t.noNewsSubtitle}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => <PostCard key={post.id} post={post} />)}
              </div>
            )}

            {totalPages > 1 && !allParam && (
              <div className="flex justify-center items-center gap-1.5 mt-8 flex-wrap">
                {/* Prev */}
                <button
                  onClick={() => { setPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={page === 1}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-primary-50 hover:border-primary-300 transition-colors flex items-center gap-1.5"
                >
                  <FontAwesomeIcon icon={faChevronLeft} className="text-xs" />{t.prev}
                </button>

                {/* Page numbers with sliding window */}
                {(() => {
                  const winSize = 5
                  let start = Math.max(1, page - Math.floor(winSize / 2))
                  let end   = Math.min(totalPages, start + winSize - 1)
                  if (end - start < winSize - 1) start = Math.max(1, end - winSize + 1)
                  const pages = []
                  if (start > 1) {
                    pages.push(
                      <button key={1} onClick={() => { setPage(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="w-9 h-9 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-300 transition-colors">1</button>
                    )
                    if (start > 2) pages.push(<span key="s1" className="text-gray-400 px-1">…</span>)
                  }
                  for (let i = start; i <= end; i++) {
                    const pg = i
                    pages.push(
                      <button key={pg} onClick={() => { setPage(pg); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${pg === page ? 'bg-primary-700 text-white shadow-sm' : 'bg-white border border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-300'}`}>
                        {pg}
                      </button>
                    )
                  }
                  if (end < totalPages) {
                    if (end < totalPages - 1) pages.push(<span key="s2" className="text-gray-400 px-1">…</span>)
                    pages.push(
                      <button key={totalPages} onClick={() => { setPage(totalPages); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                        className="w-9 h-9 rounded-lg text-sm font-medium bg-white border border-gray-200 text-gray-600 hover:bg-primary-50 hover:border-primary-300 transition-colors">{totalPages}</button>
                    )
                  }
                  return pages
                })()}

                {/* Next */}
                <button
                  onClick={() => { setPage((p) => Math.min(totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-40 hover:bg-primary-50 hover:border-primary-300 transition-colors flex items-center gap-1.5"
                >
                  {t.next}<FontAwesomeIcon icon={faChevronRight} className="text-xs" />
                </button>
              </div>
            )}
          </main>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}
