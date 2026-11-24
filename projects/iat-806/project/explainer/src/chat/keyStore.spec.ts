import { beforeEach, describe, expect, it } from 'vitest'
import { KeyStore } from './keyStore.ts'

describe('KeyStore', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  const store = () => new KeyStore({ local: localStorage, session: sessionStorage })

  it('keeps the key for the tab only unless "remember" is on', () => {
    const keys = store()
    keys.save(' sk-or-v1-abc ', false)
    expect(keys.key).toBe('sk-or-v1-abc')
    expect(keys.remembered).toBe(false)
    expect(localStorage.length).toBe(0)

    keys.save('sk-or-v1-xyz', true, 'meta/llama:free')
    expect(store().key).toBe('sk-or-v1-xyz')
    expect(store().remembered).toBe(true)
    expect(store().model).toBe('meta/llama:free')
    expect(sessionStorage.length).toBe(0)
  })

  it('removes the key everywhere', () => {
    const keys = store()
    keys.save('sk-or-v1-abc', true)
    keys.clearKey()
    expect(store().key).toBeUndefined()
  })

  it('still works in memory when storage is blocked', () => {
    const keys = new KeyStore({})
    keys.save('sk-or-v1-abc', true)
    expect(keys.key).toBe('sk-or-v1-abc')
  })
})
