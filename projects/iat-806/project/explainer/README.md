# @minahilfaisal-sfu/explainer

A drop-in AI assistant for any website. Add one script and a little context about your site, and a chat bubble appears on every page. Visitors ask about what they're looking at; the assistant answers from the page's own content plus your site info, and highlights the parts of the page it's talking about.

- Works on plain HTML sites (one `<script>`) and in bundled apps (`npm`)
- Reads the main content of each page; skips nav, footers, forms and anything you mark private
- Chat follows visitors from page to page (per browser tab)
- Follow-up chips plus a text box; links only to pages you list
- Optional **Sage** persona: same facts, spookier voice
- Shadow DOM, so your CSS and the widget's never clash
- Free models through [OpenRouter](https://openrouter.ai), with a tiny proxy to keep your key secret

## Quick start (plain HTML)

```html
<script src="explainer.iife.js"></script>
<script>
  Explainer.init({
    endpoint: 'https://your-proxy.workers.dev',
    site: {
      name: 'My Site',
      description: 'What the site is for.',
      audience: 'Who visits.',
      glossary: { 'p5.js': 'a drawing library for the browser' },
      pages: { '/projects/index.html': 'All projects' },
    },
    position: 'bottom-right', // bottom-left | top-right | top-left
  })
</script>
```

Add it to a file every page already loads (a shared header or layout) to get it everywhere.

## Options

| Option                | Default                   | What it does                                                           |
| --------------------- | ------------------------- | ---------------------------------------------------------------------- |
| `site`                | required                  | `name`, `description`, `audience`, `glossary`, `pages`, `faq`, `notes` |
| `endpoint`            | —                         | Your proxy URL (required on public sites)                              |
| `devApiKey`           | —                         | OpenRouter key for **localhost only**; ignored everywhere else         |
| `model`               | `openrouter/free`         | Any OpenRouter model id                                                |
| `position` / `offset` | `bottom-right` / `20, 20` | Where the bubble sits                                                  |
| `accentColor`         | `#3d6b4f`                 | Bubble and button colour                                               |
| `persona`             | `plain`                   | `plain` or `sage`                                                      |
| `starters`            | 3 generic questions       | Chips shown before the first question                                  |
| `contentRoot`         | `<main>` or `<body>`      | What part of the page to read                                          |
| `maxContextChars`     | `8000`                    | Page text budget per question                                          |
| `getPageContext`      | —                         | Extra facts per question, e.g. selected filters                        |
| `ui`                  | all on                    | `showSageToggle`, `showSelectButton`, `openOnLoad`                     |
| `onEvent`             | —                         | Callback for every interaction (study logging)                         |

## Page hints

```html
<main data-explainer-context="This page compares three scenarios.">
<section data-explainer-ignore>Never sent to the AI</section>
```

## Keep your key secret: the proxy

Anything in a public page can be copied, including API keys. Run the included proxy (Cloudflare Workers, Vercel Edge, Deno or Bun) and point `endpoint` at it:

```ts
import { createProxyHandler } from '@minahilfaisal-sfu/explainer/proxy'

export default {
  fetch: (request, env) =>
    createProxyHandler({
      apiKey: env.OPENROUTER_API_KEY,
      allowedOrigins: ['https://you.github.io'],
      allowLocalhost: true,
    })(request),
}
```

It only accepts requests from your sites, limits each visitor to a few requests a minute, only allows the models you list, and never returns the key. See `examples/cloudflare-worker`.

> OpenRouter's free models allow 20 requests a minute and 50 a day per account (1,000 a day once the account has bought $10 of credits).

## API

```ts
import { init } from '@minahilfaisal-sfu/explainer'
const assistant = await init(config)
assistant.open()
assistant.ask('What is this page about?')
assistant.setPersona('sage')
assistant.refresh() // after changing page content without a reload
```

## Develop

This package currently lives inside my website repo, at `projects/iat-806/project/explainer/`. The website loads the built file from `/explainer/` at the repo root.

```sh
cd projects/iat-806/project/explainer
pnpm install         # once (npm install also works)

pnpm test            # unit tests (happy-dom)
pnpm test:watch      # re-run tests while you edit
pnpm lint            # Biome + type check
pnpm build           # dist/index.js, dist/proxy.js, dist/explainer.iife.js
pnpm build:site      # build, then copy explainer.iife.js into the website's /explainer/ folder
```

Don't have pnpm? Run `corepack enable` once (it comes with Node), or use `npm` in place of `pnpm` for every command.

After `pnpm build:site`, preview the website from its root (e.g. VS Code Live Server) and commit the updated `/explainer/explainer.iife.js`.

### Source layout

```
src/
  index.ts             public API: init(), getInstance()
  browser.ts           entry for the single-file <script> build
  types.ts             every option and type
  assistant.ts         the widget: launcher, panel, messages, chips
  chat/                conversation history, prompt, model call, reply checks
  context/page.ts      reads the page into tagged blocks
  ui/                  styles, icons, highlights
  server/proxy.ts      the key-hiding proxy
examples/              Cloudflare Worker for the proxy
scripts/               copy-to-site helper
```

## Credits

Tooling and conventions (TypeScript, Vite, Vitest, Biome and the shared `@lokalise/tsconfig` / `@lokalise/biome-config` presets) come from Lokalise's open-source [shared-ts-libs](https://github.com/lokalise/shared-ts-libs) template.
