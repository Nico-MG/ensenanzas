import type PptxGenJS from 'pptxgenjs'
import type { SlideCustomization, SlideLayout, Teaching } from '@/features/library/types'
import { getTheme } from '@/features/designer/themes'
import { processTeachingContent } from '@/features/editor/slideProcessor'
import { filenameFor } from './filename'

const SLIDE_WIDTH = 13.333
const SIDE_MARGIN = 0.85
const COLUMN_GAP = 0.36
const COLUMN_WIDTH = (SLIDE_WIDTH - SIDE_MARGIN * 2 - COLUMN_GAP) / 2
const BODY_TOP = 1.9
const BODY_BOTTOM = 6.85
type SlideColumn = 'left' | 'right'

interface TextStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

interface StyledToken {
  text: string
  style: TextStyle
}

export interface ExportTextBlock {
  kind: 'text'
  html: string
  prefix: string
  quoted: boolean
  fontSize?: number
  column?: SlideColumn
}

export interface ExportImageBlock {
  kind: 'image'
  source: string
  alt: string
  column?: SlideColumn
}

export interface ExportSlide {
  id: string
  sourceId: string
  title: string
  showTitle: boolean
  layout: SlideLayout
  kind: 'title' | 'content'
  blocks: Array<ExportTextBlock | ExportImageBlock>
}

function colorValue(value: string, fallback: string): string {
  return /^#[\da-f]{6}$/i.test(value) ? value.slice(1).toUpperCase() : fallback.slice(1).toUpperCase()
}

function runOptions(style: TextStyle): PptxGenJS.TextPropsOptions {
  return {
    ...(style.bold ? { bold: true } : {}),
    ...(style.italic ? { italic: true } : {}),
    ...(style.underline ? { underline: { style: 'sng' as const } } : {}),
  }
}

function collectRuns(node: Node, style: TextStyle = {}): PptxGenJS.TextProps[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.textContent ?? ''
    return text ? [{ text, options: runOptions(style) }] : []
  }

  if (!(node instanceof HTMLElement)) return []

  const nextStyle: TextStyle = {
    bold: style.bold || ['B', 'STRONG'].includes(node.tagName) || undefined,
    italic: style.italic || ['I', 'EM'].includes(node.tagName) || undefined,
    underline: style.underline || node.tagName === 'U' || undefined,
  }

  if (node.tagName === 'BR') {
    return [{ text: '\n', options: runOptions(nextStyle) }]
  }

  return Array.from(node.childNodes).flatMap((child) => collectRuns(child, nextStyle))
}

function textContent(runs: PptxGenJS.TextProps[]): string {
  return runs.map((run) => run.text ?? '').join('').replace(/\s+/g, ' ').trim()
}

function estimateHeight(text: string, fontSize: number, widthScale = 1): number {
  const approximateCharactersPerLine = Math.max(
    widthScale < 1 ? 18 : 35,
    Math.floor(98 * (22 / fontSize) * widthScale),
  )
  const lines = Math.max(1, Math.ceil(text.length / approximateCharactersPerLine))
  return Math.max(0.42, lines * (fontSize / 72) * 1.45 + 0.12)
}

function tokenizeRuns(runs: PptxGenJS.TextProps[]): StyledToken[] {
  const tokens: StyledToken[] = []

  for (const run of runs) {
    const text = (run.text ?? '').replace(/\s+/g, ' ')
    const style: TextStyle = {
      bold: run.options?.bold === true,
      italic: run.options?.italic === true,
      underline: Boolean(run.options?.underline),
    }

    for (const part of text.match(/\S+| /g) ?? []) {
      if (part === ' ' && (tokens.length === 0 || tokens[tokens.length - 1].text === ' ')) {
        continue
      }
      tokens.push({ text: part, style })
    }
  }

  return tokens
}

function tokensToHtml(tokens: StyledToken[]): string {
  return tokens.map(({ text, style }) => {
    let html = text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
    if (style.underline) html = `<u>${html}</u>`
    if (style.italic) html = `<em>${html}</em>`
    if (style.bold) html = `<strong>${html}</strong>`
    return html
  }).join('')
}

function runsToHtml(runs: PptxGenJS.TextProps[]): string {
  return runs.map((run) => {
    let html = (run.text ?? '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br>')
    if (run.options?.underline) html = `<u>${html}</u>`
    if (run.options?.italic) html = `<em>${html}</em>`
    if (run.options?.bold) html = `<strong>${html}</strong>`
    return html
  }).join('')
}

function sliceRuns(
  runs: PptxGenJS.TextProps[],
  start: number,
  end: number,
): PptxGenJS.TextProps[] {
  let offset = 0
  const result: PptxGenJS.TextProps[] = []

  for (const run of runs) {
    const text = run.text ?? ''
    const runStart = offset
    const runEnd = runStart + text.length
    const sliceStart = Math.max(start, runStart)
    const sliceEnd = Math.min(end, runEnd)
    if (sliceEnd > sliceStart) {
      result.push({ ...run, text: text.slice(sliceStart - runStart, sliceEnd - runStart) })
    }
    offset = runEnd
  }

  return result
}

function splitBibleVerses(runs: PptxGenJS.TextProps[]): PptxGenJS.TextProps[][] | null {
  const text = runs.map((run) => run.text ?? '').join('')
  const versionIndex = text.indexOf('RVR1960')
  if (versionIndex < 0) return null

  const reference = text.slice(0, versionIndex).match(/:\s*(\d+)(?:\s*-\s*\d+)?\s*[—-]\s*$/)
  if (!reference) return null

  const markers = Array.from(text.matchAll(/\b(\d{1,3})\.\s+/g))
    .filter((match) => {
      const index = match.index ?? 0
      return index > versionIndex && !/\S/.test(text[index - 1] ?? '')
    })
  if (markers.length === 0 || Number(markers[0][1]) !== Number(reference[1])) return [runs]

  for (let index = 1; index < markers.length; index += 1) {
    if (Number(markers[index][1]) !== Number(markers[index - 1][1]) + 1) return [runs]
  }

  return markers.map((marker, index) => {
    const start = index === 0 ? 0 : marker.index ?? 0
    const end = markers[index + 1]?.index ?? text.length
    return sliceRuns(runs, start, end)
  })
}

function fontSizeToFit(
  text: string,
  requestedSize: number,
  maxHeight: number,
  widthScale = 1,
): number {
  let minimum = 8
  let maximum = requestedSize
  if (estimateHeight(text, minimum, widthScale) > maxHeight) return minimum

  for (let attempt = 0; attempt < 12; attempt += 1) {
    const candidate = (minimum + maximum) / 2
    if (estimateHeight(text, candidate, widthScale) <= maxHeight) minimum = candidate
    else maximum = candidate
  }
  return minimum
}

function imageToDataUrl(source: string): Promise<string> {
  if (source.startsWith('data:image/png;') || source.startsWith('data:image/jpeg;') || source.startsWith('data:image/gif;')) {
    return Promise.resolve(source)
  }

  let url: URL
  try {
    url = new URL(source, document.baseURI)
  } catch {
    return Promise.reject(new Error('La presentación contiene una imagen con una URL no válida.'))
  }

  if (url.protocol !== 'https:') {
    return Promise.reject(new Error('Las imágenes de la presentación deben usar una URL HTTPS o ser PNG/JPEG/GIF incrustadas.'))
  }

  return fetch(url)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`No se pudo cargar una imagen de la presentación (${response.status}).`)
      }
      const contentType = response.headers.get('content-type')?.split(';')[0].trim().toLowerCase()
      if (!contentType || !['image/png', 'image/jpeg', 'image/gif'].includes(contentType)) {
        throw new Error('Solo se pueden exportar imágenes PNG, JPEG o GIF.')
      }
      return response.blob()
    })
    .then((blob) => new Promise<string>((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        if (typeof reader.result === 'string') resolve(reader.result)
        else reject(new Error('No se pudo preparar una imagen para PowerPoint.'))
      }
      reader.onerror = () => reject(new Error('No se pudo leer una imagen para PowerPoint.'))
      reader.readAsDataURL(blob)
    }))
}

export function buildExportSlides(
  teaching: Pick<Teaching, 'title' | 'content' | 'slideCustomizations'>,
): ExportSlide[] {
  const customizations = teaching.slideCustomizations ?? {}
  const result: ExportSlide[] = []

  for (const sourceSlide of processTeachingContent(teaching.content)) {
    const customization = customizations[sourceSlide.id]
    const fontScale = Number.isFinite(customization?.fontScale)
      ? Math.min(1.3, Math.max(0.8, customization.fontScale))
      : 1
    const fontSize = Math.min(30, Math.max(14, 21 * fontScale))
    const initialY = sourceSlide.kind === 'title' ? 4.0 : BODY_TOP
    let y = initialY
    let leftY = initialY
    let rightY = initialY
    let continuation = 0

    function columnFor(quoted: boolean, slideLayout = current.layout): SlideColumn | undefined {
      if (slideLayout === 'single') return undefined
      if (slideLayout === 'text-left-quotes-right') return quoted ? 'right' : 'left'
      return quoted ? 'left' : 'right'
    }

    function newSlide(isContinuation: boolean): ExportSlide {
      const id = isContinuation ? `${sourceSlide.id}-continuation-${continuation}` : sourceSlide.id
      return {
        id,
        sourceId: sourceSlide.id,
        title: isContinuation ? '' : sourceSlide.title || teaching.title,
        showTitle: !isContinuation,
        layout: customizations[id]?.layout
          ?? (id === sourceSlide.id ? customization?.layout : undefined)
          ?? 'single',
        kind: isContinuation ? 'content' : sourceSlide.kind,
        blocks: [],
      }
    }

    function yFor(column: SlideColumn | undefined): number {
      if (!column) return y
      return column === 'left' ? leftY : rightY
    }

    function advance(column: SlideColumn | undefined, amount: number) {
      if (!column) {
        y += amount
      } else if (column === 'left') {
        leftY += amount
      } else {
        rightY += amount
      }
    }

    let current = newSlide(false)
    result.push(current)

    function startContinuation() {
      continuation += 1
      current = newSlide(true)
      result.push(current)
      y = BODY_TOP
      leftY = BODY_TOP
      rightY = BODY_TOP
    }

    const contentRoot = document.createElement('div')
    contentRoot.innerHTML = sourceSlide.blocks.join('')

    for (const block of Array.from(contentRoot.children)) {
      const images = [
        ...(block.tagName === 'IMG' ? [block as HTMLImageElement] : []),
        ...Array.from(block.querySelectorAll('img')),
      ]
      const textClone = block.cloneNode(true) as HTMLElement
      textClone.querySelectorAll('img').forEach((image) => image.remove())
      const plain = textContent(collectRuns(textClone))

      if (plain) {
        const isList = block.tagName === 'UL' || block.tagName === 'OL'
        const items = isList ? Array.from(block.querySelectorAll(':scope > li')) : [block]
        for (const [index, item] of items.entries()) {
          const itemNode = isList ? item : textClone
          const quoted = block.tagName === 'BLOCKQUOTE'
          const allRuns = collectRuns(itemNode)
          const runs = quoted
            ? allRuns
            : allRuns.filter((run) => run.options?.bold === true)
          const itemText = textContent(runs)
          if (!itemText) continue
          const blockFontSize = quoted ? fontSize * 0.94 : fontSize
          const prefix = isList
            ? block.tagName === 'OL' ? `${index + 1}. ` : '• '
            : ''
          const verseParts = quoted ? splitBibleVerses(runs) : null

          if (verseParts) {
            for (const verseRuns of verseParts) {
              const verseText = textContent(verseRuns)
              let column = columnFor(true)
              let widthScale = column ? 0.48 : 1
              let verseFontSize = blockFontSize
              let verseHeight = estimateHeight(verseText, verseFontSize, widthScale)

              if (verseHeight > BODY_BOTTOM - BODY_TOP) {
                if (yFor(column) > BODY_TOP) {
                  startContinuation()
                  column = columnFor(true)
                  widthScale = column ? 0.48 : 1
                }
                verseFontSize = fontSizeToFit(
                  verseText,
                  blockFontSize,
                  BODY_BOTTOM - BODY_TOP,
                  widthScale,
                )
                verseHeight = Math.min(
                  estimateHeight(verseText, verseFontSize, widthScale),
                  BODY_BOTTOM - BODY_TOP,
                )
              } else if (yFor(column) + verseHeight > BODY_BOTTOM) {
                if (yFor(column) > BODY_TOP) {
                  startContinuation()
                  column = columnFor(true)
                  widthScale = column ? 0.48 : 1
                }
              }
              verseHeight = Math.min(
                estimateHeight(verseText, verseFontSize, widthScale),
                BODY_BOTTOM - BODY_TOP,
              )

              current.blocks.push({
                kind: 'text',
                html: runsToHtml(verseRuns),
                prefix: '',
                quoted: true,
                column,
                ...(verseFontSize < blockFontSize ? { fontSize: verseFontSize } : {}),
              })
              advance(column, verseHeight + 0.18)
            }
            continue
          }

          let column = columnFor(quoted)
          let widthScale = column ? 0.48 : 1
          let height = estimateHeight(`${prefix}${itemText}`, blockFontSize, widthScale)

          if (height <= BODY_BOTTOM - BODY_TOP) {
            if (yFor(column) + height > BODY_BOTTOM && yFor(column) > BODY_TOP) {
              startContinuation()
              column = columnFor(quoted)
              widthScale = column ? 0.48 : 1
              height = estimateHeight(`${prefix}${itemText}`, blockFontSize, widthScale)
            }
            if (height <= BODY_BOTTOM - BODY_TOP) {
              current.blocks.push({
                kind: 'text',
                html: runsToHtml(runs),
                prefix,
                quoted,
                column,
              })
              advance(column, height + 0.18)
              continue
            }
          }

          const tokens = tokenizeRuns(runs)
          let tokenIndex = 0
          let firstFragment = true

          while (tokenIndex < tokens.length) {
            column = columnFor(quoted)
            widthScale = column ? 0.48 : 1
            const availableHeight = BODY_BOTTOM - yFor(column)
            let fragmentEnd = tokenIndex
            let fragmentText = ''

            while (fragmentEnd < tokens.length) {
              const nextText = `${fragmentText}${tokens[fragmentEnd].text}`.trim()
              const fragmentPrefix = firstFragment ? prefix : ''
              const fragmentHeight = estimateHeight(`${fragmentPrefix}${nextText}`, blockFontSize, widthScale)

              if (fragmentHeight > availableHeight && nextText) {
                if (fragmentEnd === tokenIndex && yFor(column) > BODY_TOP) {
                  startContinuation()
                  break
                }
                if (fragmentEnd > tokenIndex) break
              }

              fragmentText += tokens[fragmentEnd].text
              fragmentEnd += 1
            }

            if (fragmentEnd === tokenIndex) {
              continue
            }

            const fragment = tokens.slice(tokenIndex, fragmentEnd)
            const fragmentPlain = fragment.map((token) => token.text).join('').trim()
            if (fragmentPlain) {
              const fragmentPrefix = firstFragment ? prefix : ''
              const fragmentHeight = estimateHeight(`${fragmentPrefix}${fragmentPlain}`, blockFontSize, widthScale)
              current.blocks.push({
                kind: 'text',
                html: tokensToHtml(fragment),
                prefix: fragmentPrefix,
                quoted,
                column,
              })
              advance(column, fragmentHeight + 0.18)
              firstFragment = false
            }

            tokenIndex = fragmentEnd
            if (tokenIndex < tokens.length) {
              startContinuation()
            }
          }

        }
      }

      for (const _image of images) {
        const imageHeight = 2.25
        const column = columnFor(false)
        if (yFor(column) + imageHeight > BODY_BOTTOM && yFor(column) > BODY_TOP) {
          startContinuation()
        }
        current.blocks.push({
          kind: 'image',
          source: _image.getAttribute('src') ?? '',
          alt: _image.getAttribute('alt') ?? '',
          column,
        })
        advance(column, imageHeight + 0.2)
      }
    }
  }

  return result
}

export async function exportTeachingAsPptx(teaching: Teaching): Promise<void> {
  const { default: PptxGenJSRuntime } = await import('pptxgenjs')
  const pptx = new PptxGenJSRuntime()
  pptx.layout = 'LAYOUT_WIDE'
  pptx.author = 'EnseñaPPT'
  pptx.subject = 'Enseñanza bíblica'
  pptx.title = teaching.title
  const theme = getTheme(teaching.themeId ?? 'azul')
  pptx.theme = {
    headFontFace: theme.fontFamily.split(',')[0],
    bodyFontFace: theme.fontFamily.split(',')[0],
  }

  const exportSlides = buildExportSlides(teaching)
  const customizations = teaching.slideCustomizations ?? {}

  function addDesignedSlide(
    sourceId: string,
    slideId: string,
    title: string,
    kind: 'title' | 'content',
    showTitle: boolean,
    layout: SlideLayout,
  ) {
    const customization: SlideCustomization = customizations[slideId] ?? customizations[sourceId] ?? {
      background: theme.background,
      fontScale: 1,
      alignment: 'left',
    }
    const fontScale = Number.isFinite(customization.fontScale)
      ? Math.min(1.3, Math.max(0.8, customization.fontScale))
      : 1
    const slide = pptx.addSlide()
    const background = colorValue(customization.background, theme.background)
    const textAlignment = customization.alignment
    const accent = colorValue(theme.accentColor, '#1D4ED8')
    const titleColor = colorValue(theme.titleColor, '#0F172A')
    const textColor = colorValue(theme.textColor, '#475569')
    const fontFace = theme.fontFamily.split(',')[0]

    slide.background = { color: background }
    if (showTitle) {
      slide.addText(title || teaching.title, {
        x: 0.95,
        y: kind === 'title' ? 2.45 : 0.55,
        w: SLIDE_WIDTH - 1.8,
        h: kind === 'title' ? 1.25 : 0.95,
        fontFace,
        fontSize: (kind === 'title' ? 34 : 28) * fontScale,
        bold: true,
        color: titleColor,
        align: textAlignment,
        valign: 'middle',
        margin: 0,
        breakLine: false,
        fit: 'shrink',
      })
    }

    return {
      slide,
      y: kind === 'title' ? 4.0 : BODY_TOP,
      leftY: kind === 'title' ? 4.0 : BODY_TOP,
      rightY: kind === 'title' ? 4.0 : BODY_TOP,
      layout,
      fontFace,
      fontSize: Math.min(30, Math.max(14, 21 * fontScale)),
      textColor,
      alignment: textAlignment,
      accent,
      sourceId,
    }
  }

  for (const exportSlide of exportSlides) {
    const active = addDesignedSlide(
      exportSlide.sourceId,
      exportSlide.id,
      exportSlide.title,
      exportSlide.kind,
      exportSlide.showTitle,
      exportSlide.layout,
    )

    for (const block of exportSlide.blocks) {
      if (block.kind === 'image') {
        if (!block.source) continue
        const data = await imageToDataUrl(block.source)
        const blockY = block.column === 'left'
          ? active.leftY
          : block.column === 'right'
            ? active.rightY
            : active.y
        const x = block.column === 'left'
          ? SIDE_MARGIN
          : block.column === 'right'
            ? SIDE_MARGIN + COLUMN_WIDTH + COLUMN_GAP
            : 2.4
        const width = block.column ? COLUMN_WIDTH : SLIDE_WIDTH - 4.8
        active.slide.addImage({
          data,
          x,
          y: blockY,
          w: width,
          h: 2.25,
          sizing: { type: 'contain', w: width, h: 2.25 },
          altText: block.alt,
        })
        if (block.column === 'left') active.leftY += 2.45
        else if (block.column === 'right') active.rightY += 2.45
        else active.y += 2.45
        continue
      }

      const element = document.createElement('div')
      element.innerHTML = block.html
      const runs = collectRuns(element)
      const plain = textContent(runs)
      if (!plain) continue
      const textRuns: PptxGenJS.TextProps[] = block.prefix
        ? [{ text: block.prefix, options: { bold: /^\d/.test(block.prefix) } }, ...runs]
        : runs
      const fontSize = block.fontSize ?? (block.quoted ? active.fontSize * 0.94 : active.fontSize)
      const blockY = block.column === 'left'
        ? active.leftY
        : block.column === 'right'
          ? active.rightY
          : active.y
      const widthScale = block.column ? 0.48 : 1
      const blockX = block.column === 'left'
        ? SIDE_MARGIN
        : block.column === 'right'
          ? SIDE_MARGIN + COLUMN_WIDTH + COLUMN_GAP
          : SIDE_MARGIN
      const blockWidth = block.column ? COLUMN_WIDTH : SLIDE_WIDTH - SIDE_MARGIN * 2
      const quoteInset = block.quoted ? 0.22 : 0
      const height = Math.min(
        estimateHeight(`${block.prefix}${plain}`, fontSize, widthScale),
        Math.max(0.35, BODY_BOTTOM - blockY),
      )

      if (block.quoted) {
        active.slide.addShape(pptx.ShapeType.rect, {
          x: blockX,
          y: blockY + 0.03,
          w: 0.055,
          h: Math.max(0.35, height - 0.06),
          line: { color: active.accent, transparency: 100 },
          fill: { color: active.accent },
        })
      }

      const formattedRuns = block.quoted
        ? textRuns.map((run) => ({
            ...run,
            options: { ...run.options, italic: true },
          }))
        : textRuns
      active.slide.addText(formattedRuns, {
        x: blockX + quoteInset,
        y: blockY,
        w: blockWidth - quoteInset,
        h: height,
        fontFace: active.fontFace,
        fontSize,
        color: active.textColor,
        align: active.alignment,
        valign: 'top',
        margin: 0,
        fit: 'shrink',
        paraSpaceAfter: 0,
      })
      if (block.column === 'left') active.leftY += height + 0.18
      else if (block.column === 'right') active.rightY += height + 0.18
      else active.y += height + 0.18
    }
  }

  await pptx.writeFile({ fileName: filenameFor(teaching.title, 'pptx'), compression: true })
}
