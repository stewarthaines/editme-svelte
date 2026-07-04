# Local patch: `public/bene/assets/index-*.js` (bene web shell)

The vendored bene reader shell has **one local modification** fixing a warm-service-worker race. If you re-vendor / upgrade `public/bene/`, check whether upstream has fixed it (nota-lang/bene), and re-apply if not. See `public/bene/VENDORED.md` for provenance.

## The bug

The shell forwards the service worker's `loaded-epub` broadcast to the inner `bene-reader` iframe the moment it arrives, and its window-message handler ignores the iframe's `ready` signal (`r.type==="ready"||console.warn(...)`). On a first-ever visit the SW install delays the `?preload=` ingest long enough for the reader to be listening; on every later visit (SW already active) the broadcast wins the race and is lost — the reader shows the "Upload EPUB" prompt instead of the book.

## The change

Two replacements in the shell bundle:

1. The SW `message` listener stashes the payload before forwarding:

```diff
- f.type==="loaded-epub"&&e.contentWindow.postMessage({type:"loaded-epub",data:{status:"ok",data:f.data}})
+ f.type==="loaded-epub"&&(window.__seedLastEpub={type:"loaded-epub",data:{status:"ok",data:f.data}},e&&e.contentWindow&&e.contentWindow.postMessage(window.__seedLastEpub))
```

2. The `ready` branch re-sends the stashed payload:

```diff
- else r.type==="ready"||console.warn("Unhandled message",r)
+ else if(r.type==="ready"){window.__seedLastEpub&&e&&e.contentWindow&&e.contentWindow.postMessage(window.__seedLastEpub)}else console.warn("Unhandled message",r)
```

Re-apply with:

```bash
python3 - <<'PY'
path = 'public/bene/assets/index-BPGIIg-0.js'  # adjust the hashed name after re-vendoring
src = open(path).read()
old_sw = 'f.type==="loaded-epub"&&e.contentWindow.postMessage({type:"loaded-epub",data:{status:"ok",data:f.data}})'
new_sw = 'f.type==="loaded-epub"&&(window.__seedLastEpub={type:"loaded-epub",data:{status:"ok",data:f.data}},e&&e.contentWindow&&e.contentWindow.postMessage(window.__seedLastEpub))'
old_ready = 'else r.type==="ready"||console.warn("Unhandled message",r)'
new_ready = 'else if(r.type==="ready"){window.__seedLastEpub&&e&&e.contentWindow&&e.contentWindow.postMessage(window.__seedLastEpub)}else console.warn("Unhandled message",r)'
assert src.count(old_sw) == 1 and src.count(old_ready) == 1
open(path, 'w').write(src.replace(old_sw, new_sw).replace(old_ready, new_ready))
print('patched')
PY
```
