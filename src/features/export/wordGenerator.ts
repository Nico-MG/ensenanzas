import type { Paragraph as DocxParagraph, TextRun as DocxTextRun } from 'docx'
import { filenameFor } from './filename'

type DocxApi = Pick<typeof import('docx'), 'HeadingLevel' | 'Paragraph' | 'TextRun'>

interface InlineStyle {
  bold?: boolean
  italic?: boolean
  underline?: boolean
}

function collectInlineRuns(node: Node, api: DocxApi, style: InlineStyle = {}): DocxTextRun[] {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue ?? ''
    return text ? [new api.TextRun({
      text,
      bold: style.bold,
      italics: style.italic,
      ...(style.underline ? { underline: { type: 'single' as const } } : {}),
    })] : []
  }

  if (!(node instanceof HTMLElement)) return []

  if (node.tagName === 'BR') {
    return [new api.TextRun({ text: '', break: 1 })]
  }

  if (node.tagName === 'IMG') {
    const label = node.getAttribute('alt') || 'Imagen'
    return [new api.TextRun({ text: `[${label}]` })]
  }

  const nextStyle: InlineStyle = {
    bold: style.bold || ['B', 'STRONG'].includes(node.tagName),
    italic: style.italic || ['I', 'EM'].includes(node.tagName),
    underline: style.underline || node.tagName === 'U',
  }

  return Array.from(node.childNodes).flatMap((child) => collectInlineRuns(child, api, nextStyle))
}

function hasText(node: Node): boolean {
  return Boolean(
    node.textContent?.trim() ||
    (node instanceof HTMLElement && node.querySelector('img')),
  )
}

function appendContent(node: HTMLElement, paragraphs: DocxParagraph[], api: DocxApi) {
  if (node.tagName === 'HR') {
    paragraphs.push(new api.Paragraph({ thematicBreak: true }))
    return
  }

  if (node.tagName === 'UL' || node.tagName === 'OL') {
    const items = Array.from(node.querySelectorAll(':scope > li'))
    items.forEach((item, index) => {
      paragraphs.push(new api.Paragraph({
        children: [
          new api.TextRun({ text: node.tagName === 'OL' ? `${index + 1}. ` : '• ' }),
          ...collectInlineRuns(item, api),
        ],
        indent: { left: 360 },
      }))
    })
    return
  }

  if (node.tagName === 'BLOCKQUOTE') {
    const children = Array.from(node.children)
    if (children.length === 0) {
      paragraphs.push(new api.Paragraph({
        children: collectInlineRuns(node, api, { italic: true }),
        indent: { left: 360 },
      }))
      return
    }

    children.forEach((child) => {
      paragraphs.push(new api.Paragraph({
        children: collectInlineRuns(child, api, { italic: true }),
        indent: { left: 360 },
      }))
    })
    return
  }

  if (node.tagName === 'H1' || node.tagName === 'H2') {
    paragraphs.push(new api.Paragraph({
      heading: node.tagName === 'H1' ? api.HeadingLevel.HEADING_1 : api.HeadingLevel.HEADING_2,
      children: collectInlineRuns(node, api),
    }))
    return
  }

  if (node.tagName === 'IMG') {
    const alt = node.getAttribute('alt')
    paragraphs.push(new api.Paragraph({
      children: [new api.TextRun({ text: alt ? `[Imagen: ${alt}]` : '[Imagen]' })],
    }))
    return
  }

  if (hasText(node)) {
    paragraphs.push(new api.Paragraph({ children: collectInlineRuns(node, api) }))
  }
}

export async function exportTeachingAsWord(title: string, html: string): Promise<void> {
  const api = await import('docx')
  const { Document, Packer } = api
  const container = document.createElement('div')
  container.innerHTML = html
  const paragraphs: DocxParagraph[] = []

  for (const child of Array.from(container.children)) {
    if (child instanceof HTMLElement) appendContent(child, paragraphs, api)
  }

  const documentFile = new Document({
    sections: [{
      children: [
        new api.Paragraph({ heading: api.HeadingLevel.TITLE, text: title }),
        ...paragraphs,
      ],
    }],
  })
  const blob = await Packer.toBlob(documentFile)
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filenameFor(title, 'docx')
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
