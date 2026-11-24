import { beforeEach, describe, expect, it } from 'vitest'
import { BLOCK_ATTR, extractPage } from './page.ts'

describe('extractPage', () => {
  beforeEach(() => {
    document.title = 'Lab 03'
    document.body.innerHTML = `
      <site-header><header><nav><a href="/">Home</a></nav></header></site-header>
      <main data-explainer-context="A p5.js lab submission">
        <article><header><h1>Lab 03 — Bubbles</h1></header>
        <p>Click to pop   the bubbles.</p>
        <ul><li><p>Nested paragraph in a list item</p></li></ul>
        <table><tr><th>Week</th><th>Topic</th></tr><tr><td>3</td><td>Arrays</td></tr></table>
        <img alt="Screenshot of bubbles" src="x.png">
        <canvas width="800" height="600"></canvas>
        <section data-explainer-ignore><p>Secret notes</p></section>
        <form><label>Name</label><input value="private"></form>
        <p hidden>Hidden text</p>
        <p style="display:none">Also hidden</p>
        </article>
      </main>
      <footer><p>Footer text</p></footer>`
  })

  it('reads main content into tagged blocks', () => {
    const page = extractPage(document)
    expect(page.title).toBe('Lab 03')
    const texts = page.blocks.map((b) => b.text)
    expect(texts).toContain('Lab 03 — Bubbles')
    expect(texts).toContain('Click to pop the bubbles.')
    expect(texts).toContain('Nested paragraph in a list item')
    expect(texts).toContain('Week | Topic')
    expect(texts).toContain('3 | Arrays')
    expect(texts).toContain('Image: Screenshot of bubbles')
    expect(texts.some((t) => t.startsWith('Canvas drawing (800x600'))).toBe(true)
    expect(page.notes).toEqual(['A p5.js lab submission'])
    expect(document.querySelector('h1')?.getAttribute(BLOCK_ATTR)).toBe('b0')
  })

  it('skips navigation, footers, forms, hidden and ignored content', () => {
    const texts = extractPage(document)
      .blocks.map((b) => b.text)
      .join('\n')
    for (const hidden of [
      'Home',
      'Secret notes',
      'Name',
      'private',
      'Hidden text',
      'Also hidden',
      'Footer text',
    ]) {
      expect(texts).not.toContain(hidden)
    }
  })

  it('does not read the same text twice for nested blocks', () => {
    const page = extractPage(document)
    expect(page.blocks.filter((b) => b.text.includes('Nested paragraph'))).toHaveLength(1)
  })

  it('stops at the size budget and says so', () => {
    const page = extractPage(document, { maxChars: 30 })
    expect(page.truncated).toBe(true)
    expect(page.blocks.reduce((n, b) => n + b.text.length, 0)).toBeLessThanOrEqual(30)
  })

  it('re-tags from scratch on every read', () => {
    extractPage(document)
    document.querySelector('h1')?.remove()
    const page = extractPage(document)
    expect(page.blocks[0]?.id).toBe('b0')
    expect(document.querySelectorAll(`[${BLOCK_ATTR}="b0"]`)).toHaveLength(1)
  })

  it('uses a custom root when given', () => {
    const page = extractPage(document, { root: 'table' })
    expect(page.blocks.map((b) => b.kind)).toEqual(['table-row', 'table-row'])
  })
})
