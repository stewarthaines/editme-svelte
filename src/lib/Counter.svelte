<script lang="ts">
  let count: number = $state(0);
  const increment = () => {
    count += 1;
  };
</script>

<button onclick={increment}>
  <!-- i18n-ignore: starter demo component -->
  count is {count}
</button>
