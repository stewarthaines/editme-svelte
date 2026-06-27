/**
 * Shared types for the two-step import flow (collision review).
 *
 * When an imported file would collide with an existing chapter or manifest item,
 * the import is paused and the user reviews the incoming content against the
 * current content, then chooses — per file — to overwrite the existing item or
 * keep both (import as a new, suffixed item).
 */

/** Which import surface a colliding file came from. */
export type ImportKind = 'chapter' | 'manifest';

/** Per-file decision in the review dialog. */
export type ImportResolution = 'overwrite' | 'keep-both';

/**
 * What the review dialog renders on the right for the selected file.
 * - `text`  → inline line diff (current vs incoming)
 * - `image` → side-by-side image preview
 * - `binary`→ size comparison for media we can't render inline (audio, fonts…)
 */
export type ReviewPreview =
  | { type: 'text'; current: string; incoming: string }
  | { type: 'image'; mediaType: string; current: Uint8Array; incoming: Uint8Array }
  | { type: 'binary'; mediaType: string; currentSize: number; incomingSize: number };

/** One colliding file presented in the review dialog. */
export interface ReviewItem {
  /** Stable key — the staged file path. */
  key: string;
  /** Display name (the original uploaded file name). */
  title: string;
  /** The existing item being collided with (chapter id or manifest href). */
  collisionLabel: string;
  /** Content shown in the preview pane. */
  preview: ReviewPreview;
  /** The user's current choice for this file (seeded to `overwrite`). */
  resolution: ImportResolution;
}

/** The dialog's confirm payload: the chosen resolution per file key. */
export interface ReviewDecision {
  key: string;
  resolution: ImportResolution;
}
