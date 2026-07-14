/**
 * setTransformScripts send-dedup: the pipeline calls it on every render, so a
 * content-identical bundle must not cost an iframe message round-trip — but
 * changed scripts, failed sends, and cleanup must all re-send. The engine is
 * not initialized here; the iframe is faked and sendMessage stubbed.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TransformEngine } from './transform-engine.js';

function makeEngine() {
  const engine = new TransformEngine({} as any);
  (engine as any).iframe = { remove: () => {} };
  const sendMessage = vi.fn(async () => undefined);
  (engine as any).sendMessage = sendMessage;
  return { engine, sendMessage };
}

const SCRIPTS = {
  textTransform: 'function transformText(t){return t;}',
  domTransforms: ['function transformDOM(d){return d;}'],
};

describe('TransformEngine.setTransformScripts dedup', () => {
  let engine: TransformEngine;
  let sendMessage: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    ({ engine, sendMessage } = makeEngine());
  });

  it('skips the round-trip when the scripts are content-identical', async () => {
    await engine.setTransformScripts(SCRIPTS);
    // Same content, fresh objects — the render path rebuilds the bundle.
    await engine.setTransformScripts({
      textTransform: SCRIPTS.textTransform,
      domTransforms: [...SCRIPTS.domTransforms],
    });

    expect(sendMessage).toHaveBeenCalledTimes(1);
  });

  it('re-sends when any script content changes', async () => {
    await engine.setTransformScripts(SCRIPTS);
    await engine.setTransformScripts({
      ...SCRIPTS,
      domTransforms: ['function transformDOM(d){/*v2*/return d;}'],
    });
    await engine.setTransformScripts({ ...SCRIPTS, domTransforms: [] });

    expect(sendMessage).toHaveBeenCalledTimes(3);
  });

  it('is immune to caller mutation of the sent bundle', async () => {
    const bundle = { textTransform: 'a', domTransforms: ['b'] };
    await engine.setTransformScripts(bundle);
    bundle.domTransforms.push('c');

    await engine.setTransformScripts({ textTransform: 'a', domTransforms: ['b', 'c'] });

    // The mutated array must not be mistaken for what the iframe holds.
    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('a failed send is not recorded — the retry goes through', async () => {
    sendMessage.mockRejectedValueOnce(new Error('iframe gone'));

    await expect(engine.setTransformScripts(SCRIPTS)).rejects.toThrow('iframe gone');
    await engine.setTransformScripts(SCRIPTS);

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });

  it('cleanup drops the record, so a re-initialized engine re-sends', async () => {
    await engine.setTransformScripts(SCRIPTS);
    engine.cleanup();

    (engine as any).iframe = { remove: () => {} };
    await engine.setTransformScripts(SCRIPTS);

    expect(sendMessage).toHaveBeenCalledTimes(2);
  });
});
