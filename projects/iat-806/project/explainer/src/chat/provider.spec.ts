import { describe, expect, it, vi } from 'vitest'
import { complete, ProviderError, resolveTransport } from './provider.ts'

const messages = [{ role: 'user' as const, content: 'hi' }]
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200 })

describe('resolveTransport', () => {
  it('only uses a dev key on localhost', () => {
    expect(resolveTransport({ devApiKey: 'k' }, 'localhost').kind).toBe('direct')
    expect(resolveTransport({ devApiKey: 'k' }, 'me.github.io').kind).toBe('none')
    expect(resolveTransport({ devApiKey: 'k', endpoint: '/api' }, 'me.github.io').kind).toBe(
      'endpoint',
    )
    expect(resolveTransport({}, 'me.github.io').kind).toBe('none')
  })

  it("prefers the visitor's own key when allowed", () => {
    const opts = { endpoint: '/api', devApiKey: 'dev', userApiKey: 'mine', allowUserKey: true }
    expect(resolveTransport(opts, 'me.github.io')).toEqual({ kind: 'direct', key: 'mine' })
    expect(resolveTransport({ ...opts, allowUserKey: false }, 'me.github.io').kind).toBe('endpoint')
    const none = resolveTransport({ allowUserKey: true }, 'me.github.io')
    expect(none.kind === 'none' && none.reason).toMatch(/API key in settings/)
  })
})

describe('complete', () => {
  it('calls the endpoint and reads { content }', async () => {
    const fetchImpl = vi.fn(async () => ok({ content: '{"answer":"hi"}' }))
    const text = await complete(
      messages,
      { endpoint: 'https://proxy.example', fetchImpl },
      'me.github.io',
    )
    expect(text).toBe('{"answer":"hi"}')
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toBe('https://proxy.example')
    expect(init.headers).not.toHaveProperty('Authorization')
  })

  it('calls OpenRouter directly on localhost with a dev key', async () => {
    const fetchImpl = vi.fn(async () => ok({ choices: [{ message: { content: 'hello' } }] }))
    await expect(
      complete(messages, { devApiKey: 'sk-test', fetchImpl }, 'localhost'),
    ).resolves.toBe('hello')
    const [url, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(url).toContain('openrouter.ai')
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer sk-test')
  })

  it('turns errors into friendly messages', async () => {
    const opts = { endpoint: '/api' }
    await expect(
      complete(
        messages,
        { ...opts, fetchImpl: async () => new Response('', { status: 429 }) },
        'x',
      ),
    ).rejects.toThrow(/daily limit/)
    await expect(
      complete(messages, { ...opts, fetchImpl: async () => ok({}) }, 'x'),
    ).rejects.toThrow(/empty/)
    await expect(
      complete(
        messages,
        { ...opts, fetchImpl: async () => Promise.reject(new TypeError('net')) },
        'x',
      ),
    ).rejects.toBeInstanceOf(ProviderError)
    await expect(complete(messages, {}, 'x')).rejects.toThrow(/not connected/)
  })

  it('times out', async () => {
    const fetchImpl = (_u: unknown, init?: RequestInit) =>
      new Promise<Response>((_r, reject) =>
        init?.signal?.addEventListener('abort', () =>
          reject(Object.assign(new Error('a'), { name: 'AbortError' })),
        ),
      )
    await expect(
      complete(
        messages,
        { endpoint: '/api', timeoutMs: 10, fetchImpl: fetchImpl as typeof fetch },
        'x',
      ),
    ).rejects.toThrow(/too long/)
  })
})
