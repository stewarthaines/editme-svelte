# Bridge incident: chapter source replaced by another file's written content

**Date:** 2026-07-23
**Project:** Polyphony Bulletin 39 (`workspace-4408b7f4-bbc6-4928-9f07-0345528bc295`), dev server, agent connected via seed-bridge MCP.
**Symptom:** `SOURCE/text/georgian-folk-song-in-the-uk.txt` was found containing an exact byte copy of `SOURCE/text/contents.txt` (the post-edit version). `contents.txt` itself was intact. Reported by the author; confirmed and repaired by the agent.

## Session write sequence (agent's vantage)

All writes went through `seed_write_file`, sequentially — each call's ack was received before the next call was issued. Order, with the bridge's ack values:

| #   | path                                 | ack size  | ack hash (prefix)                        |
| --- | ------------------------------------ | --------- | ---------------------------------------- |
| 0   | frank-kane.txt (attempt)             | —         | error: "changed since read" — see note A |
| 0b  | frank-kane.txt (attempt)             | —         | denied by author (attention elsewhere)   |
| 1   | frank-kane.txt                       | 6075      | `b133b172`                               |
| 2   | last-soinari-player.txt              | 7251      | `84d240a6`                               |
| 3   | ethnographical-letters.txt           | 6836      | `eb068656`                               |
| 4   | batonebi-in-meskheti.txt             | 5955      | `fb85ea30`                               |
| 5   | batonebis-mamidasa.txt               | 1100      | `59c0d372`                               |
| 6   | nanina-collection.txt                | 3571      | `52d10c1c`                               |
| 7   | ensemble-mzeshina.txt                | 3584      | `3dab7c4a`                               |
| 8   | meskhetian-archival-materials.txt    | 10690     | `51594c96`                               |
| 9   | voices-of-the-ancestors.txt          | 4904      | `fa6de8a7`                               |
| 10  | **georgian-folk-song-in-the-uk.txt** | **11461** | **`92989689`**                           |
| 11  | imprint.txt                          | 808       | `5d01c947`                               |
| 12  | **contents.txt**                     | **1612**  | **`2773201b`**                           |
| 13  | (later turn) OEBPS/Styles/page.css   | 2500      | `f730e85b`                               |

Between #13 and the author's report, the only other agent action was a `seed_get_rendered_xhtml` read. Whatever the author did in the app during that window (chapter navigation, preview, print preview) is visible only in the activity feed / their memory.

## Evidence

1. **Write #10 acked correctly.** The bridge returned size 11461 / hash `92989689…` for the georgian-folk-song write — the correct values for the intended 11.4 KB payload.
2. **The clobbered state was an exact copy of write #12's payload.** When re-read after the report, georgian-folk-song-in-the-uk.txt returned size 1612, hash `2773201b…` — byte-identical to the ack of the `contents.txt` write (#12), including edits made this session (`_Batonebi_` emphasis in the TOC). So the source of the stray bytes is specifically the _post-write_ contents state, not any pre-session file.
3. **The read path saw the clobbered state.** The repair write succeeded using `expected_hash = 2773201b…`, i.e. the bridge's own hash guard agreed the file held contents' bytes. The clobber therefore went through (or is visible to) the same storage layer the bridge reads — not a stale cache on the read side.
4. **The repair write reproduced the original ack exactly** (11461 / `92989689…`), confirming the #10 payload itself was well-formed.
5. `contents.txt` was never wrong. One file affected, replaced wholesale — no truncation, no interleaving, no partial content.

## Interpretation

Two families of explanation fit the evidence; the agent cannot distinguish them from outside:

**(a) Bridge write-path race.** If the ack hash is computed from the request payload (not read back after flush), a misdirected or lost flush is invisible. E.g.: per-write state (target path or FileSystemWritableFileStream handle) kept in shared mutable state; write #10's flush still pending when #12's payload arrives; #12's bytes land under #10's handle/path. Ack-before-flush would let both calls report success. Argues for: the stray content being exactly a _later_ write's payload. Argues against: #11 (imprint) sits between them and was unaffected — a simple "last payload wins over pending handle" story would more likely have hit imprint.

**(b) App-side overwrite after the acks.** Something in the app later saved contents' bytes under the georgian-folk-song path: an editor/save buffer keyed by chapter id that got out of sync with its file path during chapter navigation; track-changes copy-on-write bookkeeping (note: `SOURCE/main/SOURCE/text/` held base copies of exactly `contents.txt` and `batonebi-in-meskheti.txt` at session start — contents is one of the two files with copy-on-write bases, so its write exercised the track-changes path that most chapter writes did not); or the external-write reconciliation the app performs when the bridge modifies a file that a component has open. The contents _chapter_ is adjacent to project-open state (it's often the first/landing chapter), which raises the odds it had a live buffer somewhere.

Given the acks looked correct at write time, (b) — or a hybrid where the bridge's write triggers an app-side reconciliation that saves a stale buffer — is the stronger suspicion. The activity feed timestamps for writes #10–#12 versus the file's mtime (if OPFS metadata is available) would settle when the clobber happened.

## Note A — misleading error on mistyped hash

The very first write attempt failed with _"changed since read — re-read the file and retry with its current hash"_. The actual cause was the agent transcribing the hash with an extra digit — the file had **not** changed. The error message asserts a specific cause for what is really "expected_hash doesn't match current". Suggest including the current hash (or at least "supplied hash does not match current content") in the error so the caller can tell a transcription/staleness error from a genuine concurrent modification.

## Recommendations

1. **Read-back acks.** Compute the ack hash from the stored bytes after flush, not from the request payload. This converts silent misdirection into a detectable mismatch at write time.
2. **No shared mutable per-write state.** Capture (path, payload, handle) immutably per request; don't reuse a module-level "current write" slot across queued/consented writes.
3. **Write journal correlation.** The activity feed presumably already logs path + time per write; add the payload hash so a later forensic diff (file content hash vs. journal) pinpoints which write a clobbered file's bytes came from and when.
4. **Audit app-side save paths for id↔path coupling**: editor autosave, track-changes copy-on-write (especially files that have bases in `SOURCE/main/`), and any reconciliation triggered by bridge writes to a file the UI has open. The contents/track-changes intersection above is the most concrete lead.
5. **Consider advising read-after-write in the authoring guide** for agents doing batch writes (cheap: one `seed_read_file` of the batch's files comparing hashes) until (1) lands.
6. **Error message fix per Note A.**

## Repair record

Restored `SOURCE/text/georgian-folk-song-in-the-uk.txt` from the agent's retained payload via `seed_write_file` (expected_hash `2773201b…` → new hash `92989689…`, byte-identical to the original write). Verified `contents.txt` intact.

**Full sweep completed after the repair:** every other file written this session (writes #1–#9, #11, #13) was re-read and its current hash compared against the ack table — all 11 match exactly. The incident is confined to the single georgian-folk-song → contents clobber; no truncation, cross-contamination, or drift anywhere else in the write set.
