# Final Project — explainer

A drop-in AI assistant for any website. A site adds one script and a little context about itself, and a chat bubble appears on every page. Visitors ask about what they're looking at, and the assistant answers from the page's own content plus the site's context, highlighting the parts of the page it's talking about.

**Live demo:** every page of this website. Click the round icon in the bottom-right corner.

**Code:** [`explainer/`](explainer/) in this folder (`projects/iat-806/project/explainer/`).

---

## Research question

Do AI explanations anchored to what's on the page help non-technical people understand complex information, and does a playful persona (Sage) change engagement, understanding or trust compared with a plain assistant?

This connects to my thesis: the same library is meant to become the AI assistant in the D-SymBIA scenario comparison dashboard, and it puts into practice a guideline from my IAT 804 paper: explanations should point at the visualization they describe.

## What it does

- **Chat bubble on every page.** Its corner and offset are configurable.
- **Reads the page.** Headings, paragraphs, lists, tables, image alt text and canvases. It skips navigation, footers, forms, hidden content and anything marked `data-explainer-ignore`.
- **Knows the site.** The site owner gives a description, audience, glossary, list of pages and FAQ once.
- **Highlights its sources.** Answers outline the parts of the page they refer to; 📍 pins re-show them.
- **Follow-up chips and a text box.** Chips are suggested by the AI; links can only go to pages the site lists.
- **Follows you across pages.** The chat is kept for the browser tab and notes when you move to a new page.
- **Sage persona toggle.** The same facts, plus an ominous one-line omen and a darker, glowing theme.
- **Safe by design.** The page text is treated as data, never as instructions. Replies are checked before they're shown. Free OpenRouter models are reached through a small proxy that keeps the API key off the public site.

## How it works

```
Visitor asks ──► read the page (tagged blocks b0, b1, …)
             ──► build prompt: rules + site info + page data + recent chat
             ──► proxy (holds the key) ──► OpenRouter free model
             ──► check the JSON reply: drop invented highlights and links
             ──► show answer, highlights, follow-up chips (+ omen if Sage)
```

The model only explains; it can only point at blocks that really exist on the page.

## Built so far

| Part | Status |
|---|---|
| Widget: bubble, panel, chips, text box, Sage toggle, reset | ✅ |
| Page reading with ignore rules and a size budget | ✅ |
| Chat history across pages | ✅ |
| Highlights on page text | ✅ |
| Proxy for Cloudflare Workers / Vercel Edge | ✅ |
| Script-tag build + npm (ESM + types) build | ✅ |
| Unit tests (31) + browser test | ✅ |
| Deployed proxy for the live site | ⏳ |
| Area select ("Select" button, Part 2) | ⏳ shown as "coming soon" |
| Exact chart registration (bars/points) | 🔮 future work |
| Small user study (plain vs Sage) | ⏳ |

## Tech

TypeScript, Vite (library + single-file builds), Vitest with happy-dom, Biome, Shadow DOM for the widget, OpenRouter (`openrouter/free`) for the model, and a Cloudflare Worker proxy.

## History

The project started as **Rootbound**, a gamified dungeon-master game where an AI dragon, Sage, guides players through building farming towers. To fit the term, it became this library instead; Sage lives on as the optional persona.
