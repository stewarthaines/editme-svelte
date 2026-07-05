<!--
  Walking-skeleton panel UI: proves the host wiring end-to-end (init handle →
  OPF manifest listing → insert at cursor). Session 2 replaces the body with the
  wavesurfer region editor per process/AUDIO_CLIP_PLUGIN_DESIGN.md.
-->
<script lang="ts">
  import { dirHandle } from './store.js';
  import { t } from './i18n.js';
  import { listAudioItems, readTextFile } from './opf.js';
  import type { AudioManifestItem, InsertMessage } from './types.js';

  let audioItems = $state<AudioManifestItem[]>([]);
  let selectedHref = $state('');
  let status = $state<'waiting' | 'loading' | 'ready' | 'error'>('waiting');
  let errorMessage = $state('');

  // Load the manifest's audio list whenever the host (re-)hands the workspace
  // handle. $dirHandle is null until the first `init` arrives.
  $effect(() => {
    const handle = $dirHandle;
    if (!handle) {
      status = 'waiting';
      return;
    }
    status = 'loading';
    listAudioItems(handle)
      .then(items => {
        audioItems = items;
        if (!items.some(i => i.href === selectedHref)) {
          selectedHref = items[0]?.href ?? '';
        }
        status = 'ready';
      })
      .catch((err: unknown) => {
        errorMessage = err instanceof Error ? err.message : String(err);
        status = 'error';
      });
  });

  // The project's directive template: SOURCE/settings.json → audio_clip_template,
  // the same setting the built-in editor uses (exposed in EPUB Settings), read
  // fresh at insert time so mid-session settings changes apply. Read-only here —
  // settings writes stay host-side. Falls back to the core default.
  const DEFAULT_TEMPLATE = ':clip[<label>]{src=<href> begin=<begin> end=<end>}';

  async function loadTemplate(handle: FileSystemDirectoryHandle): Promise<string> {
    try {
      const settings = JSON.parse(await readTextFile(handle, 'SOURCE/settings.json'));
      if (typeof settings.audio_clip_template === 'string' && settings.audio_clip_template) {
        return settings.audio_clip_template;
      }
    } catch {
      // No/unreadable settings.json — the default template applies.
    }
    return DEFAULT_TEMPLATE;
  }

  // Minimal placeholder substitution (mirrors the core formatClipDirective just
  // enough for the skeleton's fixed test clip; session 2 brings real times/labels).
  function formatDirective(template: string, href: string): string {
    return template
      .replace(/<href>|<src>/g, href)
      .replace(/<begin>/g, '0:00:00.00')
      .replace(/<end>/g, '0:00:05.00')
      .replace(/<label>/g, '');
  }

  async function insertTestClip(): Promise<void> {
    const handle = $dirHandle;
    if (!selectedHref || !handle) return;
    const template = await loadTemplate(handle);
    const message: InsertMessage = {
      type: 'insert',
      content: formatDirective(template, selectedHref),
    };
    window.parent.postMessage(message, window.origin);
  }
</script>

<div class="panel">
  {#if status === 'waiting' || status === 'loading'}
    <p class="status">{$t('Loading audio files…')}</p>
  {:else if status === 'error'}
    <p class="status error">{$t('Could not read the project: {error}', { error: errorMessage })}</p>
  {:else if audioItems.length === 0}
    <p class="status">{$t('No audio files in this project.')}</p>
  {:else}
    <label class="field">
      <span class="field-label">{$t('Audio file')}</span>
      <select bind:value={selectedHref}>
        {#each audioItems as item (item.href)}
          <option value={item.href}>{item.id}</option>
        {/each}
      </select>
    </label>
    <button type="button" class="btn btn-sm" onclick={insertTestClip}>
      {$t('Insert test clip')}
    </button>
  {/if}
</div>

<style>
  .panel {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-3);
  }

  .status {
    margin: 0;
    color: var(--color-text-secondary);
  }

  .status.error {
    color: var(--color-error-text);
  }

  .field {
    display: flex;
    align-items: center;
    gap: var(--space-2);
  }

  .field-label {
    color: var(--color-text-secondary);
  }
</style>
