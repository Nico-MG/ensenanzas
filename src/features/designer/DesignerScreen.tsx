import type { Teaching } from '@/features/library/types'
import { themes } from './themes'

interface DesignerScreenProps {
  teachings: Teaching[]
  activeTeaching: Teaching | null
  onSelectTeaching: (teaching: Teaching) => void
  onThemeChange: (themeId: string) => void
  onBack: () => void
}

export function DesignerScreen({
  teachings,
  activeTeaching,
  onSelectTeaching,
  onThemeChange,
  onBack,
}: DesignerScreenProps) {
  const currentThemeId = activeTeaching?.themeId ?? 'azul'

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 lg:px-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Diseñador</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Temas visuales</h1>
          <p className="mt-2 text-sm text-slate-500">Selecciona un tema global para la enseñanza activa.</p>
        </div>
        <button type="button" onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Volver
        </button>
      </div>

      {teachings.length > 0 && (
        <label className="mt-6 block max-w-md">
          <span className="mb-2 block text-sm font-semibold text-slate-700">Enseñanza</span>
          <select
            value={activeTeaching?.id ?? ''}
            onChange={(event) => {
              const teaching = teachings.find((item) => item.id === event.target.value)
              if (teaching) onSelectTeaching(teaching)
            }}
            className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          >
            {teachings.map((teaching) => (
              <option key={teaching.id} value={teaching.id}>{teaching.title}</option>
            ))}
          </select>
        </label>
      )}

      {teachings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">
          Crea una enseñanza antes de configurar un tema.
        </div>
      ) : (
        <div className="mt-8 grid gap-5 md:grid-cols-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              type="button"
              onClick={() => onThemeChange(theme.id)}
              className={`rounded-2xl border bg-white p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                currentThemeId === theme.id ? 'border-blue-500 ring-4 ring-blue-100' : 'border-slate-200'
              }`}
            >
              <div
                className="aspect-video rounded-xl p-5"
                style={{ background: theme.background, color: theme.titleColor, fontFamily: theme.fontFamily }}
              >
                <div className="h-1.5 w-10 rounded" style={{ background: theme.accentColor }} />
                <p className="mt-5 text-lg font-bold">La fe que transforma</p>
                <p className="mt-2 text-xs" style={{ color: theme.textColor }}>Contenido de ejemplo</p>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-slate-900">{theme.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{theme.description}</p>
                </div>
                {currentThemeId === theme.id && (
                  <span className="rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-700">Activo</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {activeTeaching && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-800">Personalizaciones actuales</p>
          <p className="mt-1 text-sm text-slate-500">
            {Object.keys(activeTeaching.slideCustomizations ?? {}).length === 0
              ? 'Esta enseñanza aún no tiene ajustes individuales.'
              : `${Object.keys(activeTeaching.slideCustomizations ?? {}).length} diapositiva(s) personalizadas.`}
          </p>
        </div>
      )}
    </div>
  )
}
