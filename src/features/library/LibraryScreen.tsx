import { useState } from 'react'
import { TeachingCard } from './TeachingCard'
import type { Teaching } from './types'

interface LibraryScreenProps {
  teachings: Teaching[]
  onCreate: (title: string) => void
  onOpen: (teaching: Teaching) => void
  onDuplicate: (teaching: Teaching) => void
  onDelete: (teaching: Teaching) => void
}

export function LibraryScreen({
  teachings,
  onCreate,
  onOpen,
  onDuplicate,
  onDelete,
}: LibraryScreenProps) {
  const [search, setSearch] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [title, setTitle] = useState('')

  const filteredTeachings = teachings.filter((teaching) =>
    teaching.title.toLocaleLowerCase('es').includes(search.toLocaleLowerCase('es')),
  )

  function submitCreate() {
    const cleanTitle = title.trim()
    if (!cleanTitle) {
      return
    }

    onCreate(cleanTitle)
    setTitle('')
    setCreateOpen(false)
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-6 py-8 lg:px-10 lg:py-10">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Biblioteca</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">Mis enseñanzas</h1>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-blue-700 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M12 5v14M5 12h14" />
          </svg>
          Nueva enseñanza
        </button>
      </div>

      <div className="mt-8">
        <label className="relative block max-w-md">
          <span className="sr-only">Buscar enseñanza</span>
          <svg viewBox="0 0 24 24" className="absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <circle cx="11" cy="11" r="6.5" />
            <path d="m16 16 4 4" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por título"
            className="h-11 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      {filteredTeachings.length > 0 ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filteredTeachings.map((teaching) => (
            <TeachingCard
              key={teaching.id}
              teaching={teaching}
              onOpen={onOpen}
              onDuplicate={onDuplicate}
              onDelete={onDelete}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-500">
            <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
              <path d="M7 3.75h7l3 3V20.25H7zM14 3.75v3h3M9.5 11h5M9.5 14h5" />
            </svg>
          </div>
          <h2 className="mt-4 text-lg font-semibold text-slate-900">
            {search ? 'No se encontraron enseñanzas' : 'Todavía no tienes enseñanzas'}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {search ? 'Prueba con otro término de búsqueda.' : 'Crea tu primera enseñanza para comenzar.'}
          </p>
          {!search && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="mt-5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
            >
              Crear enseñanza
            </button>
          )}
        </div>
      )}

      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4" role="presentation">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-labelledby="create-title">
            <h2 id="create-title" className="text-xl font-bold text-slate-950">Nueva enseñanza</h2>
            <p className="mt-1 text-sm text-slate-500">Elige un título para comenzar.</p>
            <form
              className="mt-5"
              onSubmit={(event) => {
                event.preventDefault()
                submitCreate()
              }}
            >
              <label className="block">
                <span className="mb-2 block text-sm font-semibold text-slate-700">Título</span>
                <input
                  autoFocus
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Ej. La fe que transforma"
                  className="h-11 w-full rounded-xl border border-slate-200 px-3.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                />
              </label>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setCreateOpen(false)
                    setTitle('')
                  }}
                  className="h-10 rounded-xl px-4 text-sm font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!title.trim()}
                  className="h-10 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Crear
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
