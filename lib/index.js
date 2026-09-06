//#region host half
/**
 * Mobile optimizations plugin, node half. Serves the OS username/hostname of
 * the machine this harness runs on as one tiny JSON route, so the browser
 * half can render "<user>@<hostname>" in the sidebar brand-name slot.
 *
 * The settings-modal CSS fix is purely client-side (see lib/client.js).
 */
import os from 'node:os'

function readIdentity() {
  let username = 'unknown'
  try {
    username = os.userInfo().username || 'unknown'
  } catch {
    // os.userInfo() can throw when there is no passwd entry (containers).
  }
  if (username === 'unknown') {
    username = process.env.USER || process.env.LOGNAME || 'unknown'
  }
  let hostname = 'unknown'
  try {
    hostname = os.hostname() || 'unknown'
  } catch {
    // leave the fallback
  }
  return { username, hostname }
}

export function apply(ctx) {
  ctx.webServer.register({
    kind: 'exact',
    path: '/mobile-optimizations/hostid',
    handler(_req, res) {
      res.writeHead(200, {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-cache',
      })
      res.end(JSON.stringify(readIdentity()))
    },
  })
}

export const inject = ['webServer']
//#endregion
