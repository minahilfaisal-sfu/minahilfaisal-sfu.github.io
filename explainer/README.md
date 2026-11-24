# explainer

The chat bubble that appears on every page of this site.

## What's in this folder

| File | What it is | Edit it? |
|---|---|---|
| `explainer.iife.js` | The library, **built** into one small file the browser can load | No, it gets replaced on every build |
| `explainer.iife.js.map` | Lets browser dev tools show the original source when debugging | No |
| `config.js` | This site's settings: what the assistant knows, where the bubble sits | **Yes** |
| `dev-key.example.js` | Template for a private key used only on localhost | Copy it, don't edit it |
| `dev-key.local.js` | Your private key (you create this; git ignores it) | Yes, never commit it |

`header.js` (one folder up) loads these files on every page, so nothing else needs to change when you add a new page.

## Where the code lives

The source code is in this same repo, next to the final project page:

```
projects/iat-806/project/explainer/
  src/          the TypeScript source, split into folders  ← edit here
  dist/         build output (created by `pnpm build`, not committed)
  README.md     full documentation of every option
```

`explainer.iife.js` here is the built copy of that source. It's the same idea as the `build/` folder of a React app: generated, minified, not meant to be read.

## Updating the library on this site

1. Make changes in `projects/iat-806/project/explainer/src/`.
2. In that folder, run:
   ```sh
   pnpm install      # first time only
   pnpm test
   pnpm build:site   # builds, then copies the new file into this explainer/ folder
   ```
3. Commit and push this site.

Don't have pnpm? Run `corepack enable` once (it comes with Node), or use `npm` in place of `pnpm` for every command.

## Trying it on your computer

1. Copy `dev-key.example.js` to `dev-key.local.js` and paste your OpenRouter key into it.
2. Serve the site from its root folder, for example with VS Code's **Live Server**, or:
   ```sh
   npx serve .
   ```
3. Open the `localhost` address it prints. The bubble is in the bottom-right corner.

The dev key only works on `localhost`. On the live site it is ignored, so a forgotten key can't leak.

## Going live (keeping the key secret)

Anything inside a public web page can be copied, including API keys. So the live site sends questions to a small **proxy** that holds the key instead.

1. Get an OpenRouter key at https://openrouter.ai/keys.
2. Create a free Cloudflare account, then in a new folder:
   ```sh
   npm create cloudflare@latest explainer-proxy
   ```
   Choose the "Hello World" Worker with TypeScript.
3. Replace its `src/index.ts` and `wrangler.toml` with the two files from
   `projects/iat-806/project/explainer/examples/cloudflare-worker/`.
   Copy `src/server/proxy.ts` from the library next to `src/index.ts`, and change the import in `index.ts` to `import { createProxyHandler } from './proxy'`.
   (Once the library is published to npm, you can `npm i` it and keep the original import instead.)
4. Store the key as a secret, then deploy:
   ```sh
   npx wrangler secret put OPENROUTER_API_KEY
   npx wrangler deploy
   ```
5. Paste the URL it prints (`https://explainer-proxy.<you>.workers.dev`) into `endpoint` in `config.js`, then push the site.

`ALLOWED_ORIGINS` in `wrangler.toml` lists which sites may use the proxy. Add any other site you put the assistant on.

> Free OpenRouter models allow 50 requests a day per account, or 1,000 a day once the account has bought $10 of credits.

## Using it in another project

Every project needs the same three things: the library, a config with `site` info, and an `endpoint` (your proxy). One proxy can serve several sites; just add each site to `ALLOWED_ORIGINS`.

### Plain HTML site (like this one)

Copy `explainer.iife.js` into the project, then on every page (or in a shared file every page loads):

```html
<script src="explainer.iife.js"></script>
<script>
  Explainer.init({
    endpoint: "https://explainer-proxy.<you>.workers.dev",
    site: {
      name: "My Project",
      description: "What this site is for.",
      pages: { "/about.html": "About the project" },
    },
  });
</script>
```

### React, Vue, Next.js or any bundled app

Once the package is published to npm:

```sh
pnpm add @minahilfaisal-sfu/explainer
```

```ts
import { init } from "@minahilfaisal-sfu/explainer";

init({
  endpoint: "https://explainer-proxy.<you>.workers.dev",
  site: { name: "My App", description: "…" },
});
```

In React, call `init` once, e.g. in a `useEffect` with an empty dependency list in your root component. It works with client-side routing: the assistant re-reads the page when the URL changes. In Next.js, call it from a client component (`"use client"`).

Until it's published, you can install it straight from the library folder:

```sh
pnpm add /path/to/minahilfaisal-sfu.github.io/projects/iat-806/project/explainer
```

(run `pnpm build` in the library first).

### Publishing to npm (when you're ready)

From `projects/iat-806/project/explainer/`:

1. The package scope (`@minahilfaisal-sfu`) must be your npm username or an npm organization you own. Rename it in `package.json` if not.
2. Bump `version` in `package.json`.
3. `npm login`, then `pnpm publish` (it builds first automatically).

After publishing, plain HTML sites can also load it from a CDN instead of copying the file:

```html
<script src="https://cdn.jsdelivr.net/npm/@minahilfaisal-sfu/explainer@0.1.0/dist/explainer.iife.js"></script>
```

## Telling the assistant about a page

In any page's HTML:

```html
<main data-explainer-context="This page shows my final project demo.">
<section data-explainer-ignore>Never sent to the AI</section>
```

All options (position, colours, Sage persona, starter questions and more) are documented in the library's README.
