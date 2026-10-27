import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')

function setup() {
  let registration, opened = false, toggles = 0, now = 1000
  const listeners = new Map(), cleanups = [], timers = []
  class Element {
    constructor(blocked = false) { this.blocked = blocked; this.style = {} }
    closest() { return this.blocked ? this : null }
    setAttribute() {}
    remove() { this.removed = true }
  }
  const panel = new Element()
  panel.getBoundingClientRect = () => ({ width: 280 })
  panel.contains = el => el === panel
  const frame = new Element()
  frame.firstElementChild = panel
  frame.contains = () => true
  frame.hasAttribute = () => !opened
  frame.appendChild = el => { frame.backdrop = el }
  const document = {
    head: { appendChild() {} }, body: {},
    createElement: () => Object.assign(new Element(), { dataset: {} }),
    querySelector: s => s.includes('data-shell-bottom') ? frame : null,
    addEventListener: (type, fn) => listeners.set(type, fn),
    removeEventListener: (type, fn) => { if (listeners.get(type) === fn) listeners.delete(type) },
  }
  const FakeDate = { now: () => now }
  const sandbox = {
    document, Element, Date: FakeDate,
    getComputedStyle: () => ({ touchAction: 'auto' }),
    MutationObserver: class { observe() {} disconnect() {} },
    setTimeout: fn => { timers.push(fn); return timers.length },
    clearTimeout() {},
  }
  sandbox.window = { __ModuleLoader__: { load: r => registration = r }, matchMedia: () => ({ matches: true }) }
  vm.runInNewContext(source, sandbox)
  registration.factory(() => ({})).apply({
    effect: fn => cleanups.push(fn()), slots: { inject() {} },
    layout: { toggleSidebar() { opened = !opened; toggles++ } },
  })
  const chat = new Element()
  chat.parentElement = frame

  const ui = {
    listeners, frame, panel,
    get opened() { return opened },
    get toggles() { return toggles },
    get offset() { const m = /translateX\((-?[\d.]+)px\)/.exec(panel.style.transform || ''); return m ? Number(m[1]) : null },
    flush() { while (timers.length) timers.shift()() },
    /** Press at x, move through xs (each 50 ms apart), optionally pausing before lift. */
    drag(xs, { target = chat, blocked = false, dy = 0, pause = 0, lift = true, claimed = false } = {}) {
      target.blocked = blocked
      listeners.get('touchstart')({ target, touches: [{ identifier: 1, clientX: xs[0], clientY: 100 }] })
      for (const x of xs.slice(1)) {
        now += 50
        listeners.get('touchmove')({ touches: [{ identifier: 1, clientX: x, clientY: 100 + dy }], cancelable: true, defaultPrevented: claimed, preventDefault() {} })
      }
      now += pause
      if (lift) listeners.get('touchend')({})
    },
    cleanup: () => cleanups.forEach(fn => fn?.()),
  }
  return ui
}

test('drawer follows the finger before release', () => {
  const ui = setup()
  ui.drag([10, 30, 110], { lift: false })
  // Started closed at -224 (280 - 56 rail); dragged 80px past the lock point.
  assert.equal(ui.offset, -224 + 80)
  ui.listeners.get('touchend')({})
  ui.flush()
  ui.cleanup()
})

test('releasing past halfway snaps open, short drag snaps back closed', () => {
  const ui = setup()
  ui.drag([10, 30, 80, 140, 160], { pause: 300 })
  ui.flush()
  assert.equal(ui.opened, true)
  ui.drag([200, 180, 160], { pause: 300 })
  ui.flush()
  assert.equal(ui.opened, true, 'a short slow drag left must not close')
  ui.drag([200, 180, 40], { pause: 300 })
  ui.flush()
  assert.equal(ui.opened, false)
  ui.cleanup()
})

test('reversing direction without lifting closes again', () => {
  const ui = setup()
  ui.drag([10, 30, 120, 230, 120, 20], { pause: 300 })
  ui.flush()
  assert.equal(ui.opened, false)
  ui.cleanup()
})

test('a quick flick decides by direction even when short', () => {
  const ui = setup()
  ui.drag([10, 30, 90])
  ui.flush()
  assert.equal(ui.opened, true)
  ui.cleanup()
})

test('dragging the open drawer itself closes it', () => {
  const ui = setup()
  ui.drag([10, 30, 250], { pause: 300 })
  ui.flush()
  assert.equal(ui.opened, true)
  ui.drag([250, 230, 40], { target: ui.panel, pause: 300 })
  ui.flush()
  assert.equal(ui.opened, false)
  ui.cleanup()
})

test('backdrop tap dismisses; cleanup removes listeners', () => {
  const ui = setup()
  ui.drag([10, 30, 250], { pause: 300 })
  ui.flush()
  ui.listeners.get('click')({ target: ui.frame.backdrop, preventDefault() {}, stopPropagation() {} })
  assert.equal(ui.opened, true, 'the click synthesized right after a drag is swallowed')
  ui.drag([100], { pause: 1000 })
  ui.listeners.get('click')({ target: ui.frame.backdrop, preventDefault() {}, stopPropagation() {} })
  assert.equal(ui.opened, false)
  ui.cleanup()
  assert.equal(ui.listeners.size, 0)
  assert.equal(ui.frame.backdrop.removed, true)
})

test('record button, vertical scroll and claimed moves never move the drawer', () => {
  const ui = setup()
  ui.drag([10, 30, 250, 300], { blocked: true })
  ui.drag([10, 20, 40], { dy: 100 })
  ui.drag([10, 30, 250], { claimed: true })
  ui.flush()
  assert.equal(ui.toggles, 0)
  assert.equal(ui.offset, null)
  ui.cleanup()
})
