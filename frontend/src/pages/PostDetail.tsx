import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format } from 'date-fns'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCalendarDays, faPen, faEye, faNewspaper, faArrowLeft, faChevronRight, faShareNodes } from '@fortawesome/free-solid-svg-icons'
import { faFacebook, faTelegram } from '@fortawesome/free-brands-svg-icons'
import api from '../api/client'
import type { Article } from '../types'
import Sidebar from '../components/Sidebar'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'

export default function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const [post, setPost]       = useState<Article | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState(false)

  const { lang, isKh } = useLanguage()
  const t = ui[lang]

  useEffect(() => {
    setLoading(true); setError(false)
    api.get<Article>(`/public/articles/${id}`)
      .then((r) => setPost(r.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-6 animate-pulse space-y-4">
          <div className="h-64 bg-gray-200 rounded" />
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          {[...Array(6)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
        </div>
        <Sidebar />
      </div>
    </div>
  )

  if (error || !post) return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="text-center">
        <FontAwesomeIcon icon={faNewspaper} className="text-5xl text-gray-300 mb-4" />
        <h2 className="text-xl font-bold text-gray-700 mb-2">{t.notFound}</h2>
        <p className="text-gray-500 mb-4">{t.notFoundSub}</p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <FontAwesomeIcon icon={faArrowLeft} />{t.backHome}
        </Link>
      </div>
    </div>
  )

  const embedUrl = getYoutubeEmbed(post.video_url)

  const title   = isKh ? post.title_kh   : post.title
  const altTitle = isKh ? post.title      : post.title_kh
  const excerpt = isKh ? post.excerpt_kh : post.excerpt
  const content = isKh ? post.content_kh : post.content
  const catName = post.category ? (isKh ? post.category.name_kh : post.category.name) : null

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Breadcrumb */}
      <div className="bg-primary-800 py-2">
        <div className="max-w-7xl mx-auto px-4 text-xs text-gray-300 flex items-center gap-2">
          <Link to="/" className="hover:text-gold-400 transition-colors">{t.navHome}</Link>
          <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-500" />
          {post.category && (
            <><Link to={`/?cat=${post.category_id}`} className="hover:text-gold-400 transition-colors">{catName}</Link>
            <FontAwesomeIcon icon={faChevronRight} className="text-[9px] text-gray-500" /></>
          )}
          <span className="text-gray-400 line-clamp-1">{title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <article className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {post.show_video && embedUrl ? (
                <div className="w-full aspect-video bg-black">
                  <iframe
                    src={embedUrl}
                    className="w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              ) : (
                <img src={post.image} alt={title} className="w-full h-72 object-cover" />
              )}
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-3 mb-3 text-sm text-gray-500">
                  {post.category && (
                    <Link to={`/?cat=${post.category_id}`}
                      className="bg-primary-100 text-primary-700 px-2 py-0.5 rounded text-xs font-semibold hover:bg-primary-200 transition-colors">
                      {catName}
                    </Link>
                  )}
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faCalendarDays} className="text-primary-400 text-xs" />
                    {format(new Date(post.published_at), isKh ? 'dd MMMM yyyy' : 'MMMM dd, yyyy')}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faPen} className="text-primary-400 text-xs" />{post.author}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faEye} className="text-primary-400 text-xs" />{post.views.toLocaleString()} {t.views}
                  </span>
                </div>

                {/* Primary title */}
                <h1 className="text-2xl font-bold text-primary-900 leading-tight mb-2 font-battambang">{title}</h1>
                {/* Secondary title (other language) */}
                {altTitle && <h2 className="text-base text-gray-500 mb-4 leading-snug">{altTitle}</h2>}
                <hr className="border-primary-100 mb-4" />

                {excerpt && (
                  <p className="text-gray-600 italic bg-blue-50 border-l-4 border-primary-400 px-4 py-3 rounded mb-5 text-sm leading-relaxed">
                    {excerpt}
                  </p>
                )}

                <div className="article-content text-gray-700"
                  dangerouslySetInnerHTML={{ __html: content }} />

                <hr className="mt-6 mb-4 border-gray-100" />
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-sm text-gray-500 flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faShareNodes} className="text-gray-400" />{t.share}
                  </span>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faFacebook} />Facebook
                  </button>
                  <button className="bg-sky-500 hover:bg-sky-600 text-white text-xs px-3 py-1.5 rounded transition-colors flex items-center gap-1.5">
                    <FontAwesomeIcon icon={faTelegram} />Telegram
                  </button>
                </div>
              </div>
            </div>
            <div className="mt-4">
              <Link to="/" className="text-sm text-primary-600 hover:underline flex items-center gap-1.5">
                <FontAwesomeIcon icon={faArrowLeft} className="text-xs" />{t.backHome}
              </Link>
            </div>
          </article>
          <Sidebar />
        </div>
      </div>
    </div>
  )
}

function getYoutubeEmbed(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    let videoId = ''
    if (u.hostname.includes('youtube.com')) videoId = u.searchParams.get('v') ?? ''
    else if (u.hostname === 'youtu.be')     videoId = u.pathname.slice(1)
    return videoId ? `https://www.youtube.com/embed/${videoId}` : null
  } catch { return null }
}
