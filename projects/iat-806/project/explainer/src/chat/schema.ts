import type { AssistantReply, FollowUp, Highlight, PersonaName } from '../types.ts'

const MAX_KEY_POINTS = 4
const MAX_FOLLOW_UPS = 3
const MAX_HIGHLIGHTS = 4

const str = (value: unknown, max = 1200): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/** Pulls the first JSON object out of a model reply (handles ```json fences and chatter). */
export const extractJson = (raw: string): unknown => {
  const text = raw.trim()
  const fenced = /```(?:json)?\s*([\s\S]*?)```/i.exec(text)
  const candidate = fenced?.[1] ?? text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end <= start) return undefined
  try {
    return JSON.parse(candidate.slice(start, end + 1))
  } catch {
    return undefined
  }
}

export type ValidationContext = {
  /** Block ids that exist on the page right now. */
  blockIds: Set<string>
  /** Paths/URLs the site config allows links to. */
  allowedLinks: Set<string>
  persona: PersonaName
}

export const fallbackReply = (message?: string): AssistantReply => ({
  answer:
    message ??
    "Sorry, I couldn't put an answer together just now. Try asking again, or rephrase the question.",
  keyPoints: [],
  highlights: [],
  followUps: [],
  notOnPage: false,
  fallback: true,
})

/**
 * Turns whatever the model sent into a safe reply:
 * drops highlights that don't exist on the page, links the site doesn't list,
 * and the omen when Sage is off. Plain text replies are kept as the answer.
 */
export const parseReply = (raw: string, ctx: ValidationContext): AssistantReply => {
  const data = extractJson(raw)

  if (!data || typeof data !== 'object') {
    const text = str(raw, 2000)
    return text ? { ...fallbackReply(text), fallback: false } : fallbackReply()
  }

  const obj = data as Record<string, unknown>
  const answer = str(obj.answer, 2000)
  if (!answer) return fallbackReply()

  const keyPoints = (Array.isArray(obj.keyPoints) ? obj.keyPoints : [])
    .map((p) => str(p, 300))
    .filter(Boolean)
    .slice(0, MAX_KEY_POINTS)

  const highlights: Highlight[] = (Array.isArray(obj.highlights) ? obj.highlights : [])
    .map((h) => (h && typeof h === 'object' ? (h as Record<string, unknown>) : {}))
    .map((h) => ({ id: str(h.id, 20), note: str(h.note, 200) }))
    .filter((h) => ctx.blockIds.has(h.id))
    .slice(0, MAX_HIGHLIGHTS)

  const followUps: FollowUp[] = (Array.isArray(obj.followUps) ? obj.followUps : [])
    .map((f) => {
      if (typeof f === 'string') return { label: str(f, 120) }
      const rec = f && typeof f === 'object' ? (f as Record<string, unknown>) : {}
      const href = str(rec.href, 300)
      return href && ctx.allowedLinks.has(href)
        ? { label: str(rec.label, 120), href }
        : { label: str(rec.label, 120) }
    })
    .filter((f) => f.label)
    .slice(0, MAX_FOLLOW_UPS)

  const omen = ctx.persona === 'sage' ? str(obj.omen, 300) : ''

  return {
    answer,
    keyPoints,
    highlights,
    followUps,
    notOnPage: obj.notOnPage === true,
    ...(omen ? { omen } : {}),
  }
}
