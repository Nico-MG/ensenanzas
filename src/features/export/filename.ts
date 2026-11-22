export function filenameFor(title: string, extension: 'docx' | 'pptx'): string {
  const safeName = title
    .normalize('NFC')
    .replace(/[<>:"/\\|?*]/g, '-')
    .replace(/\p{Cc}/gu, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 100)
  return `${safeName || 'Ensenanza'}.${extension}`
}
