import type { ChatMessage } from '../types.ts'

export const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'
export const DEFAULT_MODEL = 'openrouter/free'

export class ProviderError extends Error {
  readonly status: number | undefined
  constructor(message: string, status?: number) {
    super(message)
    this.name = 'ProviderError'
    this.status = status
  }
}

export type ProviderOptions = {
  endpoint?: string
  devApiKey?: string
  model?: string
  timeoutMs?: number
  fetchImpl?: typeof fetch
}

const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]', '0.0.0.0'])

export const isLocalPage = (hostname: string): boolean =>
  LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')

/** Which way requests will go, or why none can. */
export const resolveTransport = (
  opts: ProviderOptions,
  hostname: string,
):
  | { kind: 'endpoint'; url: string }
  | { kind: 'direct'; key: string }
  | { kind: 'none'; reason: string } => {
  if (opts.devApiKey && isLocalPage(hostname)) return { kind: 'direct', key: opts.devApiKey }
  if (opts.endpoint) return { kind: 'endpoint', url: opts.endpoint }
  if (opts.devApiKey) {
    return {
      kind: 'none',
      reason:
        'This assistant only has a development key, which is turned off on public pages to keep it private. The site owner needs to set an endpoint.',
    }
  }
  return { kind: 'none', reason: 'This assistant is not connected yet (no endpoint configured).' }
}

const friendlyStatus = (status: number): string => {
  if (status === 429)
    return 'The assistant is busy or has reached its daily limit. Please try again later.'
  if (status === 401 || status === 403)
    return 'The assistant is not allowed to answer from this site right now.'
  return `The assistant could not answer (error ${status}).`
}

type Transport = { kind: 'endpoint'; url: string } | { kind: 'direct'; key: string }

const send = (
  transport: Transport,
  body: { model: string; messages: ChatMessage[] },
  signal: AbortSignal,
  doFetch: typeof fetch,
): Promise<Response> =>
  transport.kind === 'direct'
    ? doFetch(OPENROUTER_URL, {
        method: 'POST',
        signal,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${transport.key}`,
          'X-Title': 'explainer (dev)',
        },
        body: JSON.stringify({ ...body, temperature: 0.3 }),
      })
    : doFetch(transport.url, {
        method: 'POST',
        signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

/** Accepts both the proxy's { content } and OpenRouter's own response shape. */
const readContent = async (response: Response): Promise<string> => {
  if (!response.ok) throw new ProviderError(friendlyStatus(response.status), response.status)
  const data = (await response.json()) as {
    content?: string
    choices?: { message?: { content?: string } }[]
  }
  const content = data.content ?? data.choices?.[0]?.message?.content
  if (typeof content !== 'string' || !content.trim()) {
    throw new ProviderError('The assistant sent back an empty reply.')
  }
  return content
}

const toProviderError = (error: unknown): ProviderError => {
  if (error instanceof ProviderError) return error
  if (error instanceof Error && error.name === 'AbortError') {
    return new ProviderError('The assistant took too long to answer. Please try again.')
  }
  return new ProviderError("Couldn't reach the assistant. Check your connection and try again.")
}

/**
 * Sends the messages to OpenRouter (directly on localhost with a dev key,
 * otherwise through the site's own endpoint) and returns the reply text.
 */
export const complete = async (
  messages: ChatMessage[],
  opts: ProviderOptions,
  hostname: string,
): Promise<string> => {
  const transport = resolveTransport(opts, hostname)
  if (transport.kind === 'none') throw new ProviderError(transport.reason)

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), opts.timeoutMs ?? 30000)
  try {
    const response = await send(
      transport,
      { model: opts.model ?? DEFAULT_MODEL, messages },
      controller.signal,
      opts.fetchImpl ?? fetch,
    )
    return await readContent(response)
  } catch (error) {
    throw toProviderError(error)
  } finally {
    clearTimeout(timer)
  }
}
