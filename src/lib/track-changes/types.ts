/**
 * Track-changes patchset model.
 *
 * A patchset captures the content changes a reviewer made to an EPUB, derived by
 * diffing the base snapshot (`SOURCE/main/`) against the current content. Because
 * review mode locks structure and metadata, every change is a *modification* of an
 * existing file — there are no add/remove/reorder or metadata operations to
 * represent. Patchsets are stored in a reserved `changes` workspace and tagged with
 * the source project's `dc:identifier` so they can be matched to a target project.
 */

/** A single content change between base and current. */
export type ChangeItem =
  | {
      kind: 'chapter-modify';
      /** Spine id / manifest id (e.g. `chapter01`). */
      id: string;
      /** Human label for the review list. */
      title: string;
      /** The reviewer's new plain-text source. */
      newText: string;
    }
  | {
      kind: 'file-modify';
      /** Workspace-relative path of the existing file (e.g. `OEBPS/Styles/style.css`). */
      path: string;
      mediaType: string;
      /** The reviewer's new content (UTF-8 text). */
      newContent: string;
    };

export interface Patchset {
  id: string;
  /** Source project's dc:identifier (for matching to a target project). */
  projectIdentifier: string;
  /** Source project's title (for display). */
  projectTitle: string;
  /** Epoch millis. */
  createdAt: number;
  changes: ChangeItem[];
}
