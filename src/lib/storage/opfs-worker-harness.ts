/**
 * Test harness that runs the REAL opfs-worker.js script in-process.
 *
 * happy-dom has no functional Worker, so `FakeOPFSWorker` evaluates the raw
 * worker source (the same `?raw` import worker-manager.ts inlines into its
 * Blob) with an injected `self` whose postMessage feeds this instance's
 * onmessage. Installed via `vi.stubGlobal('Worker', FakeOPFSWorker)`, it lets
 * the unmodified chain OPFSSyncBackend → OPFSWorkerManager → opfs-worker.js
 * run against opfs-mock inside the unit suite.
 *
 * Caveat (documented, deliberate): messages pass by reference — there is no
 * structured clone, so buffer-transfer/detachment semantics are only proven
 * by the real-browser suite (backends.browser.test.ts). If opfs-worker.js
 * ever grows worker-only globals beyond self/navigator, this harness fails
 * loudly at evaluation time.
 */

import workerScript from './opfs-worker.js?raw';

type MessageHandler = (event: { data: unknown }) => void;

export class FakeOPFSWorker {
  onmessage: MessageHandler | null = null;
  onerror: ((event: unknown) => void) | null = null;
  onmessageerror: ((event: unknown) => void) | null = null;

  private workerHandler: MessageHandler | null = null;
  private terminated = false;

  constructor(_url: string) {
    const fakeSelf = {
      addEventListener: (type: string, handler: MessageHandler) => {
        if (type === 'message') this.workerHandler = handler;
      },
      postMessage: (response: unknown) => {
        if (this.terminated) return;
        // Deliver asynchronously like a real worker would.
        queueMicrotask(() => this.onmessage?.({ data: response }));
      },
    };

    // The worker script touches exactly two externals: self and navigator.
    // navigator resolves to the (opfs-mock-patched) global at call time.
    new Function('self', 'navigator', workerScript)(fakeSelf, globalThis.navigator);
  }

  postMessage(message: unknown): void {
    if (this.terminated || !this.workerHandler) return;
    const handler = this.workerHandler;
    queueMicrotask(() => handler({ data: message }));
  }

  terminate(): void {
    this.terminated = true;
  }
}
