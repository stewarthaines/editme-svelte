<!--
  Generator Settings

  Project Settings → Generators. Lets the user define a generator by hand: a name,
  optional description, a list of options, and a script file (exporting
  generateText(ctx, options)). Mirrors the "Import JavaScript Extension" flow and is
  advanced-mode gated. Persists via the generator-store (SOURCE/generators/<id>/).
-->
<script lang="ts">
  import { t } from '$lib/i18n';
  import { FileStorageAPI } from '$lib/storage/index.js';
  import { normalizeExtensionName } from '$lib/extensions/utils.js';
  import {
    listGenerators,
    writeGenerator,
    deleteGenerator,
    type InstalledGenerator,
  } from '$lib/generators/generator-store.js';
  import type { GeneratorManifest, GeneratorOption } from '$lib/extensions/extension-catalog.js';

  let {
    workspaceId,
    isAdvancedMode = false,
    onChanged,
  }: {
    workspaceId: string;
    isAdvancedMode?: boolean;
    onChanged?: () => void;
  } = $props();

  const fileStorage = FileStorageAPI.getInstance();

  let generators = $state<InstalledGenerator[]>([]);
  let loading = $state(false);
  let error = $state<string | null>(null);

  // --- Create form -----------------------------------------------------------
  type OptionRow = {
    type: GeneratorOption['type'];
    name: string;
    label: string;
    placeholder: string;
    textDefault: string;
    boolDefault: boolean;
    choices: string; // "value:label, value:label" or bare "value"
  };

  let name = $state('');
  let description = $state('');
  let scriptFile = $state<File | null>(null);
  let optionRows = $state<OptionRow[]>([]);
  let saving = $state(false);
  let fileInput = $state<HTMLInputElement>();

  const optionTypeLabels: { value: GeneratorOption['type']; label: string }[] = [
    { value: 'string', label: $t('Text') },
    { value: 'number', label: $t('Number') },
    { value: 'boolean', label: $t('Checkbox') },
    { value: 'select', label: $t('Dropdown') },
  ];

  async function refresh(): Promise<void> {
    loading = true;
    try {
      generators = await listGenerators(fileStorage, workspaceId);
    } catch {
      generators = [];
    } finally {
      loading = false;
    }
  }

  $effect(() => {
    if (workspaceId) void refresh();
  });

  function addOption(): void {
    optionRows = [
      ...optionRows,
      { type: 'string', name: '', label: '', placeholder: '', textDefault: '', boolDefault: false, choices: '' },
    ];
  }

  function removeOption(index: number): void {
    optionRows = optionRows.filter((_, i) => i !== index);
  }

  function patchOption(index: number, patch: Partial<OptionRow>): void {
    optionRows = optionRows.map((row, i) => (i === index ? { ...row, ...patch } : row));
  }

  function parseChoices(raw: string): { value: string; label: string }[] {
    return raw
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      .map(part => {
        const [value, label] = part.split(':').map(s => s.trim());
        return { value, label: label || value };
      });
  }

  function buildOptions(): GeneratorOption[] {
    const out: GeneratorOption[] = [];
    for (const row of optionRows) {
      const optName = row.name.trim();
      if (!optName) continue; // skip rows with no key
      const opt: GeneratorOption = {
        type: row.type,
        name: optName,
        label: row.label.trim() || optName,
      };
      if (row.placeholder.trim()) opt.placeholder = row.placeholder.trim();
      if (row.type === 'boolean') {
        opt.default = row.boolDefault;
      } else if (row.type === 'number') {
        if (row.textDefault.trim()) opt.default = Number(row.textDefault);
      } else if (row.textDefault.trim()) {
        opt.default = row.textDefault;
      }
      if (row.type === 'select') opt.options = parseChoices(row.choices);
      out.push(opt);
    }
    return out;
  }

  function onFileChange(event: Event): void {
    scriptFile = (event.target as HTMLInputElement).files?.[0] ?? null;
  }

  function resetForm(): void {
    name = '';
    description = '';
    scriptFile = null;
    optionRows = [];
    if (fileInput) fileInput.value = '';
  }

  async function handleCreate(): Promise<void> {
    if (!isAdvancedMode || saving) return;
    error = null;
    if (!name.trim()) {
      error = $t('A name is required.');
      return;
    }
    if (!scriptFile) {
      error = $t('A script file is required.');
      return;
    }
    saving = true;
    try {
      const id = normalizeExtensionName(name.trim());
      if (!id) {
        error = $t('A name is required.');
        return;
      }
      const manifest: GeneratorManifest = {
        id,
        name: name.trim(),
        description: description.trim() || undefined,
        script: scriptFile.name,
        options: buildOptions(),
      };
      const buffer = await scriptFile.arrayBuffer();
      await writeGenerator(fileStorage, workspaceId, manifest, buffer);
      resetForm();
      await refresh();
      onChanged?.();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    } finally {
      saving = false;
    }
  }

  async function handleRemove(id: string): Promise<void> {
    if (!isAdvancedMode) return;
    error = null;
    try {
      await deleteGenerator(fileStorage, workspaceId, id);
      await refresh();
      onChanged?.();
    } catch (e) {
      error = e instanceof Error ? e.message : String(e);
    }
  }
</script>

<section class="generator-settings">
  <h3>{$t('Generators')}</h3>
  <p class="gs-intro">
    {$t(
      'A generator is a script (exporting generateText(ctx, options)) that produces source text to insert at the editor caret.'
    )}
  </p>

  <!-- Existing generators -->
  {#if loading}
    <p>{$t('Loading…')}</p>
  {:else if generators.length === 0}
    <p class="gs-empty">{$t('No generators defined.')}</p>
  {:else}
    <ul class="gs-list">
      {#each generators as g (g.manifest.id)}
        <li class="gs-item">
          <div class="gs-item-text">
            <span class="gs-item-name">{g.manifest.name}</span>
            {#if g.manifest.description}
              <span class="gs-item-desc">{g.manifest.description}</span>
            {/if}
          </div>
          <button
            type="button"
            class="gs-remove"
            onclick={() => handleRemove(g.manifest.id)}
            disabled={!isAdvancedMode}
          >
            {$t('Remove')}
          </button>
        </li>
      {/each}
    </ul>
  {/if}

  <!-- Create / overwrite -->
  <div class="gs-create" class:disabled={!isAdvancedMode}>
    <h4>{$t('Add a generator')}</h4>
    {#if !isAdvancedMode}
      <p class="advanced-mode-note">{$t('Advanced Mode required for extension management')}</p>
    {/if}

    <div class="gs-field">
      <label class="gs-label" for="gs-name">{$t('Name')}</label>
      <input id="gs-name" class="gs-input" bind:value={name} disabled={!isAdvancedMode} />
    </div>

    <div class="gs-field">
      <label class="gs-label" for="gs-desc">{$t('Description')}</label>
      <input id="gs-desc" class="gs-input" bind:value={description} disabled={!isAdvancedMode} />
    </div>

    <div class="gs-field">
      <label class="gs-label" for="gs-script">{$t('Script file')}</label>
      <input
        id="gs-script"
        bind:this={fileInput}
        type="file"
        accept=".js"
        onchange={onFileChange}
        disabled={!isAdvancedMode}
      />
    </div>

    <div class="gs-options">
      <div class="gs-options-head">
        <span class="gs-label">{$t('Options')}</span>
        <button type="button" class="gs-add" onclick={addOption} disabled={!isAdvancedMode}>
          {$t('Add option')}
        </button>
      </div>

      {#each optionRows as row, i (i)}
        <div class="gs-option-row">
          <select
            class="gs-input gs-type"
            value={row.type}
            onchange={e => patchOption(i, { type: e.currentTarget.value as GeneratorOption['type'] })}
            aria-label={$t('Option type')}
            disabled={!isAdvancedMode}
          >
            {#each optionTypeLabels as ot (ot.value)}
              <option value={ot.value}>{ot.label}</option>
            {/each}
          </select>
          <input
            class="gs-input"
            placeholder={$t('Key')}
            value={row.name}
            oninput={e => patchOption(i, { name: e.currentTarget.value })}
            aria-label={$t('Option key')}
            disabled={!isAdvancedMode}
          />
          <input
            class="gs-input"
            placeholder={$t('Label')}
            value={row.label}
            oninput={e => patchOption(i, { label: e.currentTarget.value })}
            aria-label={$t('Option label')}
            disabled={!isAdvancedMode}
          />
          {#if row.type === 'boolean'}
            <label class="gs-check">
              <input
                type="checkbox"
                checked={row.boolDefault}
                onchange={e => patchOption(i, { boolDefault: e.currentTarget.checked })}
                disabled={!isAdvancedMode}
              />
              <span>{$t('Default on')}</span>
            </label>
          {:else if row.type === 'select'}
            <input
              class="gs-input"
              placeholder={$t('value:Label, value:Label')}
              value={row.choices}
              oninput={e => patchOption(i, { choices: e.currentTarget.value })}
              aria-label={$t('Choices')}
              disabled={!isAdvancedMode}
            />
          {:else}
            <input
              class="gs-input"
              placeholder={$t('Default')}
              value={row.textDefault}
              oninput={e => patchOption(i, { textDefault: e.currentTarget.value })}
              aria-label={$t('Default value')}
              disabled={!isAdvancedMode}
            />
          {/if}
          <button
            type="button"
            class="gs-remove gs-remove-row"
            onclick={() => removeOption(i)}
            aria-label={$t('Remove option')}
            disabled={!isAdvancedMode}
          >
            ×
          </button>
        </div>
      {/each}
    </div>

    {#if error}
      <p class="gs-error" role="alert">{error}</p>
    {/if}

    <div class="gs-actions">
      <button
        type="button"
        class="gs-create-btn"
        onclick={handleCreate}
        disabled={!isAdvancedMode || saving}
      >
        {saving ? $t('Saving…') : $t('Create generator')}
      </button>
    </div>
  </div>
</section>

<style>
  .generator-settings {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .gs-intro,
  .gs-empty {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-text-secondary);
  }

  .gs-list {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .gs-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
  }

  .gs-item-text {
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
  }

  .gs-item-name {
    font-size: var(--text-sm);
    font-weight: var(--font-medium);
    color: var(--color-text-primary);
  }

  .gs-item-desc {
    font-size: var(--text-xs);
    color: var(--color-text-secondary);
  }

  .gs-create {
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
    padding: var(--space-4);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-md);
  }

  .gs-create.disabled {
    opacity: 0.7;
  }

  .gs-create h4 {
    margin: 0;
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: var(--color-text-primary);
  }

  .gs-field {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .gs-label {
    font-size: var(--text-xs);
    font-weight: var(--font-medium);
    color: var(--color-text-secondary);
  }

  .gs-input {
    padding: var(--space-2) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
    background: var(--color-bg-primary);
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
  }

  .gs-input:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-focus-ring);
  }

  .gs-options {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .gs-options-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .gs-option-row {
    display: grid;
    grid-template-columns: 7rem 1fr 1fr 1fr auto;
    gap: var(--space-2);
    align-items: center;
  }

  .gs-type {
    width: 100%;
  }

  .gs-check {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--color-text-primary);
  }

  .gs-add {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-text-link);
    background: none;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .gs-remove {
    padding: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
    color: var(--color-status-error);
    background: none;
    border: 1px solid var(--color-border-default);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }

  .gs-remove-row {
    padding: var(--space-1) var(--space-2);
    line-height: 1;
  }

  .gs-remove:disabled,
  .gs-add:disabled,
  .gs-create-btn:disabled {
    opacity: 0.6;
    cursor: default;
  }

  .gs-error {
    margin: 0;
    font-size: var(--text-sm);
    color: var(--color-status-error);
  }

  .gs-actions {
    display: flex;
    justify-content: flex-end;
  }

  .gs-create-btn {
    padding: var(--space-2) var(--space-4);
    font-size: var(--text-sm);
    font-weight: var(--font-semibold);
    color: white;
    background-color: var(--color-button-primary-bg);
    border: 1px solid var(--color-button-primary-bg);
    border-radius: var(--radius-md);
    cursor: pointer;
  }

  .gs-create-btn:hover:not(:disabled) {
    background-color: var(--color-button-primary-bg-hover);
  }

  .advanced-mode-note {
    margin: 0;
    font-size: var(--text-xs);
    color: var(--color-text-tertiary);
    font-style: italic;
  }

  :global([data-theme='dark']) .gs-create-btn {
    background-color: var(--color-surface-elevated);
    border-color: var(--color-border-accent);
    color: var(--color-text-link);
  }
</style>
