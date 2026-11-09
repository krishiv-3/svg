/**
 * Screenshot capture for design review.
 *
 * Uses the Chrome DevTools Protocol to set an exact viewport (Chrome's
 * `--window-size` is clamped on Windows, which silently clips narrow mobile
 * captures) and to capture either the viewport or the full page.
 *
 * Usage:
 *   node scripts/capture-screenshots.mjs --url http://127.0.0.1:3100/design-system \
 *     --out docs/images/design-system-desktop.png --width 1440 --height 1750
 *
 *   node scripts/capture-screenshots.mjs --url ... --out ... --width 390 --full
 *
 * Requires a locally installed Chrome or Edge (set CHROME_PATH to override).
 */
import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = {
    url: 'http://127.0.0.1:3000/',
    out: 'screenshot.png',
    width: 1440,
    height: 900,
    full: false,
    port: 9335,
    selector: '',
    click: '',
    hover: '',
    fill: '',
    fillB64: '',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === '--url') args.url = next;
    if (token === '--out') args.out = next;
    if (token === '--width') args.width = Number(next);
    if (token === '--height') args.height = Number(next);
    if (token === '--full') args.full = true;
    if (token === '--port') args.port = Number(next);
    if (token === '--selector') args.selector = next ?? '';
    if (token === '--click') args.click = next ?? '';
    if (token === '--hover') args.hover = next ?? '';
    if (token === '--fill') args.fill = next ?? '';
    if (token === '--fill-b64') args.fillB64 = next ?? '';
  }

  return args;
}

function findBrowser() {
  const candidates = [
    process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);

  for (const candidate of candidates) {
    if (existsSync(candidate)) return candidate;
  }

  throw new Error('No Chrome/Edge binary found. Set CHROME_PATH to the executable.');
}

async function waitForEndpoint(port, timeoutMs = 20_000) {
  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // not ready
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Chrome DevTools endpoint did not become ready');
}

class Cdp {
  #socket;
  #nextId = 1;
  #pending = new Map();

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);
      const resolver = message.id === undefined ? undefined : this.#pending.get(message.id);
      if (resolver !== undefined) {
        this.#pending.delete(message.id);
        resolver(message);
      }
    });
  }

  send(method, params = {}, sessionId) {
    const id = this.#nextId;
    this.#nextId += 1;

    return new Promise((resolve, reject) => {
      this.#pending.set(id, (message) => {
        if (message.error) reject(new Error(`${method}: ${message.error.message}`));
        else resolve(message.result);
      });

      this.#socket.send(
        JSON.stringify({ id, method, params, ...(sessionId ? { sessionId } : {}) }),
      );
    });
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browser = findBrowser();
  const userDataDir = path.join(process.cwd(), '.local', 'chrome-capture');

  const child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-crash-reporter',
      '--disable-breakpad',
      '--hide-scrollbars',
      `--remote-debugging-port=${String(args.port)}`,
      `--user-data-dir=${userDataDir}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    const version = await waitForEndpoint(args.port);
    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });

    const cdp = new Cdp(socket);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);
    await cdp.send(
      'Emulation.setDeviceMetricsOverride',
      {
        width: args.width,
        height: args.height,
        deviceScaleFactor: 1,
        mobile: args.width < 768,
      },
      sessionId,
    );

    await cdp.send('Page.navigate', { url: args.url }, sessionId);
    // Give fonts, images and the sticky CTA time to settle.
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Fragment navigation is unreliable with smooth scrolling, so scroll to the
    // anchor explicitly and instantly before capturing.
    const hash = new URL(args.url).hash.replace('#', '');
    if (hash !== '') {
      await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(() => {
            const target = document.getElementById(${JSON.stringify(hash)});
            if (!target) return false;
            target.scrollIntoView({ behavior: 'instant', block: 'start' });
            return true;
          })()`,
          returnByValue: true,
        },
        sessionId,
      );
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Fill fields the way React expects: set the native value, then dispatch the
    // events a real keystroke would produce. `--fill-b64` carries the same JSON
    // base64-encoded so shell quoting cannot mangle it.
    const fillJson =
      args.fillB64 !== ''
        ? Buffer.from(args.fillB64, 'base64').toString('utf8')
        : args.fill !== ''
          ? args.fill
          : '';

    if (fillJson !== '') {
      const fillValues = JSON.parse(fillJson);

      await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(() => {
            const values = ${JSON.stringify(fillValues)};
            let filled = 0;

            for (const [selector, value] of Object.entries(values)) {
              const element = document.querySelector(selector);
              if (!element) continue;

              const prototype =
                element instanceof HTMLTextAreaElement
                  ? HTMLTextAreaElement.prototype
                  : element instanceof HTMLSelectElement
                    ? HTMLSelectElement.prototype
                    : HTMLInputElement.prototype;

              const setter = Object.getOwnPropertyDescriptor(prototype, 'value')?.set;
              setter?.call(element, value);
              element.dispatchEvent(new Event('input', { bubbles: true }));
              element.dispatchEvent(new Event('change', { bubbles: true }));
              filled += 1;
            }

            return filled;
          })()`,
          returnByValue: true,
        },
        sessionId,
      );
      await new Promise((resolve) => setTimeout(resolve, 250));
    }

    // Optionally click a control (e.g. to capture an open menu or dialog).
    if (args.click !== '') {
      await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(() => {
            const target = document.querySelector(${JSON.stringify(args.click)});
            if (!target) return 'not-found';
            target.click();
            return 'clicked';
          })()`,
          returnByValue: true,
        },
        sessionId,
      );
      await new Promise((resolve) => setTimeout(resolve, 700));
    }

    // Optionally scroll a specific element into view.
    if (args.selector !== '') {
      await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(() => {
            const target = document.querySelector(${JSON.stringify(args.selector)});
            if (!target) return 'not-found';
            target.scrollIntoView({ behavior: 'instant', block: 'start' });
            return 'scrolled';
          })()`,
          returnByValue: true,
        },
        sessionId,
      );
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Optionally move the pointer over an element to capture a genuine hover state.
    if (args.hover !== '') {
      const { result } = await cdp.send(
        'Runtime.evaluate',
        {
          expression: `(() => {
            const target = document.querySelector(${JSON.stringify(args.hover)});
            if (!target) return null;
            const rect = target.getBoundingClientRect();
            return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
          })()`,
          returnByValue: true,
        },
        sessionId,
      );

      if (result.value !== null && result.value !== undefined) {
        await cdp.send(
          'Input.dispatchMouseEvent',
          { type: 'mouseMoved', x: result.value.x, y: result.value.y, button: 'none' },
          sessionId,
        );
        await new Promise((resolve) => setTimeout(resolve, 450));

        // Confirm the pointer really is over the element before we claim a hover state.
        const hovered = await cdp.send(
          'Runtime.evaluate',
          {
            expression: `(() => {
              const target = document.querySelector(${JSON.stringify(args.hover)});
              return target ? target.matches(':hover') : false;
            })()`,
            returnByValue: true,
          },
          sessionId,
        );

        console.info(`[capture] hover on ${args.hover}: ${String(hovered.result.value)}`);
      }
    }

    let clip;

    if (args.full) {
      const metrics = await cdp.send('Page.getLayoutMetrics', {}, sessionId);
      const width = Math.ceil(metrics.cssContentSize.width);
      const height = Math.ceil(metrics.cssContentSize.height);
      clip = { x: 0, y: 0, width, height, scale: 1 };
    }

    const shot = await cdp.send(
      'Page.captureScreenshot',
      {
        format: 'png',
        captureBeyondViewport: args.full,
        ...(clip === undefined ? {} : { clip }),
      },
      sessionId,
    );

    const target = path.resolve(args.out);
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, Buffer.from(shot.data, 'base64'));

    console.info(
      `[capture] ${args.width}px${args.full ? ' (full page)' : ''} → ${path.relative(process.cwd(), target)}`,
    );

    socket.close();
  } finally {
    child.kill();
  }
}

main().catch((error) => {
  console.error('[capture] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
