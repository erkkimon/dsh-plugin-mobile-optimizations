import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../lib/client.js', import.meta.url), 'utf8')
function setup() {
  let registration, opened = false, toggles = 0
  const listeners = new Map(), cleanups = []
  class Element {
    constructor(blocked = false) { this.blocked = blocked }
    closest() { return this.blocked ? this : null }
    setAttribute() {}
    remove() { this.removed = true }
  }
  const frame = new Element()
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
  const sandbox = { document, Element, Date, getComputedStyle: () => ({ touchAction: 'auto' }), MutationObserver: class { observe() {} disconnect() {} } }
  sandbox.window = { __ModuleLoader__: { load: r => registration = r }, matchMedia: () => ({ matches: true }) }
  vm.runInNewContext(source, sandbox)
  registration.factory(() => ({})).apply({
    effect: fn => cleanups.push(fn()), slots: { inject() {} },
    layout: { toggleSidebar() { opened = !opened; toggles++ } },
  })
  const target = new Element()
  target.parentElement = frame
  function swipe(dx, dy = 0, blocked = false, extra = {}) {
    target.blocked = blocked
    listeners.get('touchstart')({ target, touches: [{ identifier: 1, clientX: 100, clientY: 100 }], ...extra })
    listeners.get('touchmove')({ touches: [{ identifier: 1, clientX: 100 + dx, clientY: 100 + dy }], cancelable: true, preventDefault() {} })
  }
  return { swipe, listeners, frame, get opened() { return opened }, get toggles() { return toggles }, cleanup: () => cleanups.forEach(fn => fn?.()) }
}

test('horizontal swipes open and close; backdrop dismisses', () => {
  const ui = setup()
  ui.swipe(80)
  assert.equal(ui.opened, true)
  ui.swipe(-80)
  assert.equal(ui.opened, false)
  ui.swipe(80)
  ui.listeners.get('click')({ target: ui.frame.backdrop, preventDefault() {}, stopPropagation() {} })
  assert.equal(ui.opened, false)
  ui.cleanup()
  assert.equal(ui.listeners.size, 0)
  assert.equal(ui.frame.backdrop.removed, true)
})

test('record/control origins, vertical scrolling, short and claimed gestures do not toggle', () => {
  const ui = setup()
  ui.swipe(100, 0, true)
  ui.swipe(20)
  ui.swipe(70, 100)
  ui.swipe(100, 0, false, { defaultPrevented: true })
  ui.swipe(100, 0, false, { touches: [{}, {}] })
  assert.equal(ui.toggles, 0)
  ui.cleanup()
})
