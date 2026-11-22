export type SlideAlignment = 'left' | 'center' | 'right'
export type SlideLayout = 'single' | 'text-left-quotes-right' | 'quotes-left-text-right'

export interface SlideCustomization {
  background: string
  fontScale: number
  alignment: SlideAlignment
  layout?: SlideLayout
}

export interface Teaching {
  id: string
  title: string
  content: string
  themeId: string
  slideCustomizations: Record<string, SlideCustomization>
  bibleReferences: BibleReference[]
  createdAt: string
  updatedAt: string
}

export interface BibleReference {
  id: string
  teachingId: string
  book: string
  chapter: number
  verseStart: number
  verseEnd: number | null
  translation: 'RVR1960'
  text: string
  sourceUrl: string
}
