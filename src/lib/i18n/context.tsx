'use client'

import { createContext, useContext, useState, useEffect } from 'react'
import { getTranslations, type Locale, type Translations, DEFAULT_LOCALE } from './translations'

interface I18nContextValue {
  locale: Locale
  t: Translations
  setLocale: (locale: Locale) => void
}

const I18nContext = createContext<I18nContextValue>({
  locale: DEFAULT_LOCALE,
  t: getTranslations(DEFAULT_LOCALE),
  setLocale: () => {},
})

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE)

  useEffect(() => {
    const stored = localStorage.getItem('locale') as Locale | null
    if (stored) setLocaleState(stored)
  }, [])

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('locale', l)
  }

  return (
    <I18nContext.Provider value={{ locale, t: getTranslations(locale), setLocale }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useTranslations() {
  return useContext(I18nContext)
}
