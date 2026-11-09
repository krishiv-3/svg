/**
 * Browser console and network check.
 *
 * Loads each URL in headless Chrome and reports console errors, uncaught page
 * errors and failed network requests. Used as part of visual QA so a missing
 * asset or a runtime warning cannot slip through a screenshot review.
 *
 * Usage:
 *   node scripts/check-console.mjs --url http://127.0.0.1:3100/design-system/visual
 *
 * Requires a locally installed Chrome or Edge (set CHROME_PATH to override).
 */
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';

function parseArgs(argv) {
  const args = { urls: [], port: 9800 };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = argv[index + 1];

    if (token === '--url' && next !== undefined) {
      args.urls.push(next);
      index += 1;
    } else if (token === '--port') {
      args.port = Number(next);
      index += 1;
    } else if (!token.startsWith('--')) {
      args.urls.push(token);
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
      const response = await fetch(`http://127.0.0.1:${String(port)}/json/version`);
      if (response.ok) return await response.json();
    } catch {
      // not ready yet
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }

  throw new Error('Chrome DevTools endpoint did not become ready');
}

class Cdp {
  #socket;
  #nextId = 1;
  #pending = new Map();
  events = [];

  constructor(socket) {
    this.#socket = socket;
    socket.addEventListener('message', (event) => {
      const message = JSON.parse(event.data);

      if (message.id !== undefined && this.#pending.has(message.id)) {
        const resolve = this.#pending.get(message.id);
        this.#pending.delete(message.id);
        resolve(message);
        return;
      }

      if (message.method) this.events.push(message);
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

  if (args.urls.length === 0) {
    console.error('Usage: node scripts/check-console.mjs --url <url> [--url <url>...]');
    process.exit(1);
  }

  const browser = findBrowser();
  const child = spawn(
    browser,
    [
      '--headless=new',
      '--disable-gpu',
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-crash-reporter',
      '--disable-breakpad',
      `--remote-debugging-port=${String(args.port)}`,
      `--user-data-dir=${path.join(process.cwd(), '.local', 'chrome-console')}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  let failures = 0;

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
    await cdp.send('Runtime.enable', {}, sessionId);
    await cdp.send('Log.enable', {}, sessionId);
    await cdp.send('Network.enable', {}, sessionId);

    for (const url of args.urls) {
      cdp.events.length = 0;

      await cdp.send('Page.navigate', { url }, sessionId);
      await new Promise((resolve) => setTimeout(resolve, 2_500));

      const consoleErrors = cdp.events
        .filter(
          (event) => event.method === 'Runtime.consoleAPICalled' && event.params.type === 'error',
        )
        .map((event) =>
          event.params.args.map((arg) => arg.value ?? arg.description ?? '').join(' '),
        );

      const exceptions = cdp.events
        .filter((event) => event.method === 'Runtime.exceptionThrown')
        .map((event) => event.params.exceptionDetails.text);

      const logErrors = cdp.events
        .filter(
          (event) => event.method === 'Log.entryAdded' && event.params.entry.level === 'error',
        )
        .map((event) => `${event.params.entry.text} ${event.params.entry.url ?? ''}`.trim());

      const failedRequests = cdp.events
        .filter((event) => event.method === 'Network.loadingFailed' && !event.params.canceled)
        .map((event) => `${event.params.type} ${event.params.errorText}`);

      const problems = [...consoleErrors, ...exceptions, ...logErrors, ...failedRequests];

      if (problems.length === 0) {
        console.info(`CLEAN  ${url}`);
      } else {
        failures += problems.length;
        console.info(`ISSUES ${url}`);
        for (const problem of problems.slice(0, 8)) console.info(`       ${problem}`);
      }
    }

    socket.close();
  } finally {
    child.kill();
  }

  console.info(
    failures === 0
      ? 'RESULT: no console or network errors'
      : `RESULT: ${String(failures)} issue(s)`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error('[console] failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
