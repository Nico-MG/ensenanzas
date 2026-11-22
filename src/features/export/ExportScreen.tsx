import { useState } from 'react'
import type { Teaching } from '@/features/library/types'
import { getTheme } from '@/features/designer/themes'
import { buildExportSlides, exportTeachingAsPptx } from './pptxGenerator'
import { exportTeachingAsWord } from './wordGenerator'

interface ExportScreenProps {
  teachings: Teaching[]
  initialTeachingId: string | null
  onBack: () => void
}

export function ExportScreen({ teachings, initialTeachingId, onBack }: ExportScreenProps) {
  const [selectedId, setSelectedId] = useState(
    initialTeachingId && teachings.some((item) => item.id === initialTeachingId)
      ? initialTeachingId
      : teachings[0]?.id ?? '',
  )
  const [exporting, setExporting] = useState<'pptx' | 'docx' | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const teaching = teachings.find((item) => item.id === selectedId)
  const slides = teaching ? buildExportSlides(teaching) : []
  const theme = teaching ? getTheme(teaching.themeId ?? 'azul') : null

  async function exportPresentation() {
    if (!teaching) return
    setExporting('pptx')
    setError('')
    setSuccess('')
    try {
      await exportTeachingAsPptx(teaching)
      setSuccess('La presentación PowerPoint se descargó correctamente.')
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo generar el archivo PPTX.')
    } finally {
      setExporting(null)
    }
  }

  async function exportDocument() {
    if (!teaching) return
    setExporting('docx')
    setError('')
    setSuccess('')
    try {
      await exportTeachingAsWord(teaching.title, teaching.content)
      setSuccess('El documento Word se descargó correctamente.')
    } catch (exportError) {
      setError(exportError instanceof Error ? exportError.message : 'No se pudo generar el archivo Word.')
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-6 py-8 lg:px-10">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-blue-700">Presentación</p>
          <h1 className="mt-1 text-3xl font-bold text-slate-950">Exportar enseñanza</h1>
          <p className="mt-2 text-sm text-slate-500">Descarga la enseñanza completa en Word y las diapositivas en PowerPoint.</p>
        </div>
        <button type="button" onClick={onBack} className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">
          Volver
        </button>
      </div>

      {teachings.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="font-semibold text-slate-900">No hay enseñanzas para exportar</h2>
          <p className="mt-2 text-sm text-slate-500">Crea una enseñanza desde la biblioteca para continuar.</p>
        </div>
      ) : (
        <>
          <label className="mt-7 block max-w-lg">
            <span className="mb-2 block text-sm font-semibold text-slate-700">Enseñanza</span>
            <select
              value={selectedId}
              onChange={(event) => {
                setSelectedId(event.target.value)
                setError('')
                setSuccess('')
              }}
              className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
            >
              {teachings.map((item) => (
                <option key={item.id} value={item.id}>{item.title}</option>
              ))}
            </select>
          </label>

          {teaching && theme && (
            <div className="mt-7 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="font-semibold text-slate-900">Diapositivas incluidas</h2>
                  <span className="text-sm text-slate-500">{slides.length} diapositiva(s) PPTX</span>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  {slides.map((slide, index) => {
                    const customization = teaching.slideCustomizations?.[slide.sourceId]
                    const renderBlock = (block: (typeof slide.blocks)[number], blockIndex: number) => (
                      <p key={`${block.column ?? 'single'}-${blockIndex}`}>
                        {block.kind === 'image'
                          ? `[Imagen${block.alt ? `: ${block.alt}` : ''}]`
                          : `${block.prefix}${block.html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()}`}
                      </p>
                    )

                    return (
                      <article key={slide.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        <div
                          className="flex aspect-video flex-col justify-center p-6"
                          style={{
                            background: customization?.background ?? theme.background,
                            color: theme.titleColor,
                            fontFamily: theme.fontFamily,
                            textAlign: customization?.alignment ?? (slide.kind === 'title' ? 'center' : 'left'),
                          }}
                        >
                          {slide.showTitle && <h3 className="text-lg font-bold">{slide.title || teaching.title}</h3>}
                          {slide.blocks.length > 0 && (
                            slide.layout === 'single' ? (
                              <div className="mt-3 line-clamp-3 text-xs" style={{ color: theme.textColor }}>
                                {slide.blocks.map(renderBlock)}
                              </div>
                            ) : (
                              <div className="mt-3 grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-hidden text-xs" style={{ color: theme.textColor }}>
                                {(['left', 'right'] as const).map((column) => (
                                  <div key={column} className="min-w-0 space-y-1 overflow-hidden">
                                    {slide.blocks.map((block, blockIndex) =>
                                      block.column === column ? renderBlock(block, blockIndex) : null,
                                    )}
                                  </div>
                                ))}
                              </div>
                            )
                          )}
                        </div>
                        <p className="border-t border-slate-100 px-4 py-2 text-xs text-slate-500">Diapositiva {index + 1}</p>
                      </article>
                    )
                  })}
                </div>
              </section>

              <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h2 className="font-semibold text-slate-900">Archivos editables</h2>
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Texto editable en PowerPoint</li>
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Fondos y formas editables</li>
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Imágenes incorporadas</li>
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Tema y personalización por diapositiva</li>
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Formato panorámico 16:9</li>
                  <li className="flex gap-2"><span className="text-emerald-600">✓</span> Word conserva el texto y su formato</li>
                </ul>

                {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
                {success && <p role="status" className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{success}</p>}

                <button
                  type="button"
                  onClick={exportPresentation}
                  disabled={exporting !== null}
                  className="mt-6 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-wait disabled:opacity-60"
                >
                  {exporting === 'pptx' ? 'Generando PPTX...' : 'Descargar PowerPoint'}
                </button>
                <button
                  type="button"
                  onClick={exportDocument}
                  disabled={exporting !== null}
                  className="mt-3 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-wait disabled:opacity-60"
                >
                  {exporting === 'docx' ? 'Generando Word...' : 'Descargar Word'}
                </button>
                <p className="mt-3 text-center text-xs text-slate-400">El contenido no se envía a un servidor.</p>
              </aside>
            </div>
          )}
        </>
      )}
    </div>
  )
}
