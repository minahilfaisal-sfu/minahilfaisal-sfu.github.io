import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Explainer } from './assistant.ts'

const reply = (body: unknown) =>
  new Response(JSON.stringify({ content: JSON.stringify(body) }), { status: 200 })

const config = {
  site: { name: 'Test Site', pages: { '/projects/': 'Projects' } },
  endpoint: 'https://proxy.example',
}

const shadow = (_assistant: Explainer) =>
  (document.querySelector('[data-explainer-widget]') as HTMLElement).shadowRoot as ShadowRoot

describe('Explainer', () => {
  let assistant: Explainer | undefined

  beforeEach(() => {
    sessionStorage.clear()
    document.title = 'Home'
    document.body.innerHTML = '<main><h1>Welcome</h1><p>I build p5.js sketches.</p></main>'
  })
  afterEach(() => assistant?.destroy())

  it('mounts a launcher in the chosen corner and opens the panel', () => {
    assistant = new Explainer({ ...config, position: 'top-left', offset: { x: 8, y: 12 } })
    const host = document.querySelector('[data-explainer-widget]') as HTMLElement
    expect(host.style.cssText).toContain('--pa-top: 12px')
    expect(host.style.cssText).toContain('--pa-left: 8px')
    const root = shadow(assistant)
    const panel = root.querySelector('.panel') as HTMLElement
    expect(panel.hidden).toBe(true)
    ;(root.querySelector('.launcher') as HTMLButtonElement).click()
    expect(panel.hidden).toBe(false)
    expect(root.querySelectorAll('.chip').length).toBe(3)
  })

  it('asks, shows the answer, highlights and follow-ups', async () => {
    const fetchMock = vi.fn(async () =>
      reply({
        answer: 'This is a portfolio.',
        keyPoints: ['Sketches in p5.js'],
        highlights: [{ id: 'b1', note: 'What she builds' }],
        followUps: [{ label: 'Show projects', href: '/projects/' }, { label: 'What is p5.js?' }],
        notOnPage: false,
        omen: null,
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const events: string[] = []
    assistant = new Explainer({ ...config, onEvent: (e) => events.push(e.type) })
    await assistant.ask('What is this site?')
    const root = shadow(assistant)
    expect(root.querySelector('.msg.user')?.textContent).toBe('What is this site?')
    expect(root.querySelector('.msg.assistant')?.textContent).toContain('This is a portfolio.')
    expect(document.querySelector('p')?.getAttribute('data-explainer-highlight')).toBe('plain')
    const chips = Array.from(root.querySelectorAll('.chip')).map((c) => c.textContent)
    expect(chips).toEqual(['Show projects', 'What is p5.js?'])
    expect(events).toEqual(['open', 'ask', 'answer'])
    const sent = JSON.parse(
      (fetchMock.mock.calls[0] as unknown as [string, RequestInit])[1].body as string,
    )
    expect(sent.messages.at(-1).content).toContain('I build p5.js sketches.')
  })

  it('persists the chat across page loads in the same tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reply({ answer: 'Hi there.' })),
    )
    assistant = new Explainer(config)
    await assistant.ask('Hello?')
    assistant.destroy()
    assistant = new Explainer(config)
    const texts = Array.from(shadow(assistant).querySelectorAll('.msg')).map((m) => m.textContent)
    expect(texts).toEqual(['Hello?', 'Hi there.'])
  })

  it('shows Sage omens only when Sage is on', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => reply({ answer: 'Facts.', omen: 'The vines whisper.' })),
    )
    assistant = new Explainer(config)
    assistant.setPersona('sage')
    await assistant.ask('Tell me')
    const root = shadow(assistant)
    expect(root.querySelector('.omen')?.textContent).toContain('The vines whisper.')
    expect(document.querySelector('[data-explainer-widget]')?.getAttribute('data-persona')).toBe(
      'sage',
    )
  })

  it('explains when it is not connected', async () => {
    assistant = new Explainer({ site: { name: 'X' } })
    await assistant.ask('Anything?')
    expect(shadow(assistant).querySelector('.msg.assistant .error')?.textContent).toMatch(
      /not connected/,
    )
    expect(assistant.status).toMatch(/not connected/)
  })
})
