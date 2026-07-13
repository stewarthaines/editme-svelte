/**
 * Content signatures used as fine-grained reactivity gates.
 *
 * Workspace mutations replace `appState.workspace` wholesale (immutable
 * snapshots), so effects that track the workspace object re-run on every
 * save. Deriving one of these signature strings instead lets an effect
 * re-run only when the slice it cares about actually changed: a `$derived`
 * that recomputes to an equal string does not re-fire its dependents.
 *
 * `\u0001` separates fields (it cannot appear in OPF attribute values) and
 * `\n` separates items, so distinct inputs cannot collide.
 */

interface SpineLike {
  idref: string;
  linear?: boolean;
}

interface ManifestLike {
  id: string;
  href: string;
  mediaType: string;
  properties?: string[];
}

const SEP = '\u0001';

/** Changes when spine membership, order, or linearity change. */
export function spineSignature(spine: readonly SpineLike[]): string {
  return spine.map(item => `${item.idref}${SEP}${item.linear ?? true}`).join('\n');
}

/** Changes when any manifest item's id, href, media type, or properties change. */
export function manifestSignature(manifest: readonly ManifestLike[]): string {
  return manifest
    .map(
      item =>
        `${item.id}${SEP}${item.href}${SEP}${item.mediaType}${SEP}${(item.properties ?? []).join(',')}`
    )
    .join('\n');
}

/**
 * Identity of the bytes a content preview shows: the workspace, the kind of
 * item, and the path it resolves to. An id-only edit keeps this key equal;
 * an href rename changes it (callers that know a rename left the bytes
 * intact can pre-seed their guard with the new key).
 */
export function previewKeyFor(
  workspaceId: string,
  type: 'manifest' | 'source' | 'opf',
  pathOrHref: string,
  mediaType?: string
): string {
  return `${workspaceId}${SEP}${type}${SEP}${pathOrHref}${SEP}${mediaType ?? ''}`;
}
