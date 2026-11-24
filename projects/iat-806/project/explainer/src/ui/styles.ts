import type { Position } from '../types.ts'

export const positionVars = (position: Position, x: number, y: number): string => {
  const [vertical, horizontal] = position.split('-') as ['top' | 'bottom', 'left' | 'right']
  return [
    `--pa-${vertical}: ${y}px`,
    `--pa-${horizontal}: ${x}px`,
    `--pa-${vertical === 'top' ? 'bottom' : 'top'}: auto`,
    `--pa-${horizontal === 'left' ? 'right' : 'left'}: auto`,
    `--pa-origin: ${vertical} ${horizontal}`,
    `--pa-panel-${vertical}: ${y + 68}px`,
  ].join(';')
}

/** All widget styles. Lives inside a Shadow DOM, so the site's CSS can't reach it. */
export const WIDGET_CSS = `
:host {
  all: initial;
  --pa-accent: #3d6b4f;
  --pa-bg: #ffffff;
  --pa-fg: #1f2421;
  --pa-muted: #5f6b64;
  --pa-border: #dfe5e1;
  --pa-soft: #f3f6f4;
  --pa-user: #e6efe9;
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 15px;
  line-height: 1.5;
  color: var(--pa-fg);
}
@media (prefers-color-scheme: dark) {
  :host {
    --pa-bg: #1b201d;
    --pa-fg: #e8ece9;
    --pa-muted: #a6b1aa;
    --pa-border: #333b36;
    --pa-soft: #242a26;
    --pa-user: #2c3a31;
  }
}
:host([data-persona="sage"]) {
  --pa-accent: #4fae6a;
  --pa-bg: #0f1411;
  --pa-fg: #dfeee2;
  --pa-muted: #93a897;
  --pa-border: #26352b;
  --pa-soft: #162019;
  --pa-user: #1d2c22;
}
* { box-sizing: border-box; }
button { font: inherit; cursor: pointer; }
:focus-visible { outline: 2px solid var(--pa-accent); outline-offset: 2px; }

.launcher {
  position: fixed;
  top: var(--pa-top); bottom: var(--pa-bottom); left: var(--pa-left); right: var(--pa-right);
  width: 56px; height: 56px; border-radius: 50%;
  border: none; background: var(--pa-accent); color: #fff;
  display: grid; place-items: center;
  box-shadow: 0 6px 20px rgba(0,0,0,0.22);
  z-index: 2147483646;
  transition: transform 0.15s;
}
.launcher:hover { transform: scale(1.06); }
.launcher svg { width: 26px; height: 26px; }

.panel {
  position: fixed;
  top: var(--pa-panel-top, auto); bottom: var(--pa-panel-bottom, auto);
  left: var(--pa-left); right: var(--pa-right);
  width: min(380px, calc(100vw - 24px));
  height: min(560px, calc(100vh - 110px));
  background: var(--pa-bg);
  border: 1px solid var(--pa-border);
  border-radius: 16px;
  box-shadow: 0 16px 48px rgba(0,0,0,0.25);
  display: flex; flex-direction: column;
  overflow: hidden;
  z-index: 2147483647;
  transform-origin: var(--pa-origin);
}
.panel[hidden] { display: none; }
@media (prefers-reduced-motion: no-preference) {
  .panel { animation: pa-open 0.16s ease-out; }
}
@keyframes pa-open { from { opacity: 0; transform: scale(0.96); } }
@media (max-width: 480px) {
  .panel { left: 12px; right: 12px; width: auto; }
}

.header {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px;
  border-bottom: 1px solid var(--pa-border);
}
.header-text { flex: 1; min-width: 0; }
.title { font-weight: 600; margin: 0; font-size: 15px; }
.page-name { color: var(--pa-muted); font-size: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.icon-btn { background: none; border: none; color: var(--pa-muted); padding: 4px; border-radius: 6px; display: grid; place-items: center; }
.icon-btn:hover { background: var(--pa-soft); color: var(--pa-fg); }
.icon-btn svg { width: 18px; height: 18px; }

.toggle { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--pa-muted); background: none; border: none; padding: 2px; }
.switch { width: 30px; height: 18px; border-radius: 9px; background: var(--pa-border); position: relative; transition: background 0.2s; }
.switch::after { content: ""; position: absolute; top: 2px; left: 2px; width: 14px; height: 14px; border-radius: 50%; background: #fff; transition: transform 0.2s; }
.toggle[aria-checked="true"] .switch { background: var(--pa-accent); }
.toggle[aria-checked="true"] .switch::after { transform: translateX(12px); }

.messages { flex: 1; overflow-y: auto; padding: 14px; display: flex; flex-direction: column; gap: 12px; }
.msg { max-width: 92%; }
.msg.user { align-self: flex-end; background: var(--pa-user); padding: 8px 12px; border-radius: 14px 14px 4px 14px; }
.msg.assistant { align-self: flex-start; }
.msg p { margin: 0 0 6px; }
.msg ul { margin: 4px 0 6px; padding-left: 18px; }
.omen { font-family: Georgia, "Times New Roman", serif; font-style: italic; color: var(--pa-accent); margin-bottom: 6px; letter-spacing: 0.01em; }
.page-switch { align-self: center; font-size: 12px; color: var(--pa-muted); background: var(--pa-soft); padding: 2px 10px; border-radius: 10px; }
.notice { font-size: 12px; color: var(--pa-muted); }
.error { color: #b3261e; }
.pins { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px; }
.pin { font-size: 12px; border: 1px dashed var(--pa-accent); color: var(--pa-fg); background: none; border-radius: 10px; padding: 2px 8px; }
.thinking { color: var(--pa-muted); font-size: 13px; }
@media (prefers-reduced-motion: no-preference) {
  .thinking::after { content: "…"; animation: pa-dots 1.2s steps(3) infinite; display: inline-block; width: 1em; overflow: hidden; vertical-align: bottom; }
}
@keyframes pa-dots { from { width: 0; } }

.chips { display: flex; flex-wrap: wrap; gap: 6px; padding: 0 14px 10px; }
.chip { border: 1px solid var(--pa-border); background: var(--pa-soft); color: var(--pa-fg); border-radius: 14px; padding: 5px 11px; font-size: 13px; text-align: left; }
.chip:hover { border-color: var(--pa-accent); }
.chip.link::after { content: " →"; }

.composer { display: flex; gap: 6px; padding: 10px; border-top: 1px solid var(--pa-border); align-items: center; }
.composer input { flex: 1; min-width: 0; font: inherit; padding: 9px 12px; border-radius: 10px; border: 1px solid var(--pa-border); background: var(--pa-bg); color: var(--pa-fg); }
.send { border: none; border-radius: 10px; background: var(--pa-accent); color: #fff; padding: 9px 12px; display: grid; place-items: center; }
.send:disabled { opacity: 0.5; cursor: default; }
.send svg { width: 18px; height: 18px; }
.select { border: 1px solid var(--pa-border); background: none; color: var(--pa-muted); border-radius: 10px; padding: 8px; display: grid; place-items: center; }
.select svg { width: 18px; height: 18px; }
.select:disabled { opacity: 0.45; cursor: not-allowed; }
.privacy { font-size: 11px; color: var(--pa-muted); padding: 0 12px 8px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }
`

export const ICONS = {
  chat: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  close:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
  send: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  select:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="3 3" aria-hidden="true"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>',
  reset:
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/></svg>',
}
