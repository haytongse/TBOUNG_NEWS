import { createContext, useContext, useEffect, useState } from 'react'
import api from '../api/client'

interface SiteSettings {
  site_name:        string
  site_name_en:     string
  site_description: string
  logo_url:         string
  contact_email:    string
  contact_phone:    string
  hotline:          string
  facebook_url:     string
  telegram_url:     string
  address_kh:       string
  address_en:       string
  [key: string]: string
}

const defaults: SiteSettings = {
  site_name:        'នគរបាលជាតិ',
  site_name_en:     'Cambodia National Police',
  site_description: 'ព័ត៌មានផ្លូវការរបស់នគរបាលជាតិ',
  logo_url:         '',
  contact_email:    'info@police.gov.kh',
  contact_phone:    '117',
  hotline:          '117',
  facebook_url:     '',
  telegram_url:     '',
  address_kh:       'ភ្នំពេញ',
  address_en:       'Phnom Penh, Cambodia',
}

const SettingsContext = createContext<SiteSettings>(defaults)

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaults)

  useEffect(() => {
    api.get<Record<string, string>>('/public/settings')
      .then((r) => setSettings((prev) => ({ ...prev, ...r.data })))
      .catch(() => {})
  }, [])

  // Update favicon + page title when logo/name changes
  useEffect(() => {
    if (settings.logo_url && settings.logo_url !== '/uploads/settings/logo.png') {
      const link = document.querySelector<HTMLLinkElement>("link[rel='icon']")
      if (link) link.href = settings.logo_url
    }
    if (settings.site_name_en) {
      document.title = `${settings.site_name} - ${settings.site_name_en}`
    }
  }, [settings.logo_url, settings.site_name, settings.site_name_en])

  return <SettingsContext.Provider value={settings}>{children}</SettingsContext.Provider>
}

export const useSettings = () => useContext(SettingsContext)
