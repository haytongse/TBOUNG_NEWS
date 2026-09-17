import { createContext, useContext, useState } from 'react'

export type Lang = 'kh' | 'en'

interface LanguageContextType {
  lang: Lang
  isKh: boolean
  toggleLang: () => void
  setLang: (l: Lang) => void
}

const LanguageContext = createContext<LanguageContextType>({
  lang: 'kh', isKh: true,
  toggleLang: () => {},
  setLang: () => {},
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() =>
    (localStorage.getItem('site_lang') as Lang) || 'kh'
  )

  const setLang = (l: Lang) => { localStorage.setItem('site_lang', l); setLangState(l) }
  const toggleLang = () => setLang(lang === 'kh' ? 'en' : 'kh')

  return (
    <LanguageContext.Provider value={{ lang, isKh: lang === 'kh', toggleLang, setLang }}>
      {children}
    </LanguageContext.Provider>
  )
}

export const useLanguage = () => useContext(LanguageContext)
