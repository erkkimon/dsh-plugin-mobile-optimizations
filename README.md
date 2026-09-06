# dsh-mobile-optimizations

Mobile UX optimizations for the [DeepSeek Harness](https://github.com/deepseek-ai/dsh) Web GUI. Bundles two small quality-of-life fixes that are most useful on phones and tablets:

1. **Responsive settings modal** — on viewports narrower than 700 px the settings dialog collapses its nav rail to an icon-only column with full-height tap targets, tightens content padding, and caps height against `100dvh` so mobile browser chrome never pushes controls off-screen. The floating mask margins stay intact so tap-outside-to-dismiss still works.
2. **Sidebar host identity** — replaces the sidebar brand wordmark with `<user>@<hostname>` of the machine running the harness, fetched from a tiny node-side JSON route. Handy when you run multiple harness instances across hosts.

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
- **Host identity** is served at `GET /mobile-optimizations/hostid` by the node half (`lib/index.js`). The client component (`HostBrandName`) fetches it once on mount and occupies the `sidebar.brand.name` slot at priority `-100` to shadow the shipped wordmark.

## License

MIT
