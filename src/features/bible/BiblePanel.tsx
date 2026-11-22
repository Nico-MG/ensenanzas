import { useEffect, useMemo, useState } from 'react'
import type { BibleReference, Teaching } from '@/features/library/types'
import { detectBibleReferences } from './detector'
import { lookupBibleReference } from './provider'

interface BiblePanelProps {
  teaching: Teaching
  open: boolean
  onClose: () => void
  onReferencesChange: (references: BibleReference[]) => void
  onInsert: (reference: BibleReference) => void
}

export function BiblePanel({
  teaching,
  open,
  onClose,
  onReferencesChange,
  onInsert,
}: BiblePanelProps) {
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  useEffect(() => {
    sessionStorage.removeItem('ensenappt.apibibliaKey')
  }, [])
  const detected = useMemo(
    () => detectBibleReferences(teaching.content, teaching.id),
    [teaching.content, teaching.id],
  )

  if (!open) return null

  async function lookup(reference: BibleReference) {
    setLoadingId(`${reference.book}-${reference.chapter}-${reference.verseStart}`)
    setError('')

    try {
      const result = await lookupBibleReference(reference)
      const complete = {
        ...reference,
        text: result.text,
        sourceUrl: result.sourceUrl,
      }
      const retained = teaching.bibleReferences.filter(
        (item) => item.id !== reference.id,
      )
      onReferencesChange([...retained, complete])
    } catch (lookupError) {
      setError(lookupError instanceof Error ? lookupError.message : 'No se pudo consultar la referencia.')
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/20" role="presentation">
      <aside className="h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl" role="dialog" aria-modal="true" aria-label="Integración bíblica">
        <header className="flex h-16 items-center justify-between border-b border-slate-200 px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">RVR1960</p>
            <h2 className="text-lg font-bold text-slate-950">Referencias bíblicas</h2>
          </div>
          <button type="button" onClick={onClose} className="h-9 w-9 rounded-lg text-slate-500 hover:bg-slate-100" aria-label="Cerrar">×</button>
        </header>

        <div className="h-[calc(100%-4rem)] overflow-y-auto p-5">
          <p className="text-sm leading-6 text-slate-600">
            La clave de ApiBiblia se lee desde el archivo local .env y no se envía al navegador.
          </p>

          {error && (
            <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          )}

          <div className="mt-6 space-y-3">
            {detected.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">
                Escribe una referencia como Juan 3:16 o Romanos 8:28-31.
              </div>
            ) : detected.map((reference) => {
              const saved = teaching.bibleReferences.find(
                (item) =>
                  item.book === reference.book &&
                  item.chapter === reference.chapter &&
                  item.verseStart === reference.verseStart &&
                  item.verseEnd === reference.verseEnd,
              )
              const key = `${reference.book}-${reference.chapter}-${reference.verseStart}`
              return (
                <article key={key} className="rounded-xl border border-slate-200 p-4">
                  <p className="font-semibold text-slate-900">
                    {reference.book} {reference.chapter}:{reference.verseStart}
                    {reference.verseEnd ? `-${reference.verseEnd}` : ''}
                  </p>
                  {saved?.text ? (
                    <>
                      <blockquote className="mt-3 border-l-2 border-blue-300 pl-3 text-sm leading-6 text-slate-600">
                        {saved.text}
                      </blockquote>
                      <div className="mt-3 flex gap-2">
                        <button
                          type="button"
                          onClick={() => onInsert(saved)}
                          className="rounded-lg bg-blue-700 px-3 py-2 text-xs font-semibold text-white"
                        >
                          Incorporar
                        </button>
                        <button
                          type="button"
                          onClick={() => lookup(reference)}
                          className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600"
                        >
                          Consultar de nuevo
                        </button>
                      </div>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => lookup(reference)}
                      disabled={loadingId === key}
                      className="mt-3 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 disabled:opacity-50"
                    >
                      {loadingId === key ? 'Consultando...' : 'Consultar RVR1960'}
                    </button>
                  )}
                </article>
              )
            })}
          </div>
        </div>
      </aside>
    </div>
  )
}
