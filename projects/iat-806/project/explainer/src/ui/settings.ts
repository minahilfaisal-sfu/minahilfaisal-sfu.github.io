import type { KeyStore } from '../chat/keyStore.ts'
import { el } from './dom.ts'

export const KEYS_URL = 'https://openrouter.ai/keys'

type SettingsOptions = {
  doc: Document
  keys: KeyStore
  defaultModel: string
  /** Called after Save (with the new key) or Remove (with undefined). */
  onChange: (key: string | undefined) => void
  onBack: () => void
}

const masked = (key: string) => `…${key.slice(-4)}`

/**
 * The ⚙️ settings view: where visitors add their own OpenRouter key.
 * Returns the view and a refresh() to sync it with what's stored.
 */
export const createSettingsView = (opts: SettingsOptions) => {
  const { doc, keys } = opts
  const form = el(doc, 'form', { class: 'settings', 'aria-label': 'Assistant settings' })
  form.hidden = true

  form.appendChild(el(doc, 'p', { class: 'settings-title' }, 'Settings'))
  form.appendChild(
    el(
      doc,
      'p',
      { class: 'notice' },
      'This assistant runs on OpenRouter. Add your own API key to use it; free models cost nothing.',
    ),
  )

  const keyLabel = el(doc, 'label', { class: 'field' })
  keyLabel.appendChild(el(doc, 'span', {}, 'OpenRouter API key'))
  const keyInput = el(doc, 'input', {
    type: 'password',
    name: 'apiKey',
    placeholder: 'sk-or-v1-…',
    autocomplete: 'off',
    spellcheck: 'false',
  })
  keyLabel.appendChild(keyInput)
  form.appendChild(keyLabel)

  const getKey = el(
    doc,
    'a',
    { class: 'get-key', href: KEYS_URL, target: '_blank', rel: 'noopener noreferrer' },
    'Get a free key →',
  )
  form.appendChild(getKey)

  const modelLabel = el(doc, 'label', { class: 'field' })
  modelLabel.appendChild(el(doc, 'span', {}, 'Model'))
  const modelInput = el(doc, 'input', {
    type: 'text',
    name: 'model',
    placeholder: opts.defaultModel,
    autocomplete: 'off',
    spellcheck: 'false',
  })
  modelLabel.appendChild(modelInput)
  form.appendChild(modelLabel)

  const rememberLabel = el(doc, 'label', { class: 'check' })
  const remember = el(doc, 'input', { type: 'checkbox', name: 'remember' })
  rememberLabel.append(remember, el(doc, 'span', {}, 'Remember on this device'))
  form.appendChild(rememberLabel)

  form.appendChild(
    el(
      doc,
      'p',
      { class: 'notice small' },
      'Your key stays in this browser and is only sent to OpenRouter. Without "remember", it is forgotten when you close this tab.',
    ),
  )

  const status = el(doc, 'p', { class: 'settings-status', 'aria-live': 'polite' })

  const row = el(doc, 'div', { class: 'settings-row' })
  const save = el(doc, 'button', { class: 'primary', type: 'submit' }, 'Save')
  const remove = el(doc, 'button', { class: 'secondary', type: 'button' }, 'Remove key')
  const back = el(doc, 'button', { class: 'secondary', type: 'button' }, 'Back to chat')
  row.append(save, remove, back)
  form.append(row, status)

  const refresh = () => {
    const key = keys.key
    keyInput.value = ''
    keyInput.placeholder = key ? `Saved key ${masked(key)}, type to replace` : 'sk-or-v1-…'
    modelInput.value = keys.model ?? ''
    remember.checked = keys.remembered
    remove.disabled = !key
    status.textContent = ''
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const typed = keyInput.value.trim()
    const key = typed || keys.key
    if (!key) {
      status.textContent = 'Paste a key first.'
      keyInput.focus()
      return
    }
    keys.save(key, remember.checked, modelInput.value)
    refresh()
    status.textContent = `Saved key ${masked(key)}.`
    opts.onChange(key)
  })

  remove.addEventListener('click', () => {
    keys.clearKey()
    refresh()
    status.textContent = 'Key removed from this browser.'
    opts.onChange(undefined)
  })

  back.addEventListener('click', () => opts.onBack())

  refresh()
  return { view: form, refresh, focus: () => keyInput.focus() }
}
