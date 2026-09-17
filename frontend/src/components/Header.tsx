import { useState, useEffect } from 'react'

const KH_WEEKDAYS = ['អាទិត្យ', 'ច័ន្ទ', 'អង្គារ', 'ពុធ', 'ព្រហស្បតិ៍', 'សុក្រ', 'សៅរ៍']
const KH_MONTHS   = ['មករា', 'កុម្ភៈ', 'មីនា', 'មេសា', 'ឧសភា', 'មិថុនា', 'កក្កដា', 'សីហា', 'កញ្ញា', 'តុលា', 'វិច្ឆិកា', 'ធ្នូ']
const toKhmerNum  = (n: number) => String(n).replace(/[0-9]/g, (d) => '០១២៣៤៥៦៧៨៩'[+d])

function khmerDate(date: Date) {
  return `${KH_WEEKDAYS[date.getDay()]} ${toKhmerNum(date.getDate())} ${KH_MONTHS[date.getMonth()]} ${toKhmerNum(date.getFullYear())}`
}
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBars, faXmark, faMagnifyingGlass, faCircleExclamation } from '@fortawesome/free-solid-svg-icons'
import { useSettings } from '../contexts/SettingsContext'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'
import api from '../api/client'
import type { Article } from '../types'

export default function Header() {
  const [menuOpen, setMenuOpen]   = useState(false)
  const [search, setSearch]       = useState('')
  const [breaking, setBreaking]   = useState<Article[]>([])
  const [categories, setCategories] = useState<{ id: number; name: string; name_kh: string; slug: string }[]>([])
  const navigate  = useNavigate()
  const location  = useLocation()

  const handleHomeClick = () => {
    if (location.pathname === '/' && location.search === '') {
      navigate(0)
    } else {
      navigate('/')
    }
  }

  useEffect(() => {
    api.get<{ data: Article[] }>('/public/articles?status=published&breaking=true&limit=10')
      .then((r) => setBreaking(r.data.data))
      .catch(() => {})
    api.get<{ id: number; name: string; name_kh: string; slug: string }[]>('/public/categories')
      .then((r) => setCategories(r.data))
      .catch(() => {})
  }, [])
  const settings  = useSettings()
  const { lang, isKh, setLang } = useLanguage()
  const t = ui[lang]

  const hasLogo = !!settings.logo_url && settings.logo_url !== '/uploads/settings/logo.png'

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (search.trim()) { navigate(`/?search=${encodeURIComponent(search.trim())}`); setSearch('') }
  }

  const navItems = [
    { label: t.navHome,    href: '/' },
    ...categories.map((cat) => ({ label: isKh ? cat.name_kh : cat.name, href: `/?cat=${cat.slug}` })),
    { label: t.navContact, href: '/contact' },
  ]

  const dateStr = isKh
    ? khmerDate(new Date())
    : new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <header className="w-full">
      <div className="bg-primary-900 text-white text-xs py-1">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <span>ព្រះរាជាណាចក្រកម្ពុជា — Kingdom of Cambodia</span>
          <div className="flex items-center gap-1">
<button
              onClick={() => setLang('kh')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${lang === 'kh' ? 'bg-gold-500 text-white' : 'hover:text-gold-400'}`}>
              ខ្មែរ
            </button>
            <span className="text-gray-500">|</span>
            <button
              onClick={() => setLang('en')}
              className={`px-2 py-0.5 rounded text-xs font-bold transition-colors ${lang === 'en' ? 'bg-gold-500 text-white' : 'hover:text-gold-400'}`}>
              EN
            </button>
          </div>
        </div>
      </div>

      <div className="bg-primary-800 text-white py-4">
        <div className="max-w-7xl mx-auto px-4 flex items-center justify-between gap-4">
          <button onClick={handleHomeClick} className="flex items-center gap-4 text-left">
            {hasLogo ? (
              <img
                src={settings.logo_url}
                alt={settings.site_name}
                className="w-16 h-16 object-contain rounded-full bg-white p-1 shadow-lg flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-16 bg-gold-400 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                <svg viewBox="0 0 64 64" className="w-12 h-12 fill-primary-900">
                  <path d="M32 4L8 16v16c0 13 10.4 24.5 24 27 13.6-2.5 24-14 24-27V16L32 4z"/>
                  <path d="M32 10L12 20v12c0 10 8 19 20 21 12-2 20-11 20-21V20L32 10z" fill="#d97706"/>
                  <text x="32" y="36" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1e3a6e">NP</text>
                </svg>
              </div>
            )}
            <div>
              <div className="text-xl font-bold text-gold-400 font-battambang">
                {isKh ? settings.site_name : (settings.site_name_en || 'Cambodia National Police')}
              </div>
              <div className="text-sm text-gray-200">
                {isKh ? settings.site_name_en : settings.site_name}
              </div>
              <div className="text-xs text-gray-400">Ministry of Interior</div>
            </div>
          </button>

          <form onSubmit={handleSearch} className="hidden md:flex items-center gap-2">
            <div className="relative">
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-64 pl-9 pr-3 py-2 rounded text-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400" />
              <FontAwesomeIcon icon={faMagnifyingGlass} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            </div>
            <button type="submit" className="bg-gold-500 hover:bg-gold-400 text-white px-4 py-2 rounded text-sm font-medium transition-colors">
              {t.searchBtn}
            </button>
          </form>
        </div>
      </div>

      <nav className="bg-primary-700 shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <ul className="hidden md:flex">
              {navItems.map((item) => {
                const isHome = item.href === '/'
                const isActive = isHome
                  ? location.pathname === '/' && location.search === ''
                  : location.pathname + location.search === item.href || location.search.startsWith(`?cat=`) && item.href.startsWith('/?cat=') && location.search === item.href.slice(1)
                return (
                  <li key={item.href}>
                    {isHome ? (
                      <button
                        onClick={handleHomeClick}
                        className={`block px-4 py-3 text-sm transition-colors border-b-2 ${isActive ? 'text-gold-400 border-gold-400 bg-primary-600' : 'text-white border-transparent hover:bg-primary-600 hover:text-gold-400 hover:border-gold-400'}`}>
                        {item.label}
                      </button>
                    ) : (
                      <Link to={item.href}
                        className={`block px-4 py-3 text-sm transition-colors border-b-2 ${isActive ? 'text-gold-400 border-gold-400 bg-primary-600' : 'text-white border-transparent hover:bg-primary-600 hover:text-gold-400 hover:border-gold-400'}`}>
                        {item.label}
                      </Link>
                    )}
                  </li>
                )
              })}
            </ul>
            <button className="md:hidden text-white p-3" onClick={() => setMenuOpen(!menuOpen)}>
              <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="w-5 h-5" />
            </button>
            <div className="hidden md:block text-gray-300 text-xs py-3">{dateStr}</div>
          </div>
          {menuOpen && (
            <ul className="md:hidden pb-2 border-t border-primary-600">
              {navItems.map((item) => (
                <li key={item.href}>
                  {item.href === '/' ? (
                    <button
                      onClick={() => { handleHomeClick(); setMenuOpen(false) }}
                      className="block w-full text-left px-4 py-2 text-white text-sm hover:bg-primary-600">
                      {item.label}
                    </button>
                  ) : (
                    <Link to={item.href} className="block px-4 py-2 text-white text-sm hover:bg-primary-600"
                      onClick={() => setMenuOpen(false)}>{item.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </nav>

      {/* Breaking news ticker */}
      {breaking.length > 0 && (
        <div className="bg-red-700 text-white flex items-center overflow-hidden" style={{ height: '32px' }}>
          <div className="bg-red-900 flex items-center gap-1.5 px-3 h-full text-xs font-bold whitespace-nowrap shrink-0 z-10">
            <FontAwesomeIcon icon={faCircleExclamation} className="text-gold-400" />
            {isKh ? 'ព័ត៌មានបន្ទាន់' : 'Breaking'}
          </div>
          <div className="overflow-hidden flex-1 relative h-full flex items-center">
            <span className="ticker-track text-xs">
              {breaking.map((p, i) => (
                <span key={p.id}>
                  <Link
                    to={`/post/${p.id}`}
                    className="hover:text-gold-300 transition-colors mx-6">
                    {isKh ? p.title_kh : p.title}
                  </Link>
                  {i < breaking.length - 1 && <span className="text-red-400 mx-2">◆</span>}
                </span>
              ))}
            </span>
          </div>
        </div>
      )}
    </header>
  )
}
