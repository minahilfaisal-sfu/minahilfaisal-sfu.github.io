/** Where the launcher bubble sits on the screen. */
export type Position = 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'

/** How the assistant talks. Personas change presentation only, never facts. */
export type PersonaName = 'plain' | 'sage'

/** What the site owner tells the assistant about the whole site. Set once. */
export type SiteContext = {
  /** Shown in the panel header and given to the model. */
  name: string
  /** One or two sentences: what the site is for. */
  description?: string
  /** Who visits, so answers pitch at the right level. */
  audience?: string
  /** Site-specific terms the assistant should use consistently. */
  glossary?: Record<string, string>
  /**
   * Pages the assistant may point visitors to, keyed by path or URL.
   * Navigation chips can only link to pages listed here.
   */
  pages?: Record<string, string>
  /** Known questions with fixed answers. */
  faq?: { q: string; a: string }[]
  /** Anything else worth knowing. Free text. */
  notes?: string
}

export type AssistantConfig = {
  site: SiteContext
  /**
   * Your own backend route that holds the API key (see the `/proxy` export).
   * Required on any public website.
   */
  endpoint?: string
  /**
   * Let visitors add their own OpenRouter key in a ⚙️ settings view.
   * Their key stays in their browser and is sent only to OpenRouter.
   * Works with no backend at all. Default false.
   */
  allowUserKey?: boolean
  /**
   * OpenRouter key for LOCAL DEVELOPMENT ONLY. Ignored unless the page runs on
   * localhost, because any key in a public page can be copied by anyone.
   */
  devApiKey?: string
  /** OpenRouter model id. Default: 'openrouter/free' (OpenRouter picks a free model). */
  model?: string
  /** Default persona. Visitors can flip it with the Sage toggle unless it is hidden. */
  persona?: PersonaName
  /** Corner for the launcher bubble. Default 'bottom-right'. */
  position?: Position
  /** Distance from the corner, in pixels. Default 20 / 20. */
  offset?: { x?: number; y?: number }
  /** Accent colour for the bubble and buttons. Any CSS colour. */
  accentColor?: string
  /** Panel title. Default "Ask about this page". */
  title?: string
  /** Chips shown before the first question. */
  starters?: string[]
  /** Root element to read. Default: <main>, falling back to <body>. */
  contentRoot?: string | Element
  /** Max characters of page text sent per request. Default 8000. */
  maxContextChars?: number
  /** Extra per-page facts (e.g. selected filters). Called on every question. */
  getPageContext?: () => Record<string, unknown> | string | undefined
  /** UI switches. */
  ui?: {
    showSageToggle?: boolean
    /** Area select is Part 2; the button shows as "coming soon" until then. */
    showSelectButton?: boolean
    /** Start with the panel open. */
    openOnLoad?: boolean
  }
  /** Request timeout in ms. Default 30000 (free models can be slow). */
  timeoutMs?: number
  /** Called for every interaction, e.g. to collect study logs. */
  onEvent?: (event: AssistantEvent) => void
}

/** One readable piece of the page, tagged so the model can point at it. */
export type PageBlock = {
  id: string
  kind: string
  text: string
}

export type PageSnapshot = {
  url: string
  path: string
  title: string
  blocks: PageBlock[]
  notes: string[]
  truncated: boolean
}

export type Highlight = { id: string; note: string }

export type FollowUp = { label: string; href?: string }

/** What the assistant shows for one answer, after validation. */
export type AssistantReply = {
  answer: string
  keyPoints: string[]
  highlights: Highlight[]
  followUps: FollowUp[]
  notOnPage: boolean
  omen?: string
  /** True when the model reply could not be used and a fallback was shown. */
  fallback?: boolean
}

export type ChatTurn =
  | { role: 'user'; text: string; at: number; page: { path: string; title: string } }
  | { role: 'assistant'; reply: AssistantReply; at: number; page: { path: string; title: string } }

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string }

export type AssistantEvent =
  | { type: 'open' | 'close'; path: string }
  | { type: 'ask'; via: 'typed' | 'chip' | 'starter'; text: string; path: string }
  | { type: 'answer'; ms: number; fallback: boolean; persona: PersonaName; path: string }
  | { type: 'persona'; persona: PersonaName; path: string }
  | { type: 'highlight'; id: string; path: string }
  | { type: 'error'; message: string; path: string }
  | { type: 'settings'; action: 'open' | 'save' | 'remove'; path: string }
