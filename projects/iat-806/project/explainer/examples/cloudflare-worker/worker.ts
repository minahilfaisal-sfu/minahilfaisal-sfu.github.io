// Cloudflare Worker that holds your OpenRouter key for explainer.
//
// 1. npm create cloudflare@latest explainer-proxy   (choose "Hello World" Worker, TypeScript)
// 2. Replace src/index.ts with this file and install: npm i @minahilfaisal-sfu/explainer
//    (or copy src/server/proxy.ts next to it and import from './proxy')
// 3. npx wrangler secret put OPENROUTER_API_KEY
// 4. Set ALLOWED_ORIGINS in wrangler.toml, then: npx wrangler deploy
// 5. Use the printed https://….workers.dev URL as `endpoint` in your site's config.
import { createProxyHandler } from '@minahilfaisal-sfu/explainer/proxy'

type Env = { OPENROUTER_API_KEY: string; ALLOWED_ORIGINS: string; MODELS?: string }

let handler: ((request: Request) => Promise<Response>) | undefined

// biome-ignore lint/style/noDefaultExport: Workers expect a default export
export default {
  fetch(request: Request, env: Env): Promise<Response> {
    handler ??= createProxyHandler({
      apiKey: env.OPENROUTER_API_KEY,
      allowedOrigins: env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()),
      allowLocalhost: true,
      models: env.MODELS ? env.MODELS.split(',').map((m) => m.trim()) : undefined,
      appName: 'explainer',
    })
    return handler(request)
  },
}
