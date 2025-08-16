import { configureLocalization } from '@lit/localize'
import { sourceLocale, targetLocales } from './locale-codes'
import * as itTemplates from './it'
import * as esTemplates from './es'
import * as frTemplates from './fr'
import * as deTemplates from './de'
import * as ptTemplates from './pt'

const localeMap: Record<string, any> = {
  'it': itTemplates,
  'es': esTemplates,  
  'fr': frTemplates,
  'de': deTemplates,
  'pt': ptTemplates,
}

export const { getLocale, setLocale } = configureLocalization({
  sourceLocale,
  targetLocales,
  loadLocale: (locale: string) => {
    const templates = localeMap[locale]
    if (templates) {
      return Promise.resolve(templates)
    }
    return Promise.reject(new Error(`Locale ${locale} not found`))
  },
})