<script lang="ts">
  import { diffLines } from 'diff';
  import { t } from '../../i18n';

  let { current, incoming }: { current: string; incoming: string } = $props();

  type DiffLine = { kind: 'add' | 'remove' | 'context'; sign: string; text: string };

  // Flatten jsdiff line changes into per-line rows for rendering. jsdiff groups
  // runs of added/removed/unchanged lines; each part's `value` may hold several
  // newline-separated lines (and usually a trailing newline we drop).
  const lines = $derived.by<DiffLine[]>(() => {
    const rows: DiffLine[] = [];
    for (const part of diffLines(current ?? '', incoming ?? '')) {
      const kind: DiffLine['kind'] = part.added ? 'add' : part.removed ? 'remove' : 'context';
      const sign = kind === 'add' ? '+' : kind === 'remove' ? '-' : ' ';
      const partLines = part.value.split('\n');
      if (partLines.length > 1 && partLines[partLines.length - 1] === '') partLines.pop();
      for (const text of partLines) rows.push({ kind, sign, text });
    }
    return rows;
  });
</script>

<div class="diff" role="group" aria-label={$t('Text differences')}>
  {#each lines as line, i (i)}
    <div class="diff-line diff-{line.kind}">
      <span class="diff-sign" aria-hidden="true">{line.sign}</span><span class="diff-text"
        >{line.text || ' '}</span
      >
    </div>
  {/each}
  {#if lines.length === 0}
    <p class="diff-empty">{''}</p>
  {/if}
</div>

<style>
  .diff {
    display: flex;
    flex-direction: column;
    overflow: auto;
    font-family: var(--font-mono, monospace);
    font-size: var(--text-xs);
    line-height: 1.5;
    background-color: var(--color-surface-primary);
  }

  .diff-line {
    display: flex;
    gap: var(--space-2);
    padding-inline: var(--space-2);
    white-space: pre-wrap;
    word-break: break-word;
  }

  .diff-sign {
    flex-shrink: 0;
    inline-size: 1ch;
    color: var(--color-text-tertiary);
    user-select: none;
  }

  .diff-text {
    flex: 1;
  }

  .diff-add {
    background-color: var(--color-success-bg, rgb(0 128 0 / 0.12));
    color: var(--color-success-text, inherit);
  }

  .diff-remove {
    background-color: var(--color-error-bg, rgb(200 0 0 / 0.12));
    color: var(--color-error-text, inherit);
  }

  .diff-context {
    color: var(--color-text-secondary);
  }
</style>
