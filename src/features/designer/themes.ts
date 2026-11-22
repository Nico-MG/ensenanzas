export interface PresentationTheme {
  id: string
  name: string
  description: string
  background: string
  surface: string
  titleColor: string
  textColor: string
  accentColor: string
  fontFamily: string
}

export const themes: PresentationTheme[] = [
  {
    id: 'azul',
    name: 'Azul sereno',
    description: 'Profesional, claro y minimalista.',
    background: '#F8FAFC',
    surface: '#FFFFFF',
    titleColor: '#0F172A',
    textColor: '#475569',
    accentColor: '#1D4ED8',
    fontFamily: 'Arial, sans-serif',
  },
  {
    id: 'bosque',
    name: 'Bosque',
    description: 'Tonos naturales y cálidos.',
    background: '#F0FDF4',
    surface: '#ECFDF5',
    titleColor: '#14532D',
    textColor: '#365314',
    accentColor: '#15803D',
    fontFamily: 'Georgia, serif',
  },
  {
    id: 'medianoche',
    name: 'Medianoche',
    description: 'Contraste elegante para espacios oscuros.',
    background: '#0F172A',
    surface: '#1E293B',
    titleColor: '#F8FAFC',
    textColor: '#CBD5E1',
    accentColor: '#60A5FA',
    fontFamily: 'Trebuchet MS, sans-serif',
  },
]

export function getTheme(themeId: string): PresentationTheme {
  return themes.find((theme) => theme.id === themeId) ?? themes[0]
}
