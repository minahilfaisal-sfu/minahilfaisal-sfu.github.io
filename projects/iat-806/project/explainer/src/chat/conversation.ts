import type { ChatTurn, PersonaName } from '../types.ts'

const MAX_STORED_TURNS = 30

type Stored = { turns: ChatTurn[]; persona?: PersonaName; open?: boolean }

/**
 * Chat history for one browser tab, kept in sessionStorage so it follows the
 * visitor from page to page. Works (in memory only) when storage is blocked.
 */
export class Conversation {
  private state: Stored = { turns: [] }
  private readonly key: string
  private readonly storage: Storage | undefined

  constructor(siteName: string, storage?: Storage) {
    this.key = `explainer:${siteName}`
    this.storage = storage
    try {
      const raw = this.storage?.getItem(this.key)
      if (raw) {
        const parsed = JSON.parse(raw) as Stored
        if (Array.isArray(parsed.turns)) this.state = parsed
      }
    } catch {
      // Storage blocked or corrupted: start fresh
    }
  }

  get turns(): readonly ChatTurn[] {
    return this.state.turns
  }

  get persona(): PersonaName | undefined {
    return this.state.persona
  }

  set persona(value: PersonaName | undefined) {
    this.state.persona = value
    this.save()
  }

  get open(): boolean {
    return this.state.open === true
  }

  set open(value: boolean) {
    this.state.open = value
    this.save()
  }

  add(turn: ChatTurn) {
    this.state.turns = [...this.state.turns, turn].slice(-MAX_STORED_TURNS)
    this.save()
  }

  clear() {
    this.state.turns = []
    this.save()
  }

  private save() {
    try {
      this.storage?.setItem(this.key, JSON.stringify(this.state))
    } catch {
      // Storage full or blocked: keep working in memory
    }
  }
}
