import { describe, it, expect, vi } from 'vitest';
import { SpineTransformPipeline } from '../spine-transform-pipeline.js';

const WS = 'ws-1';

/** Minimal fileStorage stub: serves the given files, throws for anything else. */
function fsWith(files: Record<string, string>) {
  return {
    readTextFile: vi.fn(async (_ws: string, path: string) => {
      if (path in files) return files[path];
      throw new Error(`not found: ${path}`);
    }),
  };
}

/** Pipeline plus its settings mock, for tests that reconfigure settings mid-test. */
function makePipelineWith(fileStorage: any, settings: any) {
  const settingsService = { loadEPUBSettings: vi.fn().mockResolvedValue(settings) };
  // extensionManager / blobURLManager / transformEngine are unused by loadTransformScripts.
  const pipeline = new SpineTransformPipeline(
    WS,
    fileStorage,
    null as any,
    null as any,
    null as any,
    settingsService as any
  );
  return { pipeline, settingsService };
}

function makePipeline(fileStorage: any, settings: any) {
  return makePipelineWith(fileStorage, settings).pipeline;
}

describe('SpineTransformPipeline.loadTransformScripts', () => {
  it('resolves a bare filename under SOURCE/scripts/', async () => {
    const fs = fsWith({
      'SOURCE/scripts/transformText.js': 'function transformText(t){return t;}',
    });
    const pipeline = makePipeline(fs, { text_transform: 'transformText.js', dom_transforms: [] });

    const scripts = await pipeline.loadTransformScripts();

    expect(scripts.textTransform).toContain('transformText');
    expect(fs.readTextFile).toHaveBeenCalledWith(WS, 'SOURCE/scripts/transformText.js');
  });

  it('accepts an already-prefixed SOURCE path without double-prefixing', async () => {
    // Regression: the default settings store a full path; the pipeline used to
    // prepend SOURCE/scripts/ again, producing an unresolvable path and an empty
    // transform (the first-load "transformText is not defined" error).
    const fs = fsWith({
      'SOURCE/scripts/transformText.js': 'function transformText(t){return t;}',
    });
    const pipeline = makePipeline(fs, {
      text_transform: 'SOURCE/scripts/transformText.js',
      dom_transforms: [],
    });

    const scripts = await pipeline.loadTransformScripts();

    expect(scripts.textTransform).toContain('transformText');
    expect(fs.readTextFile).toHaveBeenCalledWith(WS, 'SOURCE/scripts/transformText.js');
    expect(fs.readTextFile).not.toHaveBeenCalledWith(
      WS,
      'SOURCE/scripts/SOURCE/scripts/transformText.js'
    );
  });

  it('retries until a transiently-unavailable script becomes readable', async () => {
    // Mirrors the first-load race: the script file isn't written yet on the
    // first read, then appears.
    let calls = 0;
    const fs = {
      readTextFile: vi.fn(async () => {
        calls++;
        if (calls < 3) throw new Error('not written yet');
        return 'function transformText(t){return t.toUpperCase();}';
      }),
    };
    const pipeline = makePipeline(fs, { text_transform: 'transformText.js', dom_transforms: [] });

    const scripts = await pipeline.loadTransformScripts();

    expect(scripts.textTransform).toContain('toUpperCase');
    expect(calls).toBeGreaterThanOrEqual(3);
  });

  it('leaves the transform empty (no throw) when a script never becomes readable', async () => {
    const fs = fsWith({}); // nothing available
    const pipeline = makePipeline(fs, {
      text_transform: 'missing.js',
      dom_transforms: ['gone.js'],
    });

    const scripts = await pipeline.loadTransformScripts();

    // Empty rather than throwing — the engine passes input through unchanged.
    expect(scripts.textTransform).toBe('');
    expect(scripts.domTransforms).toEqual([]);
  });
});

describe('SpineTransformPipeline script cache', () => {
  const FILES = {
    'SOURCE/scripts/transformText.js': 'function transformText(t){return t;}',
    'SOURCE/scripts/transformDom.js': 'function transformDOM(d){return d;}',
  };
  const SETTINGS = {
    text_transform: 'SOURCE/scripts/transformText.js',
    dom_transforms: ['SOURCE/scripts/transformDom.js'],
  };

  it('serves repeat loads from cache but re-reads the settings every time', async () => {
    const fs = fsWith(FILES);
    const { pipeline, settingsService } = makePipelineWith(fs, SETTINGS);

    const first = await pipeline.loadTransformScripts();
    const second = await pipeline.loadTransformScripts();

    expect(second).toEqual(first);
    // Two script files, read once each — not once per load.
    expect(fs.readTextFile).toHaveBeenCalledTimes(2);
    // The settings are storage-fresh on every load (that's the built-in
    // invalidation for pipeline reconfiguration).
    expect(settingsService.loadEPUBSettings).toHaveBeenCalledTimes(2);
  });

  it('a changed transform list misses the cache', async () => {
    const fs = fsWith(FILES);
    const { pipeline, settingsService } = makePipelineWith(fs, SETTINGS);
    await pipeline.loadTransformScripts();

    // The user removed the DOM transform in Settings.
    settingsService.loadEPUBSettings.mockResolvedValue({
      text_transform: 'SOURCE/scripts/transformText.js',
      dom_transforms: [],
    });
    const scripts = await pipeline.loadTransformScripts();

    expect(scripts.domTransforms).toEqual([]);
    expect(scripts.textTransform).toContain('transformText');
  });

  it('invalidateScriptCache forces the next load to re-read script content', async () => {
    const files = { ...FILES };
    const fs = fsWith(files);
    const pipeline = makePipeline(fs, SETTINGS);
    await pipeline.loadTransformScripts();

    // The user edited the script in the spine editor: same settings, new content.
    files['SOURCE/scripts/transformDom.js'] = 'function transformDOM(d){/*v2*/return d;}';
    const stale = await pipeline.loadTransformScripts();
    expect(stale.domTransforms?.[0]).not.toContain('v2'); // cache hides it...

    pipeline.invalidateScriptCache();
    const fresh = await pipeline.loadTransformScripts();
    expect(fresh.domTransforms?.[0]).toContain('v2'); // ...until invalidated.
  });

  it('an incomplete load (unreadable script) is not cached — the next load retries', async () => {
    // The DOM transform is still being written on the first load (fresh unpack).
    const fs = {
      readTextFile: vi.fn(async (_ws: string, path: string) => {
        if (path.endsWith('transformText.js')) return FILES['SOURCE/scripts/transformText.js'];
        if (fs.domReadable) return FILES['SOURCE/scripts/transformDom.js'];
        throw new Error('not written yet');
      }),
      domReadable: false,
    };
    const pipeline = makePipeline(fs, SETTINGS);

    const incomplete = await pipeline.loadTransformScripts();
    expect(incomplete.domTransforms).toEqual([]);

    fs.domReadable = true;
    const recovered = await pipeline.loadTransformScripts();
    expect(recovered.domTransforms?.[0]).toContain('transformDOM');
  });
});
