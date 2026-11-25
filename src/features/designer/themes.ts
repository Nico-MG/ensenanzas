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
  decoration: 'plain' | 'side-stripe' | 'corner-orbs' | 'corner-bars' | 'frame'
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
    decoration: 'plain',
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
    decoration: 'side-stripe',
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
    decoration: 'corner-orbs',
  },
  {
    id: 'pergamino',
    name: 'Pergamino',
    description: 'Crema, tinta oscura y detalles clásicos.',
    background: '#F5EBDD',
    surface: '#FFFAF1',
    titleColor: '#513A2A',
    textColor: '#6F5A48',
    accentColor: '#B7793E',
    fontFamily: 'Georgia, serif',
    decoration: 'frame',
  },
  {
    id: 'oceano',
    name: 'Océano',
    description: 'Azules profundos con acentos turquesa.',
    background: '#E8F4F7',
    surface: '#F7FCFD',
    titleColor: '#103C4A',
    textColor: '#356171',
    accentColor: '#0D7A8A',
    fontFamily: 'Trebuchet MS, sans-serif',
    decoration: 'corner-orbs',
  },
  {
    id: 'atardecer',
    name: 'Atardecer',
    description: 'Tonos cálidos para una presentación cercana.',
    background: '#FFF1E7',
    surface: '#FFF8F3',
    titleColor: '#7C2D12',
    textColor: '#9A4A2A',
    accentColor: '#E76F51',
    fontFamily: 'Arial, sans-serif',
    decoration: 'corner-bars',
  },
  {
    id: 'vino',
    name: 'Vino',
    description: 'Granate y marfil con carácter sobrio.',
    background: '#FFF7F5',
    surface: '#FFF0EE',
    titleColor: '#5A1D34',
    textColor: '#6F3C4F',
    accentColor: '#A62F50',
    fontFamily: 'Georgia, serif',
    decoration: 'side-stripe',
  },
  {
    id: 'lavanda',
    name: 'Lavanda',
    description: 'Lila suave y violeta para un estilo sereno.',
    background: '#F3EFFC',
    surface: '#FBF9FF',
    titleColor: '#39265E',
    textColor: '#5C4A7D',
    accentColor: '#7C5CC4',
    fontFamily: 'Arial, sans-serif',
    decoration: 'frame',
  },
  {
    id: 'grafito',
    name: 'Grafito',
    description: 'Fondo oscuro con detalles cálidos de alto contraste.',
    background: '#1F2933',
    surface: '#2E3A46',
    titleColor: '#FFF4DC',
    textColor: '#D6DCE2',
    accentColor: '#F3B44A',
    fontFamily: 'Trebuchet MS, sans-serif',
    decoration: 'corner-bars',
  },
]

export function getTheme(themeId: string): PresentationTheme {
  return themes.find((theme) => theme.id === themeId) ?? themes[0]
}

export function getThemeBackgroundStyle(
  theme: PresentationTheme,
  background = theme.background,
) {
  const accent = theme.accentColor
  let backgroundImage = 'none'

  if (theme.decoration === 'side-stripe') {
    backgroundImage = `linear-gradient(90deg, ${accent} 0 1.2%, transparent 1.2%)`
  } else if (theme.decoration === 'corner-orbs') {
    backgroundImage = `radial-gradient(circle at 100% 0%, ${accent}38 0%, transparent 30%), radial-gradient(circle at 0% 100%, ${accent}24 0%, transparent 28%)`
  } else if (theme.decoration === 'corner-bars') {
    backgroundImage = [
      `linear-gradient(90deg, transparent 62%, ${accent}30 62%) bottom / 100% 2.4% no-repeat`,
      `linear-gradient(90deg, transparent 72%, ${accent}24 72%) bottom 2.4% / 100% 2.4% no-repeat`,
      `linear-gradient(90deg, transparent 82%, ${accent}18 82%) bottom 4.8% / 100% 2.4% no-repeat`,
    ].join(', ')
  } else if (theme.decoration === 'frame') {
    backgroundImage = [
      `linear-gradient(${accent}88, ${accent}88) left 4% top 4% / 92% 2px no-repeat`,
      `linear-gradient(${accent}88, ${accent}88) left 4% bottom 4% / 92% 2px no-repeat`,
      `linear-gradient(${accent}88, ${accent}88) left 4% top 4% / 2px 92% no-repeat`,
      `linear-gradient(${accent}88, ${accent}88) right 4% top 4% / 2px 92% no-repeat`,
    ].join(', ')
  }

  return { backgroundColor: background, backgroundImage }
}
