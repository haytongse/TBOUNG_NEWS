import { useEffect, useState, useCallback, useRef } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronLeft, faChevronRight, faPause, faPlay } from '@fortawesome/free-solid-svg-icons'
import api from '../api/client'
import type { Slider } from '../types'
import { useLanguage } from '../contexts/LanguageContext'
import { ui } from '../i18n/translations'

const INTERVAL = 5000

export default function HeroSlider() {
  const [sliders, setSliders]   = useState<Slider[]>([])
  const [current, setCurrent]   = useState(0)
  const [playing, setPlaying]   = useState(true)
  const [loaded,  setLoaded]    = useState<boolean[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const { lang, isKh } = useLanguage()
  const t = ui[lang]

  useEffect(() => {
    api.get<Slider[]>('/public/sliders').then((r) => {
      setSliders(r.data)
      setLoaded(new Array(r.data.length).fill(false))
    }).catch(() => {})
  }, [])

  const goTo = useCallback((idx: number) => {
    setCurrent((idx + sliders.length) % sliders.length)
  }, [sliders.length])

  const prev = useCallback(() => goTo(current - 1), [current, goTo])
  const next = useCallback(() => goTo(current + 1), [current, goTo])

  useEffect(() => {
    if (!playing || sliders.length < 2) return
    timerRef.current = setInterval(next, INTERVAL)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [playing, next, sliders.length])

  const markLoaded = (i: number) =>
    setLoaded((l) => { const n = [...l]; n[i] = true; return n })

  if (!sliders.length) return (
    <div className="w-full h-full min-h-0 bg-primary-900 animate-pulse flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  return (
    <div className="relative w-full h-full min-h-0 overflow-hidden bg-primary-900 select-none">

      {/* Slides */}
      {sliders.map((slide, i) => (
        <Link key={slide.id} to={slide.link || '/'} className="absolute inset-0"
          style={{ opacity: i === current ? 1 : 0, transition: 'opacity 0.7s ease', zIndex: i === current ? 10 : 1 }}>

          {!loaded[i] && <div className="absolute inset-0 bg-primary-800 animate-pulse" />}

          <img
            src={slide.image}
            alt={isKh ? slide.title_kh : slide.title}
            onLoad={() => markLoaded(i)}
            className="w-full h-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

          <div className="absolute bottom-0 left-0 right-0 px-6 md:px-12 pb-8 md:pb-12 z-10">
            <div className="max-w-2xl">
              <span className="inline-block bg-gold-500 text-white text-xs font-bold px-3 py-1 rounded mb-3">
                {t.policeTag}
              </span>
              <h2 className="text-white text-xl md:text-3xl font-bold leading-tight font-battambang drop-shadow-lg">
                {isKh ? slide.title_kh : slide.title}
              </h2>
              {isKh && slide.title && (
                <p className="text-gray-300 text-sm md:text-base mt-1 drop-shadow">{slide.title}</p>
              )}
              {!isKh && slide.title_kh && (
                <p className="text-gray-300 text-sm mt-1 drop-shadow">{slide.title_kh}</p>
              )}
            </div>
          </div>
        </Link>
      ))}

      {/* Prev / Next arrows */}
      {sliders.length > 1 && (
        <>
          <button onClick={(e) => { e.preventDefault(); prev() }}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Previous">
            <FontAwesomeIcon icon={faChevronLeft} className="text-sm" />
          </button>
          <button onClick={(e) => { e.preventDefault(); next() }}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 md:w-11 md:h-11 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm"
            aria-label="Next">
            <FontAwesomeIcon icon={faChevronRight} className="text-sm" />
          </button>
        </>
      )}

      {/* Bottom controls: dots + play/pause */}
      <div className="absolute bottom-3 right-4 z-20 flex items-center gap-2">
        <div className="flex gap-1.5">
          {sliders.map((_, i) => (
            <button key={i} onClick={() => goTo(i)}
              className={`rounded-full transition-all ${i === current ? 'w-6 h-2 bg-gold-400' : 'w-2 h-2 bg-white/50 hover:bg-white/80'}`}
              aria-label={`Slide ${i + 1}`} />
          ))}
        </div>
        <button onClick={() => setPlaying((p) => !p)}
          className="w-7 h-7 bg-black/40 hover:bg-black/70 text-white rounded-full flex items-center justify-center transition-colors backdrop-blur-sm ml-1"
          aria-label={playing ? 'Pause' : 'Play'}>
          <FontAwesomeIcon icon={playing ? faPause : faPlay} className="text-[10px]" />
        </button>
      </div>

      {/* Progress bar */}
      {playing && (
        <div key={`${current}-progress`} className="absolute bottom-0 left-0 h-0.5 bg-gold-400 z-20"
          style={{ animation: `slideProgress ${INTERVAL}ms linear` }} />
      )}

      <style>{`
        @keyframes slideProgress {
          from { width: 0% }
          to   { width: 100% }
        }
      `}</style>
    </div>
  )
}
