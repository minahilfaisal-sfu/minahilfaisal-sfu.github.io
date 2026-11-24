import { Explainer } from './assistant.ts'
import type { AssistantConfig } from './types.ts'

export { Explainer } from './assistant.ts'
export { buildMessages, buildSystemPrompt } from './chat/prompt.ts'
export { parseReply } from './chat/schema.ts'
export { extractPage } from './context/page.ts'
export type * from './types.ts'

let instance: Explainer | undefined
let watching = false

/** Single-page apps change the URL without reloading; re-read the page when they do. */
const watchNavigation = () => {
  if (watching) return
  watching = true
  const onChange = () => setTimeout(() => instance?.refresh(), 50)
  for (const method of ['pushState', 'replaceState'] as const) {
    const original = history[method].bind(history)
    history[method] = (...args: Parameters<History['pushState']>) => {
      original(...args)
      onChange()
    }
  }
  window.addEventListener('popstate', onChange)
}

/**
 * Starts the assistant on this page. Safe to call from <head>: it waits for the
 * page to be parsed. Calling again replaces the previous instance.
 */
export const init = (config: AssistantConfig): Promise<Explainer> => {
  const start = () => {
    instance?.destroy()
    instance = new Explainer(config)
    watchNavigation()
    return instance
  }
  if (document.readyState === 'loading') {
    return new Promise((resolve) =>
      document.addEventListener('DOMContentLoaded', () => resolve(start()), { once: true }),
    )
  }
  return Promise.resolve(start())
}

/** The running assistant, if init() has finished. */
export const getInstance = (): Explainer | undefined => instance
