// Smoke check for lib/client.js — the browser bundle the DSH Web GUI loads.
//
// The bundle is not a module: it is a script whose top level calls
// window.__ModuleLoader__.load({ id, factory }). This test materializes it the
// way the DSH module loader does (set the globals, import, call factory) and
// fails loudly on any ReferenceError or contract drift.
//
// WHY this exists: a ReferenceError while the factory body runs does not fail
// this plugin alone — the loader reports "failed to import loader entry" and
// the whole Web GUI plugin set stays down. Expensive to diagnose from the
// browser, free to catch here.
//
// Unlike dsh-plugin-voice-mode, this bundle calls injectCss() while the
// factory body runs, so the stylesheet IS observable at materialization and
// is asserted below. apply() still needs a real Cordis ctx and stays out of
// scope.
import test from 'node:test'
import assert from 'node:assert/strict'

const CSS_TAG_ID = 'dsh-mobile-optimizations/narrow-modal.css'

/** Minimal DOM stub covering exactly what injectCss() touches. */
function stubDocument() {
	const appended = []
	globalThis.document = {
		head: { appendChild: (el) => appended.push(el) },
		createElement: (tag) => ({ tag, dataset: {}, textContent: '' }),
		// injectCss guards on this selector; match on the data attribute it sets
		// so the idempotency assertion below exercises the real guard.
		querySelector: (sel) =>
			sel.includes(CSS_TAG_ID)
				? appended.find((el) => el.dataset.pluginCss === CSS_TAG_ID) ?? null
				: null,
	}
	globalThis.window = globalThis
	return appended
}

test('client bundle materializes and exposes the plugin contract', async () => {
	const appended = stubDocument()

	let registration
	globalThis.__ModuleLoader__ = { load: (value) => { registration = value } }

	await import('../lib/client.js')

	assert.ok(registration, 'bundle did not call __ModuleLoader__.load')
	// Must match package.json's name: the loader keys the roster entry by this id.
	assert.equal(registration.id, 'dsh-mobile-optimizations')

	const required = []
	const exported = registration.factory((name) => {
		required.push(name)
		return { createElement() {} }
	})

	// `react` is the only module resolvable while the factory body runs.
	assert.deepEqual(required, ['react'])
	assert.equal(typeof exported.apply, 'function')
	// Cordis service injection — distinct from package.json's dsh.client.inject,
	// which is the loader-level package list.
	assert.deepEqual(exported.inject, ['slots'])

	// injectCss() runs at materialization, so the stylesheet is already in <head>.
	const style = appended.find((el) => el.dataset.pluginCss === CSS_TAG_ID)
	assert.ok(style, 'narrow-modal stylesheet was not appended to <head>')
	assert.match(style.textContent, /aria-modal/, 'stylesheet lost its modal selectors')

	// The guard exists because a second materialization must not double-inject.
	registration.factory(() => ({ createElement() {} }))
	const styles = appended.filter((el) => el.dataset.pluginCss === CSS_TAG_ID)
	assert.equal(styles.length, 1, 'stylesheet injected twice; the guard is broken')
})
