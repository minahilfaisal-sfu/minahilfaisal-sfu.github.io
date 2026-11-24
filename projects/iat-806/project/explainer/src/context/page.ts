import type { PageBlock, PageSnapshot } from '../types.ts'

/** Attribute the library puts on each block it reads, so answers can point at it. */
export const BLOCK_ATTR = 'data-explainer-id'
/** Site owners add this to anything that must never be sent to the AI. */
export const IGNORE_ATTR = 'data-explainer-ignore'
/** Site owners add this to give the assistant a hint about a section. */
export const CONTEXT_ATTR = 'data-explainer-context'

const BLOCK_SELECTOR = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'p',
  'li',
  'dt',
  'dd',
  'blockquote',
  'figcaption',
  'pre',
  'tr',
  'img[alt]',
  'canvas',
  'svg[aria-label]',
  'svg[role="img"]',
  'a.card',
  'label',
].join(',')

/** Never read these, or anything inside them. */
const SKIP_SELECTOR = [
  'script',
  'style',
  'noscript',
  'template',
  'nav',
  'footer',
  'site-header',
  'body > header',
  '[role="banner"]',
  '[role="navigation"]',
  'form',
  'input',
  'textarea',
  'select',
  'button',
  '[aria-hidden="true"]',
  '[hidden]',
  `[${IGNORE_ATTR}]`,
  '[data-explainer-widget]',
].join(',')

const MAX_BLOCK_CHARS = 500

const clean = (text: string) => text.replace(/\s+/g, ' ').trim()

const isHidden = (el: Element): boolean => {
  const view = el.ownerDocument.defaultView
  if (!view) return false
  const style = view.getComputedStyle(el)
  return style.display === 'none' || style.visibility === 'hidden'
}

const kindOf = (el: Element): string => {
  const tag = el.tagName.toLowerCase()
  if (/^h[1-6]$/.test(tag)) return `heading${tag[1]}`
  if (tag === 'li') return 'list-item'
  if (tag === 'tr') return 'table-row'
  if (tag === 'img') return 'image'
  if (tag === 'canvas') return 'canvas'
  if (tag === 'svg') return 'graphic'
  if (tag === 'pre') return 'code'
  if (tag === 'a') return 'link-card'
  return tag === 'p' ? 'paragraph' : tag
}

const textOf = (el: Element): string => {
  const tag = el.tagName.toLowerCase()
  if (tag === 'img') return `Image: ${el.getAttribute('alt') ?? ''}`
  if (tag === 'svg')
    return `Graphic: ${el.getAttribute('aria-label') ?? clean(el.textContent ?? '')}`
  if (tag === 'canvas') {
    const label = el.getAttribute('aria-label')
    const { width, height } = el as HTMLCanvasElement
    return `Canvas drawing (${width}x${height}, e.g. an interactive sketch; its pixels are not readable)${label ? `: ${label}` : ''}`
  }
  if (tag === 'tr') {
    return Array.from(el.children)
      .map((cell) => clean(cell.textContent ?? ''))
      .filter(Boolean)
      .join(' | ')
  }
  if (tag === 'a') {
    return `${clean(el.textContent ?? '')} (link to ${el.getAttribute('href') ?? ''})`
  }
  return clean(el.textContent ?? '')
}

const limitText = (text: string): string =>
  text.length > MAX_BLOCK_CHARS ? `${text.slice(0, MAX_BLOCK_CHARS)}…` : text

/** True when an element (e.g. <p> inside <li>) sits inside a block that was already read. */
const insideTaken = (el: Element, root: Element, taken: Set<Element>): boolean => {
  for (let parent = el.parentElement; parent && parent !== root; parent = parent.parentElement) {
    if (taken.has(parent)) return true
  }
  return false
}

const isReadable = (el: Element, root: Element, taken: Set<Element>): boolean =>
  !el.closest(SKIP_SELECTOR) && !insideTaken(el, root, taken) && !isHidden(el)

const resolveRoot = (doc: Document, root?: string | Element): Element => {
  if (root instanceof Element) return root
  if (typeof root === 'string') {
    const found = doc.querySelector(root)
    if (found) return found
  }
  return doc.querySelector('main') ?? doc.body
}

/** Remove the tags from the last read, so ids always match the current page. */
export const clearBlockIds = (doc: Document) => {
  for (const el of Array.from(doc.querySelectorAll(`[${BLOCK_ATTR}]`))) {
    el.removeAttribute(BLOCK_ATTR)
  }
}

/**
 * Reads the main content of the page into small tagged blocks.
 * Skips navigation, forms, hidden content and anything marked data-explainer-ignore.
 */
export const extractPage = (
  doc: Document,
  options: { root?: string | Element; maxChars?: number } = {},
): PageSnapshot => {
  const maxChars = options.maxChars ?? 8000
  const root = resolveRoot(doc, options.root)
  clearBlockIds(doc)

  const blocks: PageBlock[] = []
  const taken = new Set<Element>()
  let used = 0
  let truncated = false

  for (const el of Array.from(root.querySelectorAll(BLOCK_SELECTOR))) {
    if (!isReadable(el, root, taken)) continue
    const text = limitText(textOf(el))
    if (!text) continue
    if (used + text.length > maxChars) {
      truncated = true
      break
    }
    const id = `b${blocks.length}`
    el.setAttribute(BLOCK_ATTR, id)
    taken.add(el)
    blocks.push({ id, kind: kindOf(el), text })
    used += text.length
  }

  const notes = Array.from(doc.querySelectorAll(`[${CONTEXT_ATTR}]`))
    .filter((el) => !el.closest(`[${IGNORE_ATTR}]`))
    .map((el) => clean(el.getAttribute(CONTEXT_ATTR) ?? ''))
    .filter(Boolean)

  const location = doc.defaultView?.location
  return {
    url: location?.href ?? '',
    path: location?.pathname ?? '',
    title: clean(doc.title) || clean(doc.querySelector('h1')?.textContent ?? '') || 'Untitled page',
    blocks,
    notes,
    truncated,
  }
}
