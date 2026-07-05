<!--
  Full-screen in-app host for the vendored bene reader, used in standalone
  (installed-PWA) display mode where a script-opened window would render without
  browser chrome and strand the user (see src/lib/reader/open-in-reader.ts). A
  host-owned close bar sits above the reader iframe; Escape also closes.
-->
<script lang="ts">
  import { t } from '$lib/i18n';
  import { X } from 'phosphor-svelte';

  let {
    url,
    onClose,
  }: {
    /** Resolved bene reader URL (same-origin). */
    url: string;
    onClose?: () => void;
  } = $props();

  let closeButton = $state<HTMLButtonElement | null>(null);

  // The overlay takes over the screen; put focus on its only control so
  // keyboard/switch users aren't left focused on the now-hidden app.
  $effect(() => {
    closeButton?.focus();
  });

  function handleKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') onClose?.();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="reader-overlay" role="dialog" aria-modal="true" aria-label={$t('Reader')}>
  <div class="reader-bar">
    <span class="reader-title">{$t('Reader')}</span>
    <button
      bind:this={closeButton}
      type="button"
      class="btn btn-icon reader-close"
      onclick={() => onClose?.()}
      aria-label={$t('Close reader')}
      title={$t('Close reader')}
    >
      <X size={18} aria-hidden="true" />
    </button>
  </div>
  <iframe class="reader-frame" src={url} title={$t('Reader')}></iframe>
</div>

<style>
  .reader-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    background: var(--color-surface-primary);
  }

  .reader-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-3);
    border-bottom: 1px solid var(--color-border-default);
    background: var(--color-bg-tertiary);
    /* Keep the bar clear of the iPhone notch/home-indicator areas when
       installed to the home screen. */
    padding-top: max(var(--space-1), env(safe-area-inset-top));
  }

  .reader-title {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .reader-frame {
    flex: 1;
    width: 100%;
    border: 0;
  }
</style>
