import Image from '@tiptap/extension-image'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { useEffect, useMemo, useState } from 'react'
import type { Teaching } from '@/features/library/types'
import type { SlideCustomization } from '@/features/library/types'
import { getTheme, getThemeBackgroundStyle } from '@/features/designer/themes'
import { BiblePanel } from '@/features/bible/BiblePanel'
import type { BibleReference } from '@/features/library/types'
import { buildExportSlides, type ExportSlide } from '@/features/export/pptxGenerator'

interface EditorScreenProps {
  teaching: Teaching
  onChange: (changes: Partial<Teaching>) => void
  onBack: () => void
}

interface ToolButtonProps {
  label: string
  active?: boolean
  onClick: () => void
}

function ToolButton({ label, active, onClick }: ToolButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-8 min-w-8 rounded-md px-2 text-sm font-semibold transition ${
        active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {label}
    </button>
  )
}

export function EditorScreen({ teaching, onChange, onBack }: EditorScreenProps) {
  const [slideIndex, setSlideIndex] = useState(0)
  const [bibleOpen, setBibleOpen] = useState(false)
  const [imageOpen, setImageOpen] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  const editor = useEditor({
    extensions: [StarterKit, Image],
    content: teaching.content,
    editorProps: {
      attributes: {
        class: 'min-h-[560px] px-7 py-6 outline-none text-slate-800 text-[15px] leading-7',
      },
    },
    onUpdate: ({ editor: updatedEditor }) => {
      onChange({
        content: updatedEditor.getHTML(),
        updatedAt: new Date().toISOString(),
      })
    },
  })

  useEffect(() => {
    if (editor && teaching.content !== editor.getHTML()) {
      editor.commands.setContent(teaching.content, { emitUpdate: false })
    }
  }, [editor, teaching.content])

  const slides = useMemo(
    () => buildExportSlides({
      title: teaching.title,
      content: teaching.content,
      slideCustomizations: teaching.slideCustomizations,
    }),
    [teaching.content, teaching.title, teaching.slideCustomizations],
  )

  if (!editor) {
    return null
  }

  const safeSlideIndex = Math.min(slideIndex, slides.length - 1)
  const activeSlide = slides[safeSlideIndex] ?? slides[0]
  const theme = getTheme(teaching.themeId ?? 'azul')
  const slideCustomizations = teaching.slideCustomizations ?? {}
  const sourceCustomization: SlideCustomization = slideCustomizations[activeSlide.sourceId] ?? {
    background: theme.background,
    fontScale: 1,
    alignment: 'left',
  }
  const individualCustomization = slideCustomizations[activeSlide.id]
  const slideCustomization: SlideCustomization = {
    ...sourceCustomization,
    ...individualCustomization,
    layout: individualCustomization?.layout
      ?? (activeSlide.id === activeSlide.sourceId ? sourceCustomization.layout : 'single'),
  }

  function updateSlideCustomization(changes: Partial<SlideCustomization>) {
    onChange({
      slideCustomizations: {
        ...slideCustomizations,
        [activeSlide.id]: { ...slideCustomization, ...changes },
      },
      updatedAt: new Date().toISOString(),
    })
  }

  function updateSlideLayout(value: string) {
    if (value === 'single' || value === 'text-left-quotes-right' || value === 'quotes-left-text-right') {
      updateSlideCustomization({ layout: value })
    }
  }

  function addImage() {
    setImageOpen(true)
  }

  function insertImage() {
    if (!imageUrl.trim()) return
    editor?.chain().focus().setImage({ src: imageUrl.trim() }).run()
    setImageUrl('')
    setImageOpen(false)
  }

  function incorporateBibleReference(reference: BibleReference) {
    const label = `${reference.book} ${reference.chapter}:${reference.verseStart}${reference.verseEnd ? `-${reference.verseEnd}` : ''}`
    const html = `<blockquote><strong>${label} — RVR1960</strong><br>${reference.text}</blockquote>`
    editor?.chain().focus().insertContent(html).run()
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-100 lg:h-screen">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:px-6">
        <button
          type="button"
          onClick={onBack}
          className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Volver"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m15 18-6-6 6-6" />
          </svg>
        </button>
        <input
          value={teaching.title}
          onChange={(event) => onChange({ title: event.target.value, updatedAt: new Date().toISOString() })}
          className="min-w-0 flex-1 rounded-lg border border-transparent px-2 py-1.5 text-base font-semibold text-slate-900 outline-none hover:border-slate-200 focus:border-blue-300 focus:ring-4 focus:ring-blue-100"
        />
        <span className="hidden text-xs text-slate-400 sm:inline">Guardado localmente</span>
      </header>

      <div className="flex min-h-0 flex-1">
        <section className="flex min-w-0 flex-1 flex-col border-r border-slate-200 bg-white">
          <div className="flex h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-slate-200 px-3">
            <ToolButton label="H1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} />
            <ToolButton label="H2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} />
            <ToolButton label="N" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} />
            <ToolButton label="K" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} />
            <ToolButton label="S" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} />
            <span className="mx-1 h-5 w-px bg-slate-200" />
            <ToolButton label="1." active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} />
            <ToolButton label="•" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} />
            <ToolButton label="“”" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()} />
            <ToolButton label="—" onClick={() => editor.chain().focus().setHorizontalRule().run()} />
            <ToolButton label="IMG" onClick={addImage} />
            <ToolButton label="Biblia" onClick={() => setBibleOpen(true)} />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto max-w-3xl bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        </section>

        <section className="hidden w-[46%] min-w-0 flex-col bg-slate-100 md:flex">
          <div className="flex h-12 shrink-0 items-center justify-between border-b border-slate-200 px-5">
            <p className="text-sm font-semibold text-slate-700">Vista previa</p>
            <p className="text-xs text-slate-400">16:9</p>
          </div>
          <div className="flex items-center gap-2 border-b border-slate-200 bg-white px-4 py-2">
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Fondo
              <input
                type="color"
                value={slideCustomization.background}
                onChange={(event) => updateSlideCustomization({ background: event.target.value })}
                className="h-7 w-8 cursor-pointer rounded border border-slate-200"
              />
            </label>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              Texto
              <input
                type="range"
                min="0.8"
                max="1.3"
                step="0.1"
                value={slideCustomization.fontScale}
                onChange={(event) => updateSlideCustomization({ fontScale: Number(event.target.value) })}
              />
            </label>
            {(['left', 'center', 'right'] as const).map((alignment) => (
              <button
                key={alignment}
                type="button"
                onClick={() => updateSlideCustomization({ alignment })}
                className={`h-7 rounded px-2 text-xs ${
                  slideCustomization.alignment === alignment ? 'bg-blue-100 text-blue-700' : 'text-slate-500 hover:bg-slate-100'
                }`}
              >
                {alignment === 'left' ? 'Izq.' : alignment === 'center' ? 'Centro' : 'Der.'}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-600">
            Formato
            <select
              value={slideCustomization.layout ?? 'single'}
              onChange={(event) => updateSlideLayout(event.target.value)}
              className="h-8 min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 text-xs"
            >
              <option value="single">Una columna</option>
              <option value="text-left-quotes-right">Texto izquierda · citas derecha</option>
              <option value="quotes-left-text-right">Citas izquierda · texto derecha</option>
            </select>
          </label>
          <div className="flex min-h-0 flex-1 items-center justify-center p-8">
            <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <SlidePreview
                slide={activeSlide}
                teachingTitle={teaching.title}
                theme={theme}
                customization={slideCustomization}
              />
            </div>
          </div>
        </section>
      </div>

      <nav className="flex h-16 shrink-0 items-center gap-3 border-t border-slate-200 bg-white px-4" aria-label="Diapositivas">
        <button
          type="button"
          disabled={safeSlideIndex === 0}
          onClick={() => setSlideIndex((current) => Math.max(0, current - 1))}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm disabled:opacity-40"
        >
          Anterior
        </button>
        <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
          {slides.map((slide, index) => (
            <button
              key={slide.id}
              type="button"
              onClick={() => setSlideIndex(index)}
              className={`h-9 shrink-0 rounded-lg px-3 text-xs font-semibold ${
                index === safeSlideIndex ? 'bg-blue-700 text-white' : 'border border-slate-200 bg-white text-slate-600'
              }`}
            >
              {index + 1}
            </button>
          ))}
        </div>
        <button
          type="button"
          disabled={safeSlideIndex >= slides.length - 1}
          onClick={() => setSlideIndex((current) => Math.min(slides.length - 1, current + 1))}
          className="h-9 rounded-lg border border-slate-200 px-3 text-sm disabled:opacity-40"
        >
          Siguiente
        </button>
      </nav>

      <BiblePanel
        teaching={teaching}
        open={bibleOpen}
        onClose={() => setBibleOpen(false)}
        onReferencesChange={(bibleReferences) =>
          onChange({ bibleReferences, updatedAt: new Date().toISOString() })
        }
        onInsert={incorporateBibleReference}
      />

      {imageOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/30 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl" role="dialog" aria-modal="true" aria-label="Insertar imagen">
            <h2 className="text-lg font-bold text-slate-950">Insertar imagen</h2>
            <label className="mt-4 block">
              <span className="mb-2 block text-sm font-semibold text-slate-700">URL</span>
              <input
                autoFocus
                value={imageUrl}
                onChange={(event) => setImageUrl(event.target.value)}
                placeholder="https://..."
                className="h-11 w-full rounded-xl border border-slate-200 px-3 text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button type="button" onClick={() => setImageOpen(false)} className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100">
                Cancelar
              </button>
              <button type="button" onClick={insertImage} disabled={!imageUrl.trim()} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Insertar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function SlidePreview({
  slide,
  teachingTitle,
  theme,
  customization,
}: {
  slide: ExportSlide
  teachingTitle: string
  theme: ReturnType<typeof getTheme>
  customization: SlideCustomization
}) {
  function renderBlock(block: ExportSlide['blocks'][number], index: number) {
    if (block.kind === 'image') {
      return <img key={index} src={block.source} alt={block.alt} className="mx-auto max-h-[30%] max-w-full object-contain" />
    }

    return (
      <div
        key={index}
        className={`preview-block ${block.quoted ? 'border-l-2 pl-[2%] italic' : ''}`}
        style={{
          fontSize: `${(block.fontSize ?? 21 * (block.quoted ? 0.94 : 1) * customization.fontScale) * 0.10417}cqw`,
          ...(block.quoted ? { borderColor: theme.accentColor } : {}),
        }}
      >
        {block.prefix && <span>{block.prefix}</span>}
        <div dangerouslySetInnerHTML={{ __html: block.html }} />
      </div>
    )
  }

  return (
    <div
      className="flex h-full flex-col overflow-hidden p-[7%]"
      style={{
        ...getThemeBackgroundStyle(theme, customization.background),
        color: theme.textColor,
        fontFamily: theme.fontFamily,
        textAlign: customization.alignment,
        containerType: 'inline-size',
      }}
    >
      {slide.showTitle && (
        <h2
          className={`font-bold leading-tight ${slide.kind === 'title' ? 'mt-[12%]' : ''}`}
          style={{
            color: theme.titleColor,
            fontSize: `${(slide.kind === 'title' ? 34 : 28) * 0.10417 * customization.fontScale}cqw`,
          }}
        >
          {slide.title || teachingTitle}
        </h2>
      )}
      {slide.blocks.length > 0 && (
        slide.layout === 'single' ? (
          <div className="mt-[5%] space-y-[2%] leading-relaxed">
            {slide.blocks.map(renderBlock)}
          </div>
        ) : (
          <div className="mt-[5%] grid min-h-0 flex-1 grid-cols-2 gap-[4%] leading-relaxed">
            {(['left', 'right'] as const).map((column) => (
              <div key={column} className="min-w-0 space-y-[2%] overflow-hidden">
                {slide.blocks.map((block, index) =>
                  block.column === column ? renderBlock(block, index) : null,
                )}
              </div>
            ))}
          </div>
        )
      )}
    </div>
  )
}
