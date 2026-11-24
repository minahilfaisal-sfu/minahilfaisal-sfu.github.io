// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'
import { createProxyHandler } from './proxy.ts'

const SITE = 'https://me.github.io'
const req = (body: unknown, origin: string | null = SITE, method = 'POST', ip = '1.1.1.1') =>
  new Request('https://proxy.example', {
    method,
    headers: {
      ...(origin ? { Origin: origin } : {}),
      'Content-Type': 'application/json',
      'CF-Connecting-IP': ip,
    },
    ...(method === 'POST' ? { body: typeof body === 'string' ? body : JSON.stringify(body) } : {}),
  })
const goodBody = { model: 'openrouter/free', messages: [{ role: 'user', content: 'hi' }] }
const upstreamOk = () =>
  vi.fn(async () => new Response(JSON.stringify({ choices: [{ message: { content: 'answer' } }] })))

describe('createProxyHandler', () => {
  it('forwards valid requests with the secret key and returns { content }', async () => {
    const fetchImpl = upstreamOk()
    const handler = createProxyHandler({ apiKey: 'secret', allowedOrigins: [SITE], fetchImpl })
    const res = await handler(req(goodBody))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ content: 'answer' })
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(SITE)
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect((init.headers as Record<string, string>).Authorization).toBe('Bearer secret')
  })

  it('rejects other origins, bad methods and bad bodies', async () => {
    const handler = createProxyHandler({
      apiKey: 's',
      allowedOrigins: [SITE],
      fetchImpl: upstreamOk(),
    })
    expect((await handler(req(goodBody, 'https://evil.example'))).status).toBe(403)
    expect((await handler(req(goodBody, null))).status).toBe(403)
    expect((await handler(req(null, SITE, 'GET'))).status).toBe(405)
    expect((await handler(req('not json'))).status).toBe(400)
    expect((await handler(req({ messages: [{ role: 'tool', content: 'x' }] }))).status).toBe(400)
    expect(
      (await handler(req({ messages: [{ role: 'user', content: 'x'.repeat(40000) }] }))).status,
    ).toBe(400)
  })

  it('answers CORS preflight and allows localhost when enabled', async () => {
    const handler = createProxyHandler({
      apiKey: 's',
      allowedOrigins: [SITE],
      allowLocalhost: true,
    })
    const res = await handler(req(null, 'http://localhost:5173', 'OPTIONS'))
    expect(res.status).toBe(204)
  })

  it('only uses allowed models', async () => {
    const fetchImpl = upstreamOk()
    const handler = createProxyHandler({ apiKey: 's', allowedOrigins: [SITE], fetchImpl })
    await handler(req({ ...goodBody, model: 'some/expensive-model' }))
    const [, init] = fetchImpl.mock.calls[0] as unknown as [string, RequestInit]
    expect(JSON.parse(init.body as string).model).toBe('openrouter/free')
  })

  it('rate limits each visitor', async () => {
    const handler = createProxyHandler({
      apiKey: 's',
      allowedOrigins: [SITE],
      perMinute: 2,
      fetchImpl: upstreamOk(),
    })
    expect((await handler(req(goodBody))).status).toBe(200)
    expect((await handler(req(goodBody))).status).toBe(200)
    expect((await handler(req(goodBody))).status).toBe(429)
    expect((await handler(req(goodBody, SITE, 'POST', '2.2.2.2'))).status).toBe(200)
  })

  it('passes upstream rate limits through and hides other errors', async () => {
    const limited = createProxyHandler({
      apiKey: 's',
      allowedOrigins: [SITE],
      fetchImpl: async () => new Response('{}', { status: 429 }),
    })
    expect((await limited(req(goodBody))).status).toBe(429)
    const broken = createProxyHandler({
      apiKey: 's',
      allowedOrigins: [SITE],
      fetchImpl: async () => Promise.reject(new Error('down')),
    })
    expect((await broken(req(goodBody))).status).toBe(502)
  })
})
