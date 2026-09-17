import { Link } from 'react-router-dom'
import { format } from 'date-fns'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEye, faStar } from '@fortawesome/free-solid-svg-icons'
import type { Article } from '../types'
import { useLanguage } from '../contexts/LanguageContext'

interface Props { post: Article; variant?: 'default' | 'featured' | 'compact' }

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

export default function PostCard({ post, variant = 'default' }: Props) {
  const { isKh } = useLanguage()
  const date    = format(new Date(post.published_at), 'dd/MM/yyyy')
  const title   = isKh ? post.title_kh : post.title
  const excerpt = isKh ? post.excerpt_kh : post.excerpt

  const embedUrl = post.show_video ? getYoutubeEmbed(post.video_url) : null

  if (variant === 'compact') return (
    <Link to={`/post/${post.id}`} className="flex gap-3 group py-2">
      <img src={post.image} alt={title} className="w-20 h-16 object-cover rounded flex-shrink-0" />
      <div>
        <p className="text-sm font-medium text-gray-800 group-hover:text-primary-600 line-clamp-2 leading-snug">{title}</p>
        <p className="text-xs text-gray-400 mt-1">{date}</p>
      </div>
    </Link>
  )

  if (variant === 'featured') return (
    <Link to={`/post/${post.id}`} className="group relative block h-full overflow-hidden rounded-lg shadow-md card-hover">
      <img src={post.image} alt={title} className="w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <CategoryBadge categoryId={post.category_id} isKh={isKh} />
        <h3 className="text-white font-bold text-lg mt-1 leading-tight line-clamp-2 group-hover:text-gold-400 transition-colors">{title}</h3>
        <div className="flex items-center gap-3 mt-2 text-gray-300 text-xs">
          <span>{date}</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faEye} className="text-[10px]" />{post.views.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  )

  // Default card — show YouTube embed in place of image when available
  return (
    <div className="group bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 flex flex-col">
      {/* Media: YouTube embed or image */}
      {embedUrl ? (
        <div className="w-full aspect-video bg-black flex-shrink-0">
          <iframe
            src={embedUrl}
            className="w-full h-full"
            allowFullScreen
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </div>
      ) : (
        <Link to={`/post/${post.id}`} className="relative overflow-hidden flex-shrink-0 block">
          <img src={post.image} alt={title} className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500" />
          {post.featured && (
            <span className="absolute top-2 left-2 bg-gold-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
              <FontAwesomeIcon icon={faStar} className="text-[10px]" />Featured
            </span>
          )}
        </Link>
      )}

      {/* Text content */}
      <Link to={`/post/${post.id}`} className="p-4 flex flex-col flex-1 hover:bg-gray-50 transition-colors">
        <CategoryBadge categoryId={post.category_id} isKh={isKh} />
        <h3 className="font-bold text-gray-800 mt-2 leading-snug line-clamp-2 group-hover:text-primary-700 transition-colors text-base">{title}</h3>
        <p className="text-gray-500 text-sm mt-2 line-clamp-2 leading-relaxed">{excerpt}</p>
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-100 text-xs text-gray-400 mt-3">
          <span>{date}</span>
          <span className="flex items-center gap-1"><FontAwesomeIcon icon={faEye} className="text-[10px]" />{post.views.toLocaleString()}</span>
        </div>
      </Link>
    </div>
  )
}

const catColors: Record<number, string> = { 1:'bg-blue-100 text-blue-700', 2:'bg-green-100 text-green-700', 3:'bg-red-100 text-red-700', 4:'bg-orange-100 text-orange-700', 5:'bg-purple-100 text-purple-700', 6:'bg-teal-100 text-teal-700' }
const catNamesKh: Record<number, string> = { 1:'ព័ត៌មានទូទៅ', 2:'សុវត្ថិភាព', 3:'ឧក្រិដ្ឋ', 4:'ចរាចរណ៍', 5:'ជូនដំណឹង', 6:'សហគមន៍' }
const catNamesEn: Record<number, string>  = { 1:'General', 2:'Safety', 3:'Crime', 4:'Traffic', 5:'Notice', 6:'Community' }

function CategoryBadge({ categoryId, isKh }: { categoryId: number | null; isKh: boolean }) {
  if (!categoryId) return null
  const name = isKh ? (catNamesKh[categoryId] ?? 'ផ្សេងៗ') : (catNamesEn[categoryId] ?? 'Other')
  return <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded ${catColors[categoryId] ?? 'bg-gray-100 text-gray-600'}`}>{name}</span>
}
