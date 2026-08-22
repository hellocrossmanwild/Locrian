# Assets

Everything the page loads from its own domain. Drop files in here and point a
slot at them; the candlelight grade (`.plate img` in `index.html`) absorbs any
photograph without further work, so no CSS changes are needed.

## Already here

| File | What it is |
|---|---|
| `favicon.svg` | Three strings, the middle one lit. Inline SVG, scales to any tab |
| `apple-touch-icon.png` | 180×180 raster of the same mark, for iOS home screens |
| `og.jpg` | 1200×630 share card. Replace with a real photograph once there is one |

## The photography slots

Each `<img>` in `index.html` carries a `data-slot`. To see the current state:

```bash
node tools/set-image.mjs --list
```

| Slot | Wants |
|---|---|
| `hero` | The ensemble mid-performance at St Martin's, candlelit. Full-bleed, so keep the players off-centre — type sits over the middle |
| `movement-i-a` | Justin with the cello, or a close instrument detail. Portrait crop |
| `movement-i-b` | A second instrument detail. Landscape crop, sits wider than its neighbour |
| `movement-ii` | The hall during a candlelight concert. Full-bleed background, heavily darkened |
| `gallery-1` … `gallery-5` | Performance shots, the nave, the players, the audience. Landscape, seen at roughly 3:2 |
| `screen-1`, `screen-2` | Angel Studios sessions, or *Wolf Hall* stills if cleared |
| `coda` | The building at night, or the room emptying. Full-bleed, very dark |

## Adding a photograph

One file:

```bash
node tools/set-image.mjs gallery-1 assets/nave.jpg --alt "The nave, looking east"
```

Several widths — name them `-960`, `-1280`, `-1920` and the `srcset` is built
for you, largest becoming the `src`:

```bash
node tools/set-image.mjs hero assets/hero-960.jpg assets/hero-1280.jpg assets/hero-1920.jpg
```

`sizes`, `loading` and `fetchpriority` are tuned per slot and are left alone.

**Alt text.** The three full-bleed slots (`hero`, `movement-ii`, `coda`) are
decorative — they sit behind text and are `aria-hidden`, so they keep an empty
`alt`. Every other slot is content and wants a real description.

**Captions too.** The `<figcaption>` on each plate describes the placeholder
currently in it — “Aged spruce” means the stock photograph, not anything of
Justin's. Rewrite the caption when you swap the picture. The one exception is
Movement I's first plate, which names his actual instrument: a 1695 Francesco
Ruggieri.

**Sizes.** 1600–1920px on the long edge is plenty; the grade crushes fine
detail anyway. JPEG at quality ~80. Everything under `/assets` is served
`immutable` for a year (see `vercel.json`), so change the filename when you
change the picture.
