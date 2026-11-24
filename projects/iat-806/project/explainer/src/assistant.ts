import { Conversation } from './chat/conversation.ts'
import { buildMessages } from './chat/prompt.ts'
import { complete, ProviderError, resolveTransport } from './chat/provider.ts'
import { fallbackReply, parseReply } from './chat/schema.ts'
import { extractPage } from './context/page.ts'
import type {
  AssistantConfig,
  AssistantEvent,
  AssistantReply,
  ChatTurn,
  PageSnapshot,
  PersonaName,
} from './types.ts'
import { clearHighlights, showHighlights } from './ui/highlight.ts'
import { ICONS, positionVars, WIDGET_CSS } from './ui/styles.ts'

const DEFAULT_STARTERS = [
  'What is this page about?',
  'Summarize this page for me',
  'What should I look at first?',
]

type AskVia = 'typed' | 'chip' | 'starter'

const el = <K extends keyof HTMLElementTagNameMap>(
  doc: Document,
  tag: K,
  attrs: Record<string, string> = {},
  text?: string,
): HTMLElementTagNameMap[K] => {
  const node = doc.createElement(tag)
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, v)
  if (text !== undefined) node.textContent = text
  return node
}

/** The widget: a launcher bubble and a chat panel, mounted in a Shadow DOM. */
export class Explainer {
  readonly config: AssistantConfig
  private readonly doc: Document
  private readonly conversation: Conversation
  private persona: PersonaName
  private page: PageSnapshot
  private busy = false
  private isOpen = false

  private host!: HTMLElement
  private root!: ShadowRoot
  private launcher!: HTMLButtonElement
  private panel!: HTMLElement
  private messagesEl!: HTMLElement
  private chipsEl!: HTMLElement
  private input!: HTMLInputElement
  private sendBtn!: HTMLButtonElement
  private toggleBtn: HTMLButtonElement | undefined
  private pageNameEl!: HTMLElement
  private liveEl!: HTMLElement

  constructor(config: AssistantConfig, doc: Document = document) {
    if (!config?.site?.name) throw new Error('explainer: config.site.name is required')
    this.config = config
    this.doc = doc
    const view = doc.defaultView
    let storage: Storage | undefined
    try {
      storage = view?.sessionStorage
    } catch {
      storage = undefined
    }
    this.conversation = new Conversation(config.site.name, storage)
    this.persona = this.conversation.persona ?? config.persona ?? 'plain'
    this.page = this.readPage()
    this.mount()
    this.renderHistory()
    if (this.conversation.open || config.ui?.openOnLoad) this.setOpen(true, false)
  }

  /** Re-read the page, e.g. after a single-page-app route change. */
  refresh() {
    this.page = this.readPage()
    this.pageNameEl.textContent = `On: ${this.page.title}`
  }

  open() {
    this.setOpen(true)
  }

  close() {
    this.setOpen(false)
  }

  setPersona(persona: PersonaName) {
    this.persona = persona
    this.conversation.persona = persona
    this.host.setAttribute('data-persona', persona)
    this.toggleBtn?.setAttribute('aria-checked', String(persona === 'sage'))
    this.emit({ type: 'persona', persona, path: this.page.path })
  }

  /** Ask a question as if the visitor typed it. */
  ask(question: string, via: AskVia = 'typed'): Promise<void> {
    return this.handleAsk(question, via)
  }

  clearChat() {
    this.conversation.clear()
    clearHighlights(this.doc)
    this.renderHistory()
  }

  destroy() {
    clearHighlights(this.doc)
    this.host.remove()
  }

  // ---------- internals ----------

  private readPage(): PageSnapshot {
    return extractPage(this.doc, {
      root: this.config.contentRoot,
      maxChars: this.config.maxContextChars,
    })
  }

  private emit(event: AssistantEvent) {
    try {
      this.config.onEvent?.(event)
    } catch {
      // A broken logger must never break the widget
    }
  }

  private mount() {
    const { doc, config } = this
    const pos = config.position ?? 'bottom-right'
    this.host = el(doc, 'div', { 'data-explainer-widget': '', 'data-persona': this.persona })
    this.host.style.cssText = positionVars(pos, config.offset?.x ?? 20, config.offset?.y ?? 20)
    if (config.accentColor) this.host.style.setProperty('--pa-accent', config.accentColor)
    this.root = this.host.attachShadow({ mode: 'open' })

    const style = el(doc, 'style')
    style.textContent = WIDGET_CSS
    this.root.appendChild(style)

    this.launcher = el(doc, 'button', {
      class: 'launcher',
      type: 'button',
      'aria-label': 'Open assistant',
      'aria-expanded': 'false',
      'aria-controls': 'explainer-panel',
    })
    this.launcher.innerHTML = ICONS.chat
    this.launcher.addEventListener('click', () => this.setOpen(!this.isOpen))

    this.panel = el(doc, 'section', {
      class: 'panel',
      id: 'explainer-panel',
      role: 'dialog',
      'aria-label': config.title ?? 'Ask about this page',
    })
    this.panel.hidden = true
    this.panel.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.setOpen(false)
    })

    // Header
    const header = el(doc, 'div', { class: 'header' })
    const headerText = el(doc, 'div', { class: 'header-text' })
    headerText.appendChild(el(doc, 'p', { class: 'title' }, config.title ?? 'Ask about this page'))
    this.pageNameEl = el(doc, 'div', { class: 'page-name' }, `On: ${this.page.title}`)
    headerText.appendChild(this.pageNameEl)
    header.appendChild(headerText)

    if (config.ui?.showSageToggle !== false) {
      this.toggleBtn = el(doc, 'button', {
        class: 'toggle',
        type: 'button',
        role: 'switch',
        'aria-checked': String(this.persona === 'sage'),
        title: 'Sage persona: same answers, spookier voice',
      })
      this.toggleBtn.appendChild(el(doc, 'span', {}, 'Sage'))
      this.toggleBtn.appendChild(el(doc, 'span', { class: 'switch', 'aria-hidden': 'true' }))
      this.toggleBtn.addEventListener('click', () =>
        this.setPersona(this.persona === 'sage' ? 'plain' : 'sage'),
      )
      header.appendChild(this.toggleBtn)
    }

    const resetBtn = el(doc, 'button', {
      class: 'icon-btn',
      type: 'button',
      'aria-label': 'Start a new chat',
      title: 'Start a new chat',
    })
    resetBtn.innerHTML = ICONS.reset
    resetBtn.addEventListener('click', () => this.clearChat())
    header.appendChild(resetBtn)

    const closeBtn = el(doc, 'button', { class: 'icon-btn', type: 'button', 'aria-label': 'Close' })
    closeBtn.innerHTML = ICONS.close
    closeBtn.addEventListener('click', () => this.setOpen(false))
    header.appendChild(closeBtn)

    // Messages + chips
    this.messagesEl = el(doc, 'div', { class: 'messages' })
    this.liveEl = el(doc, 'div', { class: 'sr-only', 'aria-live': 'polite' })
    this.chipsEl = el(doc, 'div', {
      class: 'chips',
      role: 'group',
      'aria-label': 'Suggested questions',
    })

    // Composer
    const form = el(doc, 'form', { class: 'composer' })
    if (config.ui?.showSelectButton !== false) {
      const selectBtn = el(doc, 'button', {
        class: 'select',
        type: 'button',
        disabled: '',
        'aria-label': 'Select an area of the page (coming soon)',
        title: 'Select an area of the page (coming soon)',
      })
      selectBtn.innerHTML = ICONS.select
      form.appendChild(selectBtn)
    }
    this.input = el(doc, 'input', {
      type: 'text',
      placeholder: 'Ask a question…',
      'aria-label': 'Your question',
      maxlength: '500',
      autocomplete: 'off',
    })
    this.sendBtn = el(doc, 'button', { class: 'send', type: 'submit', 'aria-label': 'Send' })
    this.sendBtn.innerHTML = ICONS.send
    form.append(this.input, this.sendBtn)
    form.addEventListener('submit', (e) => {
      e.preventDefault()
      const text = this.input.value.trim()
      if (!text) return
      this.input.value = ''
      void this.handleAsk(text, 'typed')
    })

    const privacy = el(
      doc,
      'div',
      { class: 'privacy' },
      'Your questions and the text of this page are sent to an AI model to answer.',
    )

    this.panel.append(header, this.messagesEl, this.chipsEl, form, privacy, this.liveEl)
    this.root.append(this.launcher, this.panel)
    doc.body.appendChild(this.host)
  }

  private setOpen(open: boolean, log = true) {
    this.isOpen = open
    this.panel.hidden = !open
    this.launcher.setAttribute('aria-expanded', String(open))
    this.launcher.setAttribute('aria-label', open ? 'Close assistant' : 'Open assistant')
    this.conversation.open = open
    if (open) {
      this.messagesEl.scrollTop = this.messagesEl.scrollHeight
      this.input.focus()
    } else {
      clearHighlights(this.doc)
      if (log) this.launcher.focus()
    }
    if (log) this.emit({ type: open ? 'open' : 'close', path: this.page.path })
  }

  private renderChips(labels: { label: string; href?: string }[], via: AskVia) {
    this.chipsEl.replaceChildren()
    for (const chip of labels) {
      const button = el(
        this.doc,
        'button',
        {
          class: chip.href ? 'chip link' : 'chip',
          type: 'button',
        },
        chip.label,
      )
      button.addEventListener('click', () => {
        if (chip.href) {
          const view = this.doc.defaultView
          if (view) view.location.href = new URL(chip.href, view.location.href).href
          return
        }
        void this.handleAsk(chip.label, via)
      })
      this.chipsEl.appendChild(button)
    }
  }

  private renderHistory() {
    this.messagesEl.replaceChildren()
    const turns = this.conversation.turns
    if (turns.length === 0) {
      const intro = el(
        this.doc,
        'p',
        { class: 'notice' },
        `Hi! Ask me anything about this page on ${this.config.site.name}.`,
      )
      this.messagesEl.appendChild(intro)
      this.renderChips(
        (this.config.starters ?? DEFAULT_STARTERS).map((label) => ({ label })),
        'starter',
      )
      return
    }
    let lastPath: string | undefined
    for (const turn of turns) {
      if (turn.page.path !== lastPath && lastPath !== undefined) {
        this.messagesEl.appendChild(
          el(this.doc, 'div', { class: 'page-switch' }, `On: ${turn.page.title}`),
        )
      }
      lastPath = turn.page.path
      this.appendTurn(turn, turn.page.path === this.page.path)
    }
    if (lastPath !== this.page.path) {
      this.messagesEl.appendChild(
        el(this.doc, 'div', { class: 'page-switch' }, `Now on: ${this.page.title}`),
      )
      this.renderChips(
        (this.config.starters ?? DEFAULT_STARTERS).map((label) => ({ label })),
        'starter',
      )
    } else {
      const last = turns[turns.length - 1]
      this.renderChips(last?.role === 'assistant' ? last.reply.followUps : [], 'chip')
    }
  }

  private appendTurn(turn: ChatTurn, samePage: boolean) {
    if (turn.role === 'user') {
      this.messagesEl.appendChild(el(this.doc, 'div', { class: 'msg user' }, turn.text))
      return
    }
    this.messagesEl.appendChild(this.renderReply(turn.reply, samePage))
  }

  private renderReply(reply: AssistantReply, canPin: boolean): HTMLElement {
    const box = el(this.doc, 'div', { class: 'msg assistant' })
    if (reply.omen && this.persona === 'sage') {
      box.appendChild(el(this.doc, 'p', { class: 'omen' }, `“${reply.omen}”`))
    }
    box.appendChild(el(this.doc, 'p', reply.fallback ? { class: 'error' } : {}, reply.answer))
    if (reply.keyPoints.length > 0) {
      const list = el(this.doc, 'ul')
      for (const point of reply.keyPoints) list.appendChild(el(this.doc, 'li', {}, point))
      box.appendChild(list)
    }
    if (canPin && reply.highlights.length > 0) {
      const pins = el(this.doc, 'div', { class: 'pins' })
      for (const h of reply.highlights) {
        const pin = el(
          this.doc,
          'button',
          { class: 'pin', type: 'button' },
          `📍 ${h.note || 'Show on page'}`,
        )
        pin.addEventListener('click', () => {
          showHighlights(this.doc, [h.id], {
            accent: this.config.accentColor ?? '#3d6b4f',
            sage: this.persona === 'sage',
          })
          this.emit({ type: 'highlight', id: h.id, path: this.page.path })
        })
        pins.appendChild(pin)
      }
      box.appendChild(pins)
    }
    return box
  }

  private setBusy(busy: boolean) {
    this.busy = busy
    this.sendBtn.disabled = busy
    for (const chip of Array.from(this.chipsEl.querySelectorAll('button'))) {
      ;(chip as HTMLButtonElement).disabled = busy
    }
  }

  private async handleAsk(question: string, via: AskVia) {
    const text = question.trim().slice(0, 500)
    if (!text || this.busy) return
    if (!this.isOpen) this.setOpen(true)

    // Re-read the page so answers match what's on screen now
    this.page = this.readPage()
    const pageRef = { path: this.page.path, title: this.page.title }
    const history = [...this.conversation.turns]

    if (history.length === 0) this.messagesEl.replaceChildren()
    const userTurn: ChatTurn = { role: 'user', text, at: Date.now(), page: pageRef }
    this.conversation.add(userTurn)
    this.appendTurn(userTurn, true)
    this.chipsEl.replaceChildren()
    this.emit({ type: 'ask', via, text, path: this.page.path })

    const thinking = el(
      this.doc,
      'div',
      { class: 'thinking' },
      this.persona === 'sage' ? 'Sage stirs' : 'Thinking',
    )
    this.messagesEl.appendChild(thinking)
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight
    this.setBusy(true)

    const started = Date.now()
    let reply: AssistantReply
    try {
      const extra = this.config.getPageContext?.()
      const messages = buildMessages({
        site: this.config.site,
        persona: this.persona,
        page: this.page,
        history,
        question: text,
        extra,
      })
      const raw = await complete(
        messages,
        {
          endpoint: this.config.endpoint,
          devApiKey: this.config.devApiKey,
          model: this.config.model,
          timeoutMs: this.config.timeoutMs,
        },
        this.doc.defaultView?.location.hostname ?? '',
      )
      reply = parseReply(raw, {
        blockIds: new Set(this.page.blocks.map((b) => b.id)),
        allowedLinks: new Set(Object.keys(this.config.site.pages ?? {})),
        persona: this.persona,
      })
    } catch (error) {
      const message = error instanceof ProviderError ? error.message : undefined
      reply = fallbackReply(message)
      this.emit({ type: 'error', message: String(error), path: this.page.path })
    }

    thinking.remove()
    const turn: ChatTurn = { role: 'assistant', reply, at: Date.now(), page: pageRef }
    this.conversation.add(turn)
    this.messagesEl.appendChild(this.renderReply(reply, true))
    this.liveEl.textContent = reply.answer
    this.renderChips(reply.followUps, 'chip')
    this.setBusy(false)
    this.messagesEl.scrollTop = this.messagesEl.scrollHeight

    if (reply.highlights.length > 0) {
      showHighlights(
        this.doc,
        reply.highlights.map((h) => h.id),
        { accent: this.config.accentColor ?? '#3d6b4f', sage: this.persona === 'sage' },
      )
    } else {
      clearHighlights(this.doc)
    }
    this.emit({
      type: 'answer',
      ms: Date.now() - started,
      fallback: reply.fallback === true,
      persona: this.persona,
      path: this.page.path,
    })
  }

  /** Whether requests can be made from this page at all (for diagnostics). */
  get status(): string {
    const t = resolveTransport(
      { endpoint: this.config.endpoint, devApiKey: this.config.devApiKey },
      this.doc.defaultView?.location.hostname ?? '',
    )
    return t.kind === 'none' ? t.reason : `ready (${t.kind})`
  }
}
