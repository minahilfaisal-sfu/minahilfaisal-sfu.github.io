# Final Project — Progress Update

**Project:** explainer, a drop-in AI assistant that explains any web page
**Live demo:** https://minahilfaisal-sfu.github.io/projects/iat-806/project/index.html (click the chat icon, bottom-right)

## What's done

- **Started from a public template:** Lokalise's open-source `shared-ts-libs`
  - Dropped the ~40 company libraries it came with
  - Kept only the base skeleton: TypeScript, build, testing and code-style tools
- **Built the library on top of it**
  - Reads the page a visitor is on (headings, text, lists, tables, images)
  - Sends it with the visitor's question to a free AI model through the **OpenRouter API**
  - Checks every reply before showing it (no made-up links or highlights)
- **Built the chat UI**
  - Chat bubble on every page; its corner is configurable
  - Answers, follow-up question chips and a text box
  - Highlights the part of the page an answer comes from
  - Chat follows you from page to page
- **Added it to my website** with one script, so it runs on every page
- **36 automated tests**, plus a test in a real browser with a fake AI

## Features added along the way

- **Sage persona:** a tired, sarcastic dragon who never gives a straight answer, only hints and "it's right there, can you not read?"
- **⚙️ Settings button:** visitors add their own free OpenRouter key
  - Added because a public site can't safely hide my key
  - Their key stays in their browser; no server needed
- **Renamed** from "page assistant" to **explainer**
- **Moved** from a game idea (*Rootbound*) to a reusable library, to fit the term

## Still to do

- **Manual testing:** different pages, browsers, phone, keyboard only
- **Real AI testing:** check that answers and Sage's personality hold up on real free models
- **Code review and bug fixing**
- **Pending features:**
  - "Select" button: drag a box to ask about part of the page
  - Pinpoint exact bars and points in charts
- ***Optional***:
  - **Small user study:** plain assistant vs Sage (straight answers vs hints)
  - **Publishing:** publish to npm so anyone can install it

## Issues and unknowns

- **Free AI models are unpredictable:** they can be slow, ignore the reply format, or answer when Sage shouldn't
- **Free limit:** 50 questions a day per OpenRouter account
- **Asking visitors for a key:** many won't have one
- **Can't see inside drawings:** p5.js sketches are pixels, so it can only explain the text around them
- **Saved keys** are only as safe as the website they're saved on

## Questions

**Publishing**
- What's the best way to publish this so others can use it: npm, a CDN, or both?
- Should it live in its own repo (it's currently inside my website repo)?
- Anything to watch for with the template's license (Apache-2.0) and crediting it?

**Screen selection (the "Select" button)**
- Does elicitJS already let users drag to select an area of the page?
- How does it capture what's inside: the page's elements, a screenshot, or both?
- How does it handle canvas drawings like p5.js sketches?
- Could explainer use or build on elicitJS for this, instead of writing it from scratch?

## Final Items

1. Test it by hand with my own key and fix what breaks
2. Tune the instructions if the free models misbehave

**Optional**:
1. Run a short session with a few classmates: plain vs Sage
2. Add the on-screen context selection button
3. Record a demo for users
