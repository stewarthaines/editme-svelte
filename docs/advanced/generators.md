# Generators and their options

A **generator** is a script that *produces* source text and inserts it at the
editor caret — for example "insert a list of figures" or "insert a sample of ABC
notation". This is distinct from a transform, which converts existing content in
the render pipeline.

A generator is declared in an extension's `extension.json` under the `generators`
array, and is backed by a script file shipped in the same extension. The host
renders each generator's `options` as a small form in the Generator panel; when the
user runs it, the entered values are handed to the script's `generateText` function.

```json
{
  "id": "list-of-figures",
  "name": "List of Figures",
  "generators": [
    {
      "id": "figures",
      "name": "List of Figures",
      "description": "Insert a list of every figure used across the project's chapters.",
      "script": "listFigures.js",
      "options": [ /* … see below … */ ]
    }
  ]
}
```

## The generator manifest

Each entry in `generators` has these fields:

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `string` | yes | Stable identifier for the generator. |
| `name` | `string` | yes | Shown in the generator picker. |
| `description` | `string` | no | Shown under the picker when selected. |
| `script` | `string` | yes | Script filename within the extension dir. Exports `generateText(ctx, options)`. |
| `license` | `string` | no | License file for the script, bundled into `SOURCE/`. |
| `options` | `GeneratorOption[]` | yes | Form fields presented before running (may be empty `[]`). |

## Options

Every option becomes one form field. The user's entry is passed to the script under
`options[name]`, so **`name` is the key your script reads** — keep it
script-friendly (no spaces). `label` is the human text shown beside the field.

| Field | Type | Applies to | Description |
| --- | --- | --- | --- |
| `type` | `'string' \| 'number' \| 'boolean' \| 'select'` | all | The field kind (see below). |
| `name` | `string` | all | Key in the `options` object passed to the script. |
| `label` | `string` | all | Field label in the form. |
| `default` | `string \| number \| boolean` | all | Initial value (see *Defaults*). |
| `placeholder` | `string` | `string`, `number` | Greyed hint text in the input. |
| `options` | `{ value: string; label: string }[]` | **`select`** | The dropdown choices. **Required for `select`.** |

### Field types

- **`string`** → a text input. The script receives the string (`''` if empty).
- **`number`** → a numeric input. The script receives a `number` (or `''` if the
  field is cleared, so coerce defensively, e.g. `Number(options.count) || 0`).
- **`boolean`** → a checkbox. The script receives `true` / `false`.
- **`select`** → a dropdown. **Must** include an `options` array of
  `{ value, label }` choices; the script receives the selected **`value`** string
  (not the label). Omitting `options` renders an empty, unusable dropdown — this is
  the most common mistake.

### Defaults

When the panel opens, each field is seeded with its `default`, then overlaid with
the values the user last ran this generator with. If you omit `default`, the
fallback is: `false` for booleans, the **first choice's `value`** for selects, and
`''` for string/number. For a `select`, make sure `default` equals one of your
`value`s (otherwise the dropdown shows the first choice but `default` is ignored).

## A worked example: a format `select`

This generator offers a `select` to choose the plain-text block syntax for the
inserted sample, plus a boolean toggle:

```json
{
  "id": "abc-sample",
  "name": "ABC Sample",
  "description": "Insert a sample of ABC notation with yaml frontmatter specifying rendering options.",
  "script": "abc-sample.js",
  "options": [
    {
      "type": "select",
      "name": "format",
      "label": "Plain text wrapper",
      "default": "markdown",
      "options": [
        { "value": "markdown", "label": "Markdown" },
        { "value": "textile", "label": "Textile" }
      ]
    },
    {
      "type": "boolean",
      "name": "include_scales",
      "label": "Include multiple scale classes",
      "default": false
    }
  ]
}
```

The script reads the option values by `name`:

```js
function generateText(ctx, options) {
  const opts = options || {};
  const format = opts.format || 'markdown';        // 'markdown' | 'textile' (the select value)
  const includeScales = Boolean(opts.include_scales);

  const fence = format === 'textile' ? 'bc.' : '```'; // pick block syntax per choice
  // … build and return the sample source text …
  return sample;
}
```

`generateText` may also be `async`. Its first argument, `ctx`, is the same
file-access context transforms receive — see
[Transform context API (`ctx`)](transform-context-api.md) — so a generator can read
manifest items and project `SOURCE/` data while building its output.
