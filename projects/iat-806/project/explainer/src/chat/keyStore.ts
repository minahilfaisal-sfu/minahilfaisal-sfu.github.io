/**
 * Keeps the visitor's own OpenRouter key and model choice in their browser.
 * "Remember" uses localStorage (stays after closing the browser); otherwise
 * sessionStorage (cleared when the tab closes). Nothing is sent anywhere
 * except to OpenRouter when a question is asked.
 */
const KEY = 'explainer:openrouter-key'
const MODEL = 'explainer:model'

type Stores = { local?: Storage; session?: Storage }

const read = (store: Storage | undefined, name: string): string | undefined => {
  try {
    return store?.getItem(name) ?? undefined
  } catch {
    return undefined
  }
}

const write = (store: Storage | undefined, name: string, value: string | undefined) => {
  try {
    if (value) store?.setItem(name, value)
    else store?.removeItem(name)
  } catch {
    // Storage blocked: the key just won't be remembered
  }
}

export class KeyStore {
  private memoryKey: string | undefined
  private readonly stores: Stores

  constructor(stores: Stores) {
    this.stores = stores
  }

  get key(): string | undefined {
    return read(this.stores.session, KEY) ?? read(this.stores.local, KEY) ?? this.memoryKey
  }

  /** True when the key is saved in localStorage (kept between visits). */
  get remembered(): boolean {
    return !!read(this.stores.local, KEY)
  }

  get model(): string | undefined {
    return read(this.stores.local, MODEL)
  }

  save(key: string, remember: boolean, model?: string) {
    const clean = key.trim()
    this.clearKey()
    this.memoryKey = clean || undefined
    write(remember ? this.stores.local : this.stores.session, KEY, clean || undefined)
    write(this.stores.local, MODEL, model?.trim() || undefined)
  }

  clearKey() {
    this.memoryKey = undefined
    write(this.stores.local, KEY, undefined)
    write(this.stores.session, KEY, undefined)
  }
}
