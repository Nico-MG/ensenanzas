import type { BibleReference } from '@/features/library/types'

const BOOKS = [
  'Génesis', 'Éxodo', 'Levítico', 'Números', 'Deuteronomio', 'Josué', 'Jueces',
  'Rut', 'Samuel', 'Reyes', 'Crónicas', 'Esdras', 'Nehemías', 'Ester', 'Job',
  'Salmos', 'Proverbios', 'Eclesiastés', 'Cantares', 'Isaías', 'Jeremías',
  'Lamentaciones', 'Ezequiel', 'Daniel', 'Oseas', 'Joel', 'Amós', 'Abdías',
  'Jonás', 'Miqueas', 'Nahum', 'Habacuc', 'Sofonías', 'Hageo', 'Zacarías',
  'Malaquías', 'Mateo', 'Marcos', 'Lucas', 'Juan', 'Hechos', 'Romanos',
  'Corintios', 'Gálatas', 'Efesios', 'Filipenses', 'Colosenses',
  'Tesalonicenses', 'Timoteo', 'Tito', 'Filemón', 'Hebreos', 'Santiago',
  'Pedro', 'Juan', 'Judas', 'Apocalipsis',
]

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function detectBibleReferences(html: string, teachingId: string): BibleReference[] {
  const element = document.createElement('div')
  element.innerHTML = html
    .replace(/<br\b[^>]*>/gi, ' ')
    .replace(/<\/(?:p|h[1-6]|blockquote|ul|ol|li|div|section|article|pre)>/gi, ' ')
  const text = element.textContent ?? ''
  const bookPattern = BOOKS.map(escapeRegex).join('|')
  const pattern = new RegExp(`\\b(${bookPattern})\\s+(\\d{1,3})(?:[:.,]\\s*(\\d{1,3})(?:\\s*-\\s*(\\d{1,3}))?)?`, 'gi')
  const matches = new Map<string, BibleReference>()

  for (const match of text.matchAll(pattern)) {
    const book = match[1]
    const chapter = Number(match[2])
    const verseStart = match[3] ? Number(match[3]) : 1
    const verseEnd = match[4] ? Number(match[4]) : null
    const key = `${book.toLocaleLowerCase('es')}-${chapter}-${verseStart}-${verseEnd ?? ''}`

    matches.set(key, {
      id: crypto.randomUUID(),
      teachingId,
      book,
      chapter,
      verseStart,
      verseEnd,
      translation: 'RVR1960',
      text: '',
      sourceUrl: '',
    })
  }

  return Array.from(matches.values())
}
