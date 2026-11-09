/**
 * Responsive overflow check.
 *
 * Loads a page in headless Chrome and, at each target width, verifies that the
 * document does not scroll horizontally and that no element sticks out past the
 * viewport. Elements inside a deliberately scrollable container (tables, filter
 * strips) are ignored, because those are allowed to be wider than the screen.
 *
 * This catches the most common responsive regression — a flex child with a long
 * label or a fixed-width control pushing the whole page sideways — without
 * needing a full end-to-end framework.
 *
 * Usage:
 *   node scripts/check-responsive.mjs --url http://127.0.0.1:3100/design-system
 *   node scripts/check-responsive.mjs --url ... --widths 360,390,768,1024,1280
 *
 * Requires a locally installed Chrome or Edge (set CHROME_PATH to override).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DEFAULT_WIDTHS = [360, 390, 768, 1024, 1280, 1440];
const DEFAULT_HEIGHT = 900;

function parseArgs(argv) {
  const args = { url: 'http://127.0.0.1:3000/', widths: DEFAULT_WIDTHS, port: 9333 };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === '--url') args.url = argv[index + 1];
    if (token === '--port') args.port = Number(argv[index + 1]);
    if (token === '--widths') {
      args.widths = (argv[index + 1] ?? '')
        .split(',')
        .map((value) => Number(value.trim()))
        .filter((value) => Number.isFinite(value) && value > 0);
    }
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
    '/usr/bin/chromium-browser',
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
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Chrome DevTools endpoint did not become ready');
}

/** Minimal CDP client over the built-in WebSocket. */
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

const MEASURE_SCRIPT = `(() => {
  const viewportWidth = window.innerWidth;
  const offenders = [];

  const isInsideScrollable = (element) => {
    let node = element.parentElement;
    while (node && node !== document.body) {
      const overflowX = getComputedStyle(node).overflowX;
      if (overflowX === 'auto' || overflowX === 'scroll' || overflowX === 'hidden') return true;
      node = node.parentElement;
    }
    return false;
  };

  for (const element of document.querySelectorAll('body *')) {
    const rect = element.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) continue;
    if (rect.right <= viewportWidth + 1 && rect.left >= -1) continue;
    if (isInsideScrollable(element)) continue;

    offenders.push({
      tag: element.tagName.toLowerCase(),
      className: String(element.className ?? '').slice(0, 90),
      left: Math.round(rect.left),
      right: Math.round(rect.right),
    });
  }

  return {
    viewportWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
    offenders: offenders.slice(0, 6),
    offenderCount: offenders.length,
  };
})()`;

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const browser = findBrowser();
  const userDataDir = path.join(process.cwd(), '.local', 'chrome-responsive');

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

  let exitCode = 1;

  try {
    const version = await waitForEndpoint(args.port);
    console.info(`[responsive] ${version.Browser ?? 'browser'} using ${browser}`);

    const socket = new WebSocket(version.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      socket.addEventListener('open', resolve, { once: true });
      socket.addEventListener('error', reject, { once: true });
    });

    const cdp = new Cdp(socket);
    const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
    const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

    await cdp.send('Page.enable', {}, sessionId);

    let failed = false;

    for (const width of args.widths) {
      await cdp.send(
        'Emulation.setDeviceMetricsOverride',
        { width, height: DEFAULT_HEIGHT, deviceScaleFactor: 1, mobile: width < 768 },
        sessionId,
      );

      await cdp.send('Page.navigate', { url: args.url }, sessionId);
      await new Promise((resolve) => setTimeout(resolve, 900));

      const { result } = await cdp.send(
        'Runtime.evaluate',
        { expression: MEASURE_SCRIPT, returnByValue: true, awaitPromise: false },
        sessionId,
      );

      const measurement = result.value;
      const overflow = measurement.scrollWidth - measurement.viewportWidth > 1;
      const ok = !overflow && measurement.offenderCount === 0;

      console.info(
        `${ok ? 'PASS' : 'FAIL'}  ${String(width).padStart(4)}px  ` +
          `scrollWidth=${String(measurement.scrollWidth)} viewport=${String(measurement.viewportWidth)} ` +
          `offenders=${String(measurement.offenderCount)}`,
      );

      if (!ok) {
        failed = true;
        for (const offender of measurement.offenders) {
          console.info(
            `        <${offender.tag} class="${offender.className}"> left=${String(offender.left)} right=${String(offender.right)}`,
          );
        }
      }
    }

    exitCode = failed ? 1 : 0;
    socket.close();
  } finally {
    child.kill();
  }

  process.exit(exitCode);
}

main().catch((error) => {
  console.error('[responsive] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
