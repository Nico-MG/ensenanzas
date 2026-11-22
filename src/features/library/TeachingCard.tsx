import type { Teaching } from './types'

interface TeachingCardProps {
  teaching: Teaching
  onOpen: (teaching: Teaching) => void
  onDuplicate: (teaching: Teaching) => void
  onDelete: (teaching: Teaching) => void
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function TeachingCard({
  teaching,
  onOpen,
  onDuplicate,
  onDelete,
}: TeachingCardProps) {
  return (
    <article className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md">
      <button
        type="button"
        className="w-full text-left"
        onClick={() => onOpen(teaching)}
      >
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
            <path d="M7 3.75h7l3 3V20.25H7z" />
            <path d="M14 3.75v3h3M9.5 11h5M9.5 14h5M9.5 17h3" />
          </svg>
        </div>
        <h2 className="truncate text-base font-semibold text-slate-900">{teaching.title}</h2>
        <p className="mt-2 text-sm text-slate-500">
          Modificado el {formatDate(teaching.updatedAt)}
        </p>
      </button>

      <div className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4">
        <button
          type="button"
          onClick={() => onOpen(teaching)}
          className="rounded-lg px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
        >
          Abrir
        </button>
        <div className="ml-auto flex gap-1">
          <button
            type="button"
            onClick={() => onDuplicate(teaching)}
            className="rounded-lg px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-100"
          >
            Duplicar
          </button>
          <button
            type="button"
            onClick={() => onDelete(teaching)}
            className="rounded-lg px-3 py-2 text-sm text-slate-500 transition hover:bg-red-50 hover:text-red-700"
          >
            Eliminar
          </button>
        </div>
      </div>
    </article>
  )
}
