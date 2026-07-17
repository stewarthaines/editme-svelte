<script lang="ts">
  import { t } from '../../i18n';
  import PaneHeader from '$lib/components/layout/PaneHeader.svelte';
</script>

<div class="about-pane">
  <PaneHeader>
    <span class="pane-title">{$t('Welcome')}</span>
  </PaneHeader>
  <div class="about-pane-body">
    <p class="about-tagline">{$t('Make ebooks anyone can read — right now in your browser.')}</p>

    <!-- One EPUB, made here, opening across many Reading Systems. Decorative
         line-art; the caption below carries the meaning for screen readers. -->
    <figure class="reach-figure">
      <svg
        class="reach-graphic"
        viewBox="0 0 460 210"
        role="img"
        aria-label={$t('One EPUB made with the editor, opening on phones, tablets, and e-readers.')}
      >
        <defs>
          <marker
            id="about-arrowhead"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path class="arrowhead" d="M0 0 L10 5 L0 10 z" />
          </marker>
        </defs>

        <!-- Source: an EPUB made with this editor -->
        <g class="g-source">
          <rect x="26" y="64" width="86" height="104" rx="8" />
          <line x1="45" y1="64" x2="45" y2="168" />
          <line x1="60" y1="92" x2="96" y2="92" />
          <line x1="60" y1="108" x2="96" y2="108" />
          <line x1="60" y1="124" x2="84" y2="124" />
        </g>

        <!-- Fan-out arrows from the source to each device -->
        <g class="g-arrows">
          <path d="M120 116 C 220 116, 250 46, 332 46" marker-end="url(#about-arrowhead)" />
          <path d="M120 116 C 230 116, 250 118, 330 118" marker-end="url(#about-arrowhead)" />
          <path d="M120 116 C 220 116, 250 177, 326 177" marker-end="url(#about-arrowhead)" />
        </g>

        <!-- Reading Systems: phone, tablet, laptop, stacked with even gaps. -->
        <g class="g-devices">
          <!-- phone: y 11–81 -->
          <rect x="340" y="11" width="44" height="70" rx="8" />
          <line x1="356" y1="19" x2="368" y2="19" />
          <!-- tablet: y 95–141 (14px gap above) -->
          <rect x="338" y="95" width="66" height="46" rx="6" />
          <!-- laptop: y 155–199 (14px gap above) -->
          <rect x="334" y="155" width="72" height="44" rx="3" />
          <path d="M326 201 L414 201" />
        </g>
      </svg>
      <figcaption class="reach-caption">
        {$t('Make it once — read it anywhere: phones, tablets, e-readers, and apps.')}
      </figcaption>
    </figure>

    <section class="about-section">
      <h2>{$t('What is an EPUB?')}</h2>
      <p>
        {$t(
          "EPUB is the open standard for digital books: a self-contained file of text, styles, and images that any Reading System app can open. Because the format is open, your book can be read anywhere. It reflows to fit any screen and adapts to each reader's chosen size, font, and contrast."
        )}
      </p>
      <p>
        {$t(
          "This editor turns plain text into a valid EPUB. You write in simple, readable source; it's packaged into a standards-compliant book."
        )}
      </p>
    </section>

    <section class="about-section">
      <h2>{$t('What is different about a SEED EPUB?')}</h2>
      <p>
        {$t(
          'The book you build here is a valid, self-contained EPUB that also carries its own editable source (bundled as SEED.zip) inside it.'
        )}
      </p>

      <!-- A literal miniature of the Projects view, and around it the files its
           buttons put on the user's disk. The sidebar's Package EPUB button
           (drawn as the real button, icon-only like the collapsed sidebar) makes
           the EPUB+SEED.zip below — the dashed arc back is "Import from file",
           the one file that returns. The three generate buttons in the details
           pane each point a straight arrow at their file in the one-way group,
           labeled with the button text. Decorative; the aria-label and caption
           carry the meaning for screen readers. -->
      <figure class="reach-figure">
        <svg
          class="reach-graphic seed-graphic"
          viewBox="0 0 420 288"
          role="img"
          aria-label={$t(
            'SEED.html packages an EPUB that carries its own SEED.zip source and can return to the app for further editing, plus three one-way outputs: a PDF, an EPUB without SEED, and a READ.html web book.'
          )}
        >
          <defs>
            <marker
              id="seed-arrowhead"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path class="arrowhead" d="M0 0 L10 5 L0 10 z" />
            </marker>
          </defs>

          <!-- The app, drawn literally as the Projects view: sidebar with the
               Package EPUB button at its foot (icon-only, as when the sidebar is
               collapsed), the projects list with the current project highlighted,
               and the details pane with the three generate buttons. -->
          <g class="g-app">
            <rect x="24" y="24" width="132" height="124" rx="8" />
            <line x1="24" y1="42" x2="156" y2="42" />
            <text x="31" y="37" class="lbl small">SEED.html</text>
            <!-- sidebar + pane dividers -->
            <line x1="48" y1="42" x2="48" y2="148" />
            <line x1="96" y1="42" x2="96" y2="148" />
            <!-- sidebar nav items -->
            <line x1="30" y1="56" x2="42" y2="56" />
            <line x1="30" y1="68" x2="42" y2="68" />
            <line x1="30" y1="80" x2="42" y2="80" />
            <!-- projects list: the current project highlighted, two more below -->
            <rect class="highlight" x="52" y="52" width="40" height="14" rx="2" />
            <line x1="56" y1="78" x2="88" y2="78" />
            <line x1="56" y1="92" x2="88" y2="92" />
            <!-- details pane: metadata lines above the three generate buttons -->
            <line x1="102" y1="56" x2="148" y2="56" />
            <line x1="102" y1="68" x2="140" y2="68" />
          </g>

          <!-- The Package EPUB button at the sidebar's foot (real button, real
               tokens, dark-mode tonal treatment — see the pkg-btn styles) -->
          <g class="g-pkg-btn">
            <rect class="pkg-btn" x="29" y="127" width="14" height="14" rx="3" />
            <!-- Phosphor 'Package' (regular), from the app's icon subset. -->
            <path
              class="pkg-btn-icon"
              transform="translate(31 129) scale(0.0391)"
              d="M223.68,66.15,135.68,18a15.88,15.88,0,0,0-15.36,0l-88,48.17a16,16,0,0,0-8.32,14v95.64a16,16,0,0,0,8.32,14l88,48.17a15.88,15.88,0,0,0,15.36,0l88-48.17a16,16,0,0,0,8.32-14V80.18A16,16,0,0,0,223.68,66.15ZM128,32l80.34,44-29.77,16.3-80.35-44ZM128,120,47.66,76l33.9-18.56,80.34,44ZM40,90l80,43.78v85.79L40,175.82Zm176,85.78h0l-80,43.79V133.82l32-17.51V152a8,8,0,0,0,16,0V107.55L216,90v85.77Z"
            />
          </g>

          <!-- The three generate buttons in the details pane -->
          <g class="g-app">
            <rect x="100" y="86" width="48" height="14" rx="3" />
            <rect x="100" y="106" width="48" height="14" rx="3" />
            <rect x="100" y="126" width="48" height="14" rx="3" />
          </g>

          <!-- EPUB round-trip, below the sidebar button: publish down (solid),
               import from file back in (dashed) — opposing arcs, a cycle -->
          <g class="g-arrows">
            <path d="M44 148 C 32 164, 32 180, 44 194" marker-end="url(#seed-arrowhead)" />
            <path
              class="return"
              d="M76 196 C 88 180, 88 164, 76 150"
              marker-end="url(#seed-arrowhead)"
            />
          </g>

          <!-- One-way outputs: a straight arrow from each button to its file -->
          <g class="g-arrows">
            <path d="M156 93 L242 62" marker-end="url(#seed-arrowhead)" />
            <path d="M156 113 L242 142" marker-end="url(#seed-arrowhead)" />
            <path d="M156 133 L242 216" marker-end="url(#seed-arrowhead)" />
          </g>

          <!-- The round-trip file on disk: an EPUB with its SEED.zip source inside -->
          <g class="g-book">
            <rect x="40" y="196" width="76" height="50" rx="5" />
            <line x1="52" y1="196" x2="52" y2="246" />
            <rect class="inner" x="74" y="209" width="30" height="20" rx="3" />
            <text x="78" y="266" class="lbl small center">EPUB+SEED.zip</text>
          </g>

          <!-- The one-way group, in project-details button order -->
          <g class="g-group">
            <rect class="group" x="250" y="26" width="156" height="240" rx="10" />
          </g>

          <!-- Generate PDF: a portrait page with a folded corner -->
          <g class="g-dest">
            <path d="M313 36 L343 36 L355 48 L355 90 L313 90 Z" />
            <path d="M343 36 L343 48 L355 48" />
            <text x="328" y="104" class="lbl small center">{$t('Generate PDF')}</text>
          </g>

          <!-- Package EPUB without SEED: the same book shape, nothing inside -->
          <g class="g-dest">
            <rect x="298" y="122" width="60" height="44" rx="5" />
            <line x1="310" y1="122" x2="310" y2="166" />
            <text x="328" y="180" class="lbl small center">{$t('Package EPUB without SEED')}</text>
          </g>

          <!-- Package as READ.html: a browser window carrying the book -->
          <g class="g-dest">
            <rect x="302" y="198" width="52" height="38" rx="4" />
            <line x1="302" y1="208" x2="354" y2="208" />
            <line x1="307" y1="203" x2="311" y2="203" />
            <line x1="312" y1="218" x2="344" y2="218" />
            <line x1="312" y1="226" x2="338" y2="226" />
            <text x="328" y="250" class="lbl small center">{$t('Package as READ.html')}</text>
          </g>
        </svg>
        <figcaption class="reach-caption">
          {$t('Only the EPUB — with SEED.zip inside — can be reopened, edited, and republished.')}
        </figcaption>
      </figure>

      <p>
        {$t(
          'A SEED EPUB is a living document rather than a publishing dead-end, suited to distribution, contribution and long-term preservation.'
        )}
      </p>
    </section>
  </div>
</div>

<style>
  /* Fixed header over a scrolling body, matching the other split-pane views. */
  .about-pane {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-width: 0;
    background: var(--color-bg-primary);
  }

  .pane-title {
    font-weight: var(--font-semibold);
  }

  .about-pane-body {
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    padding: var(--space-5);
  }

  /* Keep a comfortable reading measure even when the pane is wide. */
  .about-pane-body > * {
    max-width: 42rem;
  }

  .about-tagline {
    font-size: var(--text-lg);
    line-height: 1.5;
    color: var(--color-text-primary);
    margin: 0 0 var(--space-4) 0;
  }

  .reach-figure {
    margin: 0 0 var(--space-5) 0;
  }

  .reach-graphic {
    display: block;
    width: 100%;
    max-width: 24rem;
    height: auto;
    margin: 0 auto var(--space-2);
    color: var(--color-text-tertiary);
  }

  .reach-graphic rect,
  .reach-graphic line,
  .reach-graphic path {
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .reach-graphic .g-source rect {
    fill: var(--color-bg-secondary);
  }

  .reach-graphic .g-arrows path {
    stroke: var(--color-accent);
  }

  .reach-graphic .arrowhead {
    fill: var(--color-accent);
    stroke: none;
  }

  /* The SEED-EPUB diagram carries a few proper-noun labels (no stroke, sans). */
  .reach-graphic text {
    fill: var(--color-text-secondary);
    stroke: none;
    font-family: var(--font-sans);
    font-size: 11px;
  }

  .reach-graphic text.center {
    text-anchor: middle;
  }

  .seed-graphic .inner {
    fill: var(--color-bg-secondary);
  }

  /* The re-import/edit arrow is dashed to read as a return, not a publish. */
  .seed-graphic .return {
    stroke-dasharray: 5 4;
  }

  /* Quiet container around the one-way outputs: a grouping, not a thing. */
  .seed-graphic .group {
    stroke-dasharray: 2 5;
    opacity: 0.55;
  }

  /* The Package EPUB label drawn as the actual sidebar button: same tokens,
     same dark-mode tonal treatment (see .package-epub-button in App.svelte). */
  .seed-graphic .pkg-btn {
    fill: var(--color-button-primary-bg);
    stroke: var(--color-button-primary-bg);
    stroke-width: 1.5;
  }

  .seed-graphic .pkg-btn-icon {
    fill: white;
    stroke: none;
  }

  /* The current project's row in the miniature projects list. */
  .seed-graphic .highlight {
    fill: var(--color-bg-accent);
    stroke: var(--color-border-accent);
    stroke-width: 1;
  }

  :global([data-theme='dark']) .seed-graphic .pkg-btn {
    fill: var(--color-surface-elevated);
    stroke: var(--color-border-accent);
  }

  :global([data-theme='dark']) .seed-graphic .pkg-btn-icon {
    fill: var(--color-text-link);
  }

  .seed-graphic .small {
    font-size: 9px;
  }

  .reach-caption {
    text-align: center;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .about-section {
    margin-bottom: var(--space-5);
  }

  .about-section h2 {
    font-size: var(--text-lg);
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
    margin: 0 0 var(--space-2) 0;
  }

  .about-section p {
    font-size: var(--text-base);
    line-height: 1.6;
    color: var(--color-text-secondary);
    margin: 0 0 var(--space-3) 0;
  }
</style>
