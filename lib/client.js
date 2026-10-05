window.__ModuleLoader__.load({
	id: "dsh-mobile-optimizations",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		var react = require("react");

		//#region narrow-viewport settings modal CSS
		/*
		* The shipped settings modal (ui-settings-general) is a fixed 800px
		* flex row: a 188px section nav rail plus the content column. Its
		* max-width (100vw - 48px) shrinks the panel on phones, but the nav
		* never yields, so below ~700px the content column is squeezed to a
		* sliver and the settings controls become untappable.
		*
		* This stylesheet switches the modal to a compact presentation under
		* 700px viewport width: the nav rail collapses to a centred icon-only
		* column with full-height tap targets, the title shrinks instead of
		* overflowing, and the content padding tightens. The panel keeps its
		* floating margins, so the mask — which already closes the modal on
		* click in the shipped code — stays visible and tappable around it.
		*
		* Selectors avoid the hashed CSS-module classes: the settings panel
		* is the only aria-modal dialog whose first child is a <nav>, so
		* :has(> nav) anchors the rules to it. Verified against
		* @deepseek-ai/dsh-client-ui-settings-general 0.1.1-rc.2.
		*/
		const MENU = '[role="menu"][aria-busy]:has([role="group"])';
		const ROOT = 'div:has(> [role="menu"][aria-busy] [role="group"])';
		const css = [
			"@media (max-width: 700px) {",
			/* Panel: use the viewport, keep a 16px tappable mask margin, cap
			* against the dynamic viewport height so mobile browser chrome
			* never pushes content off-screen. */
			'div[role="dialog"][aria-modal="true"]:has(> nav) {',
			"width: calc(100vw - 32px);",
			"max-height: calc(100dvh - 32px);",
			"border-radius: 16px;",
			"}",
			/* Nav rail: icon-only column. */
			'div[role="dialog"][aria-modal="true"]:has(> nav) > nav {',
			"width: 60px;",
			"padding: 16px 6px 0;",
			"gap: 8px;",
			"}",
			/* Title stays mounted (the dialog's aria-labelledby points at it)
			* but shrinks to fit the rail. */
			'div[role="dialog"][aria-modal="true"]:has(> nav) > nav > div:first-child {',
			"padding: 0 4px;",
			"font-size: 13px;",
			"line-height: 18px;",
			"white-space: nowrap;",
			"overflow: hidden;",
			"text-overflow: ellipsis;",
			"}",
			/* Section buttons: centred icon, label hidden, finger-sized target. */
			'div[role="dialog"][aria-modal="true"]:has(> nav) > nav button {',
			"justify-content: center;",
			"height: 44px;",
			"padding: 9px 0;",
			"}",
			'div[role="dialog"][aria-modal="true"]:has(> nav) > nav button span {',
			"display: none;",
			"}",
			/* Content column: reclaim the wide desktop padding. */
			'div[role="dialog"][aria-modal="true"]:has(> nav) > div > div:last-child {',
			"padding: 0 12px 16px;",
			"}",
			/* Composer model picker (ui-model-selection): the shipped menu is
			* width:max-content anchored to the trigger's RIGHT edge, so on a
			* phone a long model name widens it past the left screen edge and
			* the beginnings of every name - and short names entirely - are cut
			* off. The model-list pane (the one with role=group sections; the
			* small Model/Effort root pane stays a popover) becomes a
			* near-full-screen sheet: full width, almost full height, names
			* left-aligned and truncated at the END. The picker root's ::before
			* is a dimmed backdrop under it; tapping it closes the picker (see
			* attachModelSheetDismiss). The backdrop must be in the composer's
			* stacking context like the menu, so it cannot be a body overlay.
			* The picker menu is the only role=menu carrying aria-busy
			* (verified against dsh-client-ui-model-selection 0.1.2-rc.1). */
			MENU + " {",
			"position: fixed !important;",
			"top: max(56px, env(safe-area-inset-top, 0px) + 40px) !important;",
			"bottom: max(16px, env(safe-area-inset-bottom, 0px) + 8px) !important;",
			"left: 8px !important;",
			"right: 8px !important;",
			"width: auto !important;",
			"min-width: 0 !important;",
			"max-width: none !important;",
			"max-height: none !important;",
			"z-index: 1000 !important;",
			"}",
			/* The scrolling model list fills the sheet. */
			MENU + ' > div:has(> [role="group"]) { flex: 1 1 auto; }',
			/* Rows: exactly sheet width (never wider), finger-sized. */
			MENU + ' [role="menuitemradio"] {',
			"width: 100% !important;",
			"min-width: 0 !important;",
			"min-height: 44px;",
			"}",
			/* Name: start always visible, overflow ellipsised at the end. */
			MENU + ' [role="menuitemradio"] > span:first-child,',
			MENU + ' [role="menuitemradio"] > span:first-child > span {',
			"min-width: 0;",
			"max-width: 100%;",
			"text-align: left;",
			"direction: ltr;",
			"overflow: hidden;",
			"white-space: nowrap;",
			"text-overflow: ellipsis;",
			"}",
			/* The composer's button row is a container-query container
			* (container-type: inline-size), and that implies layout
			* containment, which makes the row the containing block of
			* position:fixed descendants: the "fixed" sheet would be clipped to
			* the row. Drop the container while the sheet is open
			* (row > trailing > picker root > menu). */
			'div:has(> div > div > [role="menu"][aria-busy] [role="group"]) {',
			"container-type: normal !important;",
			"}",
			/* Backdrop (no nested :has: "child menu that contains a group"). */
			ROOT + "::before {",
			'content: "";',
			"position: fixed;",
			"inset: 0;",
			"z-index: 999;",
			"background: rgba(0, 0, 0, 0.5);",
			"}",
			"}"
		].join("");
		const cssTagId = "dsh-mobile-optimizations/narrow-modal.css";
		function injectCss() {
			if (typeof document === "undefined") return;
			if (document.querySelector("style[data-plugin-css=" + JSON.stringify(cssTagId) + "]") !== null) return;
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-mobile-optimizations";
			tag.dataset.pluginCss = cssTagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		injectCss();
		//#endregion

		//#region HostBrandName
		/**
		* Render "<user>@<hostname>" of the harness host in place of the brand
		* wordmark. Fetches the identity once on mount; renders nothing while
		* loading and "unknown host" if the route fails.
		*/
		function HostBrandName() {
			var pair = react.useState(null);
			var text = pair[0];
			var setText = pair[1];
			react.useEffect(function () {
				var cancelled = false;
				fetch("/mobile-optimizations/hostid").then(function (res) {
					if (!res.ok) throw new Error("http " + res.status);
					return res.json();
				}).then(function (result) {
					if (cancelled) return;
					if (result && typeof result.username === "string" && typeof result.hostname === "string") {
						setText(result.username + "@" + result.hostname);
					} else {
						setText("unknown host");
					}
				}).catch(function () {
					if (!cancelled) setText("unknown host");
				});
				return function () { cancelled = true; };
			}, []);
			if (text === null) return null;
			return react.createElement("span", null, text);
		}
		//#endregion

		//#region model sheet dismiss
		/**
		* The sheet backdrop is the picker root's ::before, so a tap on it
		* targets the root — "inside" for the shipped outside-click check,
		* which therefore never closes. Catch that tap and toggle the picker
		* shut through its own trigger button. If the blur handler already
		* closed it, the menu is gone and this is a no-op.
		*/
		function attachModelSheetDismiss(ctx) {
			if (typeof document === "undefined") return;
			function onClick(event) {
				var root = event.target;
				if (!(root instanceof Element) || !root.matches(ROOT)) return;
				var menu = root.querySelector(':scope > [role="menu"]');
				if (menu === null) return;
				var r = menu.getBoundingClientRect();
				if (event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom) return;
				var trigger = root.querySelector(':scope > button[aria-haspopup="menu"][aria-expanded="true"]');
				event.preventDefault();
				event.stopPropagation();
				if (trigger !== null) trigger.click();
			}
			document.addEventListener("click", onClick, true);
			ctx.effect(function () {
				return function () { document.removeEventListener("click", onClick, true); };
			});
		}
		//#endregion

		/**
		* Occupy the sidebar brand-name slot. The shipped wordmark registers at
		* priority 0; single slots elect the lowest priority, so -100 shadows it.
		*/
		function apply(ctx) {
			attachModelSheetDismiss(ctx);
			ctx.slots.inject("sidebar.brand.name", function* () {
				yield ctx.slots.register({ name: "sidebar.brand.name", priority: -100 }, HostBrandName);
			});
		}
		exports.apply = apply;
		exports.inject = ["slots"];
		return module.exports;
	}
});
