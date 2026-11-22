import { useEffect, useState } from 'react'
import { LibraryScreen } from '@/features/library/LibraryScreen'
import { loadTeachings, saveTeachings } from '@/features/library/storage'
import type { Teaching } from '@/features/library/types'
import { EditorScreen } from '@/features/editor/EditorScreen'
import { DesignerScreen } from '@/features/designer/DesignerScreen'
import { ExportScreen } from '@/features/export/ExportScreen'

type Screen = 'library' | 'editor' | 'designer' | 'export'

function getScreen(): Screen {
  if (window.location.hash.startsWith('#/editor')) return 'editor'
  if (window.location.hash === '#/designer') return 'designer'
  if (window.location.hash === '#/export') return 'export'
  return 'library'
}

function getActiveTeachingId(): string | null {
  const match = window.location.hash.match(/^#\/editor\/([^/]+)$/)
  return match ? decodeURIComponent(match[1]) : null
}

function createId(): string {
  return crypto.randomUUID()
}

function App() {
  const [teachings, setTeachings] = useState<Teaching[]>(loadTeachings)
  const [screen, setScreen] = useState<Screen>(getScreen)
  const [activeTeachingId, setActiveTeachingId] = useState<string | null>(getActiveTeachingId)

  useEffect(() => {
    function syncRoute() {
      setScreen(getScreen())
      setActiveTeachingId(getActiveTeachingId())
    }

    window.addEventListener('hashchange', syncRoute)
    return () => window.removeEventListener('hashchange', syncRoute)
  }, [])

  useEffect(() => {
    saveTeachings(teachings)
  }, [teachings])

  function navigate(nextScreen: Screen, teachingId?: string) {
    if (nextScreen === 'editor' && teachingId) {
      window.location.hash = `/editor/${encodeURIComponent(teachingId)}`
      return
    }

    window.location.hash = nextScreen === 'library' ? '/' : `/${nextScreen}`
  }

  function createTeaching(title: string) {
    const now = new Date().toISOString()
    const teaching: Teaching = {
      id: createId(),
      title,
      content: '',
      themeId: 'azul',
      slideCustomizations: {},
      bibleReferences: [],
      createdAt: now,
      updatedAt: now,
    }

    setTeachings((current) => [teaching, ...current])
    navigate('editor', teaching.id)
  }

  function duplicateTeaching(teaching: Teaching) {
    const now = new Date().toISOString()
    const duplicate: Teaching = {
      ...teaching,
      id: createId(),
      title: `${teaching.title} (copia)`,
      createdAt: now,
      updatedAt: now,
    }

    setTeachings((current) => [duplicate, ...current])
  }

  function deleteTeaching(teaching: Teaching) {
    const confirmed = window.confirm(`¿Eliminar "${teaching.title}"? Esta acción no se puede deshacer.`)
    if (!confirmed) return

    setTeachings((current) => current.filter((item) => item.id !== teaching.id))
  }

  function updateTeaching(teachingId: string, changes: Partial<Teaching>) {
    setTeachings((current) =>
      current.map((teaching) =>
        teaching.id === teachingId ? { ...teaching, ...changes } : teaching,
      ),
    )
  }

  function changeActiveTeachingTheme(themeId: string) {
    if (!activeTeaching) return
    updateTeaching(activeTeaching.id, { themeId, updatedAt: new Date().toISOString() })
  }

  const activeTeaching =
    teachings.find((teaching) => teaching.id === activeTeachingId) ??
    (screen === 'designer' ? teachings[0] ?? null : null)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-60 flex-col border-r border-slate-200 bg-white lg:flex">
        <button
          type="button"
          onClick={() => navigate('library')}
          className="flex h-20 items-center gap-3 border-b border-slate-100 px-6 text-left"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white">EP</div>
          <div>
            <p className="font-bold tracking-tight text-slate-950">EnseñaPPT</p>
            <p className="text-xs text-slate-400">Presentaciones bíblicas</p>
          </div>
        </button>

        <nav className="flex-1 space-y-1 p-4" aria-label="Navegación principal">
          <NavButton active={screen === 'library'} onClick={() => navigate('library')} label="Inicio" />
          <NavButton active={screen === 'editor'} onClick={() => navigate('library')} label="Editor" />
          <NavButton active={screen === 'designer'} onClick={() => navigate('designer')} label="Diseñador" />
          <NavButton active={screen === 'export'} onClick={() => navigate('export')} label="Exportación" />
        </nav>

        <div className="border-t border-slate-100 p-4 text-xs text-slate-400">
          Aplicación local
        </div>
      </aside>

      <header className="sticky top-0 z-30 flex h-16 items-center border-b border-slate-200 bg-white px-4 lg:hidden">
        <button type="button" onClick={() => navigate('library')} className="font-bold text-slate-950">
          EnseñaPPT
        </button>
        <nav className="ml-auto flex gap-1" aria-label="Navegación móvil">
          <button type="button" onClick={() => navigate('library')} className="rounded-lg px-3 py-2 text-sm">Inicio</button>
          <button type="button" onClick={() => navigate('library')} className="rounded-lg px-3 py-2 text-sm">Editor</button>
          <button type="button" onClick={() => navigate('export')} className="rounded-lg px-3 py-2 text-sm">Export</button>
        </nav>
      </header>

      <main className="lg:pl-60">
        {screen === 'library' && (
          <LibraryScreen
            teachings={teachings}
            onCreate={createTeaching}
            onOpen={(teaching) => navigate('editor', teaching.id)}
            onDuplicate={duplicateTeaching}
            onDelete={deleteTeaching}
          />
        )}

        {screen === 'editor' && (
          activeTeaching ? (
            <EditorScreen
              teaching={activeTeaching}
              onChange={(changes) => updateTeaching(activeTeaching.id, changes)}
              onBack={() => navigate('library')}
            />
          ) : (
            <PlaceholderScreen
              title="Documento no encontrado"
              description="La enseñanza que intentas abrir ya no existe o no pudo encontrarse."
              actionLabel="Volver a la biblioteca"
              onAction={() => navigate('library')}
            />
          )
        )}

        {screen === 'designer' && (
          <DesignerScreen
            teachings={teachings}
            activeTeaching={activeTeaching}
            onSelectTeaching={(teaching) => setActiveTeachingId(teaching.id)}
            onThemeChange={changeActiveTeachingTheme}
            onBack={() => navigate('library')}
          />
        )}

        {screen === 'export' && (
          <ExportScreen
            teachings={teachings}
            initialTeachingId={activeTeachingId}
            onBack={() => navigate('library')}
          />
        )}
      </main>
    </div>
  )
}

interface NavButtonProps {
  active: boolean
  label: string
  onClick: () => void
}

function NavButton({ active, label, onClick }: NavButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
        active
          ? 'bg-blue-50 text-blue-700'
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'
      }`}
    >
      {label}
    </button>
  )
}

interface PlaceholderScreenProps {
  title: string
  description: string
  actionLabel: string
  onAction: () => void
}

function PlaceholderScreen({ title, description, actionLabel, onAction }: PlaceholderScreenProps) {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-6 py-12">
      <div className="w-full rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <h1 className="text-2xl font-bold text-slate-950">{title}</h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500">{description}</p>
        <button
          type="button"
          onClick={onAction}
          className="mt-6 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-800"
        >
          {actionLabel}
        </button>
      </div>
    </div>
  )
}

export default App
