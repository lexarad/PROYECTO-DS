'use client'

import { useState } from 'react'
import { useTranslations } from '@/lib/i18n/context'
import { LOCALES, type Locale } from '@/lib/i18n/translations'

const FLAGS: Record<Locale, string> = {
  es: '🇪🇸',
  ca: '🏴󠁥󠁳󠁣󠁴󠁿',
  en: '🇬🇧',
  fr: '🇫🇷',
  de: '🇩🇪',
  it: '🇮🇹',
  pt: '🇵🇹',
  zh: '🇨🇳',
  ja: '🇯🇵',
  ar: '🇸🇦',
  fi: '🇫🇮',
  ru: '🇷🇺',
}

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslations()
  const [open, setOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Cambiar idioma"
      >
        <span>{FLAGS[locale]}</span>
        <span className="hidden sm:inline font-medium">{LOCALES[locale]}</span>
        <svg className="w-3 h-3 ml-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-[160px]">
            {(Object.entries(LOCALES) as [Locale, string][]).map(([code, name]) => (
              <button
                key={code}
                onClick={() => { setLocale(code); setOpen(false) }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  code === locale ? 'text-brand-600 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span>{FLAGS[code]}</span>
                <span>{name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
