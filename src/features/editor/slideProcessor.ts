export interface PreviewSlide {
  id: string
  title: string
  blocks: string[]
  kind: 'title' | 'content'
}

function cleanText(value: string): string {
  const element = document.createElement('div')
  element.innerHTML = value
  return (element.textContent ?? '').trim()
}

export function processTeachingContent(html: string): PreviewSlide[] {
  if (!html || html === '<p></p>') {
    return [{ id: 'cover', title: 'Nueva enseñanza', blocks: [], kind: 'title' }]
  }

  const container = document.createElement('div')
  container.innerHTML = html
  const slides: PreviewSlide[] = []
  let current: PreviewSlide | null = null

  function startSlide(kind: PreviewSlide['kind'], title = '') {
    current = {
      id: `slide-${slides.length + 1}`,
      title,
      blocks: [],
      kind,
    }
    slides.push(current)
  }

  container.childNodes.forEach((node) => {
    if (!(node instanceof HTMLElement)) return

    if (node.tagName === 'HR') {
      startSlide('content')
      return
    }

    if (node.tagName === 'H1' || node.tagName === 'H2') {
      if (!current || current.blocks.length > 0 || current.title) {
        startSlide(node.tagName === 'H1' ? 'title' : 'content', cleanText(node.innerHTML))
      } else {
        current.title = cleanText(node.innerHTML)
      }
      return
    }

    if (!current) {
      startSlide('content')
    }

    const text = cleanText(node.innerHTML)
    if (text) {
      current?.blocks.push(node.outerHTML)
    }

    if (node.tagName === 'IMG') {
      current?.blocks.push(node.outerHTML)
    }
  })

  if (slides.length === 0) {
    startSlide('content')
  }

  return slides
}
