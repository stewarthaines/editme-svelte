<script lang="ts">
  let { name, tail = 15 }: { name: string; tail?: number } = $props();

  // Middle-ellipsis: the head ellipsizes while the tail (extension + trailing
  // chars, e.g. the date that distinguishes builds) stays pinned and readable.
  const headText = $derived(
    name.length > tail ? name.slice(0, name.length - tail) : name,
  );
  const tailText = $derived(
    name.length > tail ? name.slice(name.length - tail) : '',
  );
</script>

<!-- prettier-ignore -->
<span class="filename" title={name}><span class="filename-head">{headText}</span><span class="filename-tail">{tailText}</span></span>

<style>
  .filename {
    display: flex;
    flex: 1 1 auto;
    min-width: 0;
    overflow: hidden;
    font-weight: 500;
  }

  .filename-head {
    overflow: hidden;
    text-overflow: ellipsis;
    /* `pre` (not `nowrap`) so a space at the head/tail split isn't collapsed,
       e.g. "Haines - 2026-06-02.epub" rather than "Haines -2026-06-02.epub". */
    white-space: pre;
  }

  .filename-tail {
    white-space: nowrap;
    flex-shrink: 0;
  }
</style>
