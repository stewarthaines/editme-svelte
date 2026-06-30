<script lang="ts">
  // A line-number gutter overlaying the left edge of a non-wrapping <textarea>, scroll-
  // synced to it. The host textarea must be no-wrap (one logical line = one visual row) so
  // the numbers stay aligned. Mirrors the editor's mono font/size/line-height and top
  // padding; the gutter width comes from the inherited `--gutter-digits` custom property
  // (set by the parent so the textarea can pad its text by the same amount).
  let {
    lineCount = 1,
    target = null,
  }: {
    lineCount?: number;
    target?: HTMLTextAreaElement | null;
  } = $props();

  const numbers = $derived(
    Array.from({ length: Math.max(lineCount, 1) }, (_, i) => i + 1).join('\n')
  );

  // Follow the textarea's vertical scroll (horizontal is ignored — the gutter is fixed).
  let scrollY = $state(0);
  $effect(() => {
    const el = target;
    if (!el) return;
    scrollY = el.scrollTop;
    const onScroll = () => (scrollY = el.scrollTop);
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  });
</script>

<div class="line-gutter" aria-hidden="true">
  <pre class="line-gutter-numbers" style="transform: translateY({-scrollY}px)">{numbers}</pre>
</div>

<style>
  .line-gutter {
    position: absolute;
    top: 0;
    bottom: 0;
    left: 1px; /* sit just inside the textarea's 1px border */
    width: calc(var(--gutter-digits, 2) * 1ch + 2 * var(--space-2));
    overflow: hidden;
    box-sizing: border-box;
    padding-right: var(--space-2);
    /* No divider/background tint — blend seamlessly into the white editor. */
    background: var(--color-bg-primary);
    color: var(--color-text-secondary);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
    line-height: var(--leading-relaxed);
    text-align: right;
    user-select: none;
    pointer-events: none;
    z-index: 1;
  }

  .line-gutter-numbers {
    margin: 0;
    padding: var(--space-3) 0 0; /* match the textarea's top padding */
    /* Reset the global `pre` styling (global.css) so the numbers sit on the gutter's
       own white background, not the grey `pre` panel. */
    background: none;
    border-radius: 0;
    overflow: visible;
    font: inherit;
    line-height: inherit;
    white-space: pre;
  }
</style>
