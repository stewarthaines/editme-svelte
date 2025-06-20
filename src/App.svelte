<script lang="ts">
  import svelteLogo from './assets/svelte.svg?raw'
  import viteLogo from './assets/vite.svg?raw'
  import Counter from './lib/Counter.svelte'
</script>

<main>
  <div>
    <a class="logo" href="https://vite.dev" target="_blank" rel="noreferrer">
      <img src={`data:image/svg+xml,${encodeURIComponent(viteLogo)}`} class="logo" alt="Vite Logo" />
      <!-- {@html viteLogo} -->
    </a>
    <a class="logo" href="https://svelte.dev" target="_blank" rel="noreferrer">
      <img src={`data:image/svg+xml,${encodeURIComponent(svelteLogo)}`} class="logo svelte" alt="Svelte Logo" />
      <!-- {@html svelteLogo} -->
    </a>
  </div>
  <h1>Vite + Svelte</h1>

  <div class="card">
    <Counter />
  </div>

  <p>
    Check out <a href="https://github.com/sveltejs/kit#readme" target="_blank" rel="noreferrer">SvelteKit</a>, the official Svelte app framework powered by Vite!
  </p>

  <p class="read-the-docs">
    Click on the Vite and Svelte logos to learn more. or this.
  </p>
</main>

<style>
  .logo {
    height: 6em;
    padding: 1.5em;
    will-change: filter;
    transition: filter 300ms;
    display: inline-block;
  }
  .logo:hover {
    filter: drop-shadow(0 0 2em #646cffaa);
  }
  .logo.svelte:hover {
    filter: drop-shadow(0 0 2em #ff3e00aa);
  }
  .read-the-docs {
    color: #888;
  }
</style>
