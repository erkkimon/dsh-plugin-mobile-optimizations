# dsh-mobile-optimizations

Mobile UX optimizations for the [DeepSeek Harness](https://github.com/deepseek-ai/dsh) Web GUI. Bundles small quality-of-life fixes that are most useful on phones and tablets:

1. **Responsive settings modal** — on viewports narrower than 700 px the settings dialog collapses its nav rail to an icon-only column with full-height tap targets, tightens content padding, and caps height against `100dvh` so mobile browser chrome never pushes controls off-screen. The floating mask margins stay intact so tap-outside-to-dismiss still works.
2. **Full-screen model picker** — on viewports narrower than 700 px the composer's model list opens as a full-width, almost full-height sheet over a dimmed backdrop. Model names are left-aligned and truncated at the end, so the start of every name — and short names — is always visible. Tap the backdrop to dismiss.
3. **Sidebar host identity** — replaces the sidebar brand wordmark with `<user>@<hostname>` of the machine running the harness, fetched from a tiny node-side JSON route. Handy when you run multiple harness instances across hosts.

## Install

Link the plugin into your profile:

```jsonc
// ~/.dsh/profiles/web/package.json
{
  "dependencies": {
    "dsh-mobile-optimizations": "link:~/.dsh/plugins/dsh-mobile-optimizations"
  }
}
```

Then add a row to your profile's `cordis.patch.yml`:

```yaml
- insert:
    - id: mobile-optimizations
      name: 'dsh-mobile-optimizations'
```

Restart the service (e.g. `systemctl --user restart dsh-web.service`) and hard-refresh the page.

## How it works

- **Settings modal CSS** is injected by the client bundle at materialization time. Selectors anchor on `div[role="dialog"][aria-modal="true"]:has(> nav)` so they only match the settings panel and survive CSS-module hashing. Verified against `@deepseek-ai/dsh-client-ui-settings-general` 0.1.1-rc.2.
- **Model picker sheet** is CSS on the picker's model-list pane (`[role="menu"][aria-busy]:has([role="group"])`, the only menu with `aria-busy`), plus a `::before` backdrop on the picker root. The composer button row's `container-type` is dropped while the sheet is open, since it would otherwise confine the `position: fixed` sheet. A capture-phase click handler closes the picker via its trigger when the backdrop is tapped. Verified against `@deepseek-ai/dsh-client-ui-model-selection` 0.1.2-rc.1.
- **Host identity** is served at `GET /mobile-optimizations/hostid` by the node half (`lib/index.js`). The client component (`HostBrandName`) fetches it once on mount and occupies the `sidebar.brand.name` slot at priority `-100` to shadow the shipped wordmark.

## License

MIT
