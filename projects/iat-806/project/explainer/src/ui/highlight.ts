import { BLOCK_ATTR } from '../context/page.ts'

const MARK_ATTR = 'data-explainer-highlight'
const STYLE_ID = 'explainer-highlight-style'

/**
 * Highlights live on the site's own elements, so they need one small global
 * style. It only targets the library's own attribute.
 */
const ensureStyle = (doc: Document, accent: string) => {
  let style = doc.getElementById(STYLE_ID) as HTMLStyleElement | null
  if (!style) {
    style = doc.createElement('style')
    style.id = STYLE_ID
    doc.head.appendChild(style)
  }
  style.textContent = `
[${MARK_ATTR}] {
  outline: 3px solid ${accent} !important;
  outline-offset: 4px !important;
  border-radius: 4px;
  transition: outline-color 0.3s, box-shadow 0.3s;
}
[${MARK_ATTR}="sage"] {
  outline-color: #9be7a8 !important;
  box-shadow: 0 0 0 6px rgba(120, 220, 140, 0.25), 0 0 24px 6px rgba(120, 220, 140, 0.45) !important;
}
@media (prefers-reduced-motion: no-preference) {
  [${MARK_ATTR}="sage"] { animation: pa-pulse 2.4s ease-in-out infinite; }
}
@keyframes pa-pulse {
  50% { box-shadow: 0 0 0 10px rgba(120, 220, 140, 0.12), 0 0 32px 10px rgba(120, 220, 140, 0.3); }
}`
}

export const clearHighlights = (doc: Document) => {
  for (const el of Array.from(doc.querySelectorAll(`[${MARK_ATTR}]`))) {
    el.removeAttribute(MARK_ATTR)
  }
}

export const findBlock = (doc: Document, id: string): Element | null =>
  doc.querySelector(`[${BLOCK_ATTR}="${CSS.escape(id)}"]`)

/** Marks the given blocks and scrolls the first one into view. Returns how many were found. */
export const showHighlights = (
  doc: Document,
  ids: string[],
  opts: { accent: string; sage: boolean; scroll?: boolean },
): number => {
  ensureStyle(doc, opts.accent)
  clearHighlights(doc)
  const found = ids.map((id) => findBlock(doc, id)).filter((el): el is Element => el !== null)
  for (const el of found) el.setAttribute(MARK_ATTR, opts.sage ? 'sage' : 'plain')
  if (opts.scroll !== false && found[0] && typeof found[0].scrollIntoView === 'function') {
    const reduce = doc.defaultView?.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    found[0].scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }
  return found.length
}
