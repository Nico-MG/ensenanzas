import type { BibleReference } from '@/features/library/types'

export interface BibleLookupResult {
  text: string
  sourceUrl: string
}

function extractText(payload: unknown): string {
  if (!payload || typeof payload !== 'object') return ''
  const value = payload as Record<string, unknown>
  if (typeof value.text === 'string') return value.text.trim()
  const data = value.data
  if (data && typeof data === 'object') {
    const dataValue = data as Record<string, unknown>
    if (typeof dataValue.text === 'string') return dataValue.text.trim()
    if (Array.isArray(dataValue.verses)) {
      return dataValue.verses
        .map((verse) => {
          if (!verse || typeof verse !== 'object') return ''
          const verseValue = verse as Record<string, unknown>
          if (typeof verseValue.text !== 'string') return ''
          return typeof verseValue.verse === 'number'
            ? `${verseValue.verse}. ${verseValue.text.trim()}`
            : verseValue.text.trim()
        })
        .filter(Boolean)
        .join(' ')
    }
  }
  if (typeof value.text === 'string') return value.text.trim()
  return ''
}

export async function lookupBibleReference(
  reference: BibleReference,
): Promise<BibleLookupResult> {
  const passage = `${reference.book} ${reference.chapter}:${reference.verseStart}${reference.verseEnd ? `-${reference.verseEnd}` : ''}`
  const sourceUrl = `/api/bible/passage?ref=${encodeURIComponent(passage)}&version=RVR1960`
  const response = await fetch(sourceUrl)
  if (!response.ok) {
    if (response.status === 503) {
      throw new Error('Configura APIBIBLIA_API_KEY en el archivo .env y reinicia el servidor.')
    }
    if (response.status === 401) {
      throw new Error('ApiBiblia rechazó la clave. Verifica APIBIBLIA_API_KEY en el archivo .env.')
    }
    throw new Error(`ApiBiblia respondió con estado ${response.status}.`)
  }

  const payload: unknown = await response.json()
  const text = extractText(payload)
  if (!text) {
    throw new Error('La fuente no devolvió texto compatible.')
  }

  return { text, sourceUrl }
}
