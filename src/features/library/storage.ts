import type { Teaching } from './types'

const STORAGE_KEY = 'ensenappt.teachings'

export function loadTeachings(): Teaching[] {
  const stored = localStorage.getItem(STORAGE_KEY)

  if (!stored) {
    return []
  }

  try {
    const teachings = JSON.parse(stored) as unknown
    if (!Array.isArray(teachings)) return []
    return (teachings as Teaching[]).map((teaching) => ({
      ...teaching,
      themeId: teaching.themeId ?? 'azul',
      slideCustomizations: teaching.slideCustomizations ?? {},
      bibleReferences: teaching.bibleReferences ?? [],
    }))
  } catch {
    return []
  }
}

export function saveTeachings(teachings: Teaching[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(teachings))
}
