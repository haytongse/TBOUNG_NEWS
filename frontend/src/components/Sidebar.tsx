import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSquare, faPlay, faPhone, faTriangleExclamation } from '@fortawesome/free-solid-svg-icons'
import { faYoutube } from '@fortawesome/free-brands-svg-icons'
import api from '../api/client'
import type { Article } from '../types'
import PostCard from './PostCard'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'

function getYoutubeEmbed(url?: string): string | null {
  if (!url) return null
  try {
    const u = new URL(url)
    let id = ''
    if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v') ?? ''
    else if (u.hostname === 'youtu.be')     id = u.pathname.slice(1).split('?')[0]
    return id ? `https://www.youtube.com/embed/${id}` : null
  } catch { return null }
}

export default function Sidebar() {
  const [recent, setRecent]     = useState<Article[]>([])
  const [popular, setPopular]   = useState<Article[]>([])
  const [videos, setVideos]     = useState<Article[]>([])
  const { lang, isKh } = useLanguage()
  const t = ui[lang]

  useEffect(() => {
    api.get<{ data: Article[] }>('/public/articles?status=published&limit=5').then((r) => setRecent(r.data.data)).catch(() => {})
    api.get<{ data: Article[] }>('/public/articles?status=published&featured=true&limit=4').then((r) => setPopular(r.data.data)).catch(() => {})
    api.get<{ data: Article[] }>('/public/articles?status=published&show_video=true&limit=5').then((r) => setVideos(r.data.data)).catch(() => {})
  }, [])

  return (
    <aside className="space-y-6">
      {/* Breaking news ticker */}
      <div className="bg-red-600 text-white rounded overflow-hidden">
        <div className="flex items-center">
          <span className="bg-red-800 px-3 py-2 text-xs font-bold whitespace-nowrap flex items-center gap-1.5">
            <FontAwesomeIcon icon={faPlay} className="text-[10px]" />{t.breakingNews}
          </span>
          <div className="overflow-hidden flex-1 px-3 py-2 text-xs animate-pulse">
            {t.breakingText}
          </div>
        </div>
      </div>

      {/* YouTube Videos */}
      {videos.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
          <div className="bg-red-600 text-white px-4 py-3 flex items-center gap-2">
            <FontAwesomeIcon icon={faYoutube} className="text-white text-base" />
            <h3 className="font-semibold text-sm">{isKh ? 'វីដេអូព័ត៌មាន' : 'Video News'}</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {videos.map((v) => {
              const embedUrl = getYoutubeEmbed(v.video_url)
              const title    = isKh ? v.title_kh : v.title
              if (!embedUrl) return null
              return (
                <div key={v.id} className="p-3 space-y-2">
                  <div className="rounded overflow-hidden aspect-video bg-black">
                    <iframe
                      src={embedUrl}
                      className="w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    />
                  </div>
                  <Link to={`/post/${v.id}`}
                    className="block text-sm font-medium text-gray-800 hover:text-primary-700 line-clamp-2 leading-snug transition-colors">
                    {title}
                  </Link>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Recent News */}
      <SidebarBox label={t.recentNews}>
        <div className="divide-y divide-gray-50 px-3">
          {recent.map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
        </div>
      </SidebarBox>

      {/* Popular News */}
      <SidebarBox label={t.popularNews}>
        <div className="divide-y divide-gray-50 px-3">
          {popular.map((p) => <PostCard key={p.id} post={p} variant="compact" />)}
        </div>
      </SidebarBox>

      {/* Emergency */}
      <div className="bg-red-700 text-white rounded-lg p-4 text-center">
        <FontAwesomeIcon icon={faTriangleExclamation} className="text-2xl mb-2 text-gold-400" />
        <h4 className="font-bold text-base mb-1">{t.emergency}</h4>
        <div className="flex items-center justify-center gap-2">
          <FontAwesomeIcon icon={faPhone} className="text-gold-400" />
          <p className="text-3xl font-bold text-gold-400">117</p>
        </div>
        <p className="text-xs text-red-200 mt-1">{t.emergencyLine}</p>
      </div>

    </aside>
  )
}

function SidebarBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100">
      <div className="bg-primary-700 text-white px-4 py-3 flex items-center gap-2">
        <FontAwesomeIcon icon={faSquare} className="text-gold-400 text-xs" />
        <h3 className="font-semibold text-sm">{label}</h3>
      </div>
      {children}
    </div>
  )
}
