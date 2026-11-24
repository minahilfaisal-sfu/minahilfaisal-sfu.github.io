/**
 * A tiny backend route that keeps the OpenRouter key off the public website.
 * Standard fetch handler: runs on Cloudflare Workers, Vercel Edge, Deno and Bun.
 *
 *   export default { fetch: createProxyHandler({ apiKey: env.OPENROUTER_API_KEY, ... }) }
 */

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

export type ProxyOptions = {
  apiKey: string
  /** Sites allowed to call this route, e.g. ['https://you.github.io']. Localhost is allowed when allowLocalhost is true. */
  allowedOrigins: string[]
  allowLocalhost?: boolean
  /** Models the browser may ask for. The first one is used when none is given. Default ['openrouter/free']. */
  models?: string[]
  /** Requests per minute per visitor (best effort, per server instance). Default 8. */
  perMinute?: number
  /** Max total characters across all messages. Default 30000. */
  maxChars?: number
  /** Max messages per request. Default 16. */
  maxMessages?: number
  /** Shown in OpenRouter's dashboard. */
  appName?: string
  appUrl?: string
  fetchImpl?: typeof fetch
}

type Message = { role: string; content: string }

const ROLES = new Set(['system', 'user', 'assistant'])

const isLocalOrigin = (origin: string) => {
  try {
    const { hostname } = new URL(origin)
    return hostname === 'localhost' || hostname === '127.0.0.1' || hostname.endsWith('.localhost')
  } catch {
    return false
  }
}

const json = (body: unknown, status: number, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...headers },
  })

const corsHeaders = (origin: string): Record<string, string> => ({
  'Access-Control-Allow-Origin': origin,
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
  Vary: 'Origin',
})

const visitorOf = (request: Request): string =>
  request.headers.get('CF-Connecting-IP') ??
  request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim() ??
  'unknown'

/** Returns clean messages, or undefined if the body isn't acceptable. */
const readMessages = (
  body: { messages?: unknown },
  maxMessages: number,
  maxChars: number,
): Message[] | undefined => {
  const messages = Array.isArray(body.messages) ? (body.messages as Message[]) : []
  if (messages.length === 0 || messages.length > maxMessages) return undefined
  const wellFormed = messages.every((m) => m && ROLES.has(m.role) && typeof m.content === 'string')
  if (!wellFormed) return undefined
  if (messages.reduce((n, m) => n + m.content.length, 0) > maxChars) return undefined
  return messages.map(({ role, content }) => ({ role, content }))
}

/** Simple sliding-window limiter. Per server instance, so it's best effort. */
const createLimiter = (perMinute: number) => {
  const hits = new Map<string, number[]>()
  return (visitor: string): boolean => {
    const now = Date.now()
    const recent = (hits.get(visitor) ?? []).filter((t) => now - t < 60_000)
    const blocked = recent.length >= perMinute
    if (!blocked) recent.push(now)
    hits.set(visitor, recent)
    if (hits.size > 5000) hits.clear()
    return blocked
  }
}

const callOpenRouter = async (
  opts: ProxyOptions,
  model: string,
  messages: Message[],
  headers: Record<string, string>,
): Promise<Response> => {
  const upstream = await (opts.fetchImpl ?? fetch)(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.apiKey}`,
      ...(opts.appUrl ? { 'HTTP-Referer': opts.appUrl } : {}),
      ...(opts.appName ? { 'X-Title': opts.appName } : {}),
    },
    body: JSON.stringify({ model, messages, temperature: 0.3, max_tokens: 700 }),
  }).catch(() => undefined)

  if (!upstream) return json({ error: 'Upstream unreachable' }, 502, headers)
  if (!upstream.ok) {
    // Pass rate limits through so the widget can explain them; hide other details
    return json({ error: 'Upstream error' }, upstream.status === 429 ? 429 : 502, headers)
  }
  const data = (await upstream.json().catch(() => ({}))) as {
    choices?: { message?: { content?: string } }[]
  }
  const content = data.choices?.[0]?.message?.content
  if (typeof content !== 'string') return json({ error: 'Empty reply' }, 502, headers)
  return json({ content }, 200, headers)
}

const pickModel = (requested: unknown, models: string[]): string =>
  typeof requested === 'string' && models.includes(requested) ? requested : (models[0] as string)

export const createProxyHandler = (opts: ProxyOptions) => {
  const models = opts.models?.length ? opts.models : ['openrouter/free']
  const maxChars = opts.maxChars ?? 30000
  const maxMessages = opts.maxMessages ?? 16
  const isLimited = createLimiter(opts.perMinute ?? 8)

  const allowed = (origin: string | null): origin is string =>
    !!origin &&
    (opts.allowedOrigins.includes(origin) ||
      (opts.allowLocalhost === true && isLocalOrigin(origin)))

  return async (request: Request): Promise<Response> => {
    const origin = request.headers.get('Origin')
    if (!allowed(origin)) return json({ error: 'Origin not allowed' }, 403)
    const headers = corsHeaders(origin)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers })
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405, headers)
    if (isLimited(visitorOf(request))) return json({ error: 'Too many requests' }, 429, headers)

    const body = (await request.json().catch(() => undefined)) as
      | { model?: unknown; messages?: unknown }
      | undefined
    if (!body || typeof body !== 'object') return json({ error: 'Invalid JSON' }, 400, headers)

    const messages = readMessages(body, maxMessages, maxChars)
    if (!messages) return json({ error: 'Invalid messages' }, 400, headers)

    return callOpenRouter(opts, pickModel(body.model, models), messages, headers)
  }
}
