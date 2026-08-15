# The 3D model

`logo.glb` is the shape rendered on the homepage. To try a different one,
just replace this file with another `.glb` — same name, same folder. No code
or HTML to touch; `index.html` loads whatever's here.

```
model/
└── logo.glb   ← replace this file to change the shape
```

## What happens to the file on load

The page doesn't use your model as-is — it strips it down to bare geometry
and re-skins it with the site's own materials, lighting and animation:

- **Only shape survives.** All meshes in the file are merged into one, and
  only vertex positions and normals are kept — materials, textures, colors,
  and any embedded lights or cameras are discarded. The page's own materials
  (matte, glass, wireframe, outline) drive the actual look.
- **Auto-centered and auto-scaled.** Whatever the model's own size and
  origin, the page recenters it and scales it to a fixed on-screen height
  (`FIT`, currently `3.0` world units) — so you don't need to match any
  particular scale or pivot when swapping files.
- **No rig, no animation.** Only the static mesh matters; skeletons,
  blend shapes and animation clips in the file are ignored.

## What makes a good candidate

- **A single connected, fairly simple shape** works best — this is the same
  kind of geometry a logotype or wordmark would produce. Very high poly
  counts (dense scans, subdivision-heavy sculpts) will still load, but the
  page also samples the mesh into a particle cloud for its "come apart and
  reassemble" tap animation, so extremely dense meshes cost more to process
  on first tap, especially on phones.
- **Binary glTF (`.glb`)**, not `.gltf` + separate files — keep it to the one
  file so there's nothing else to place alongside it.
- **Solid, manifold geometry** reads best under the site's lighting — thin
  open shells or single-sided planes can look fine from some angles and
  vanish from others.

## If the file fails to load

If `logo.glb` is missing, corrupt, or fails to parse, the page automatically
falls back to a built-in flat letterform (no broken page, no console-only
error) — you'll see "FALLBACK GEOMETRY" briefly in the loading screen. That's
your signal the file didn't load; check the filename and that it's a valid
binary `.glb`.
