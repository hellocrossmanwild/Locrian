# The Locrian Ensemble of London

An immersive single-page site for the Locrian Ensemble of London — the string
ensemble founded by cellist Justin Pearson, resident of the candlelight concert
series at St Martin-in-the-Fields, and the players behind Debbie Wiseman's
*Wolf Hall* scores for the BBC.

Static. One file. No build step.

---

## The idea

The hero is a playable instrument. A field of golden strings rendered in
Three.js: drag a cursor or a finger across them and each one bows with damped
string physics. Candle embers drift upward through it.

Everything else is deliberately quiet so that one idea carries the page.

The page is structured as a concert programme — movements I–IV, each with a
tempo marking rather than a generic section label.

## Stack

| | |
|---|---|
| Three.js r128 | the string field and embers (CDN) |
| GSAP 3.12 + ScrollTrigger | reveals, parallax, pinned gallery (CDN) |
| Cormorant Garamond / Archivo | display / body (Google Fonts) |

No framework, no bundler, no dependencies to install.

Both CDN bundles are treated as optional. If either fails to arrive — a
corporate proxy, a blocked region, an aggressive extension — the page detects
it and degrades: no string field and no scroll animation, but every word still
readable. Without that guard a single blocked request left a black page.

## Local

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Open it in a real browser. Some embedded webviews block external images via
CSP and the page will look broken through no fault of its own — running
`tools/fetch-placeholders.mjs` (below) removes that class of problem for good.

## Tools

No dependencies; Node 18+.

```bash
node tools/set-image.mjs --list          # every image slot and what it points at
node tools/set-image.mjs hero assets/hero-1280.jpg assets/hero-1920.jpg
node tools/fetch-placeholders.mjs        # self-host the Wikimedia placeholders
```

`set-image.mjs` rewrites one slot's `src`, `srcset` and `alt`, leaving the
per-slot `sizes`, `loading` and `fetchpriority` tuning alone. See
[`assets/README.md`](assets/README.md) for what each slot wants.

`fetch-placeholders.mjs` downloads every remote image into
`assets/placeholders/`, repoints the page at the local copies, then asks the
Commons API who took each photograph and under what licence and writes that
into the footer credits and `CREDITS.md`. It needs to run somewhere that can
reach `upload.wikimedia.org`.

## The signature moments

- **The kindling** — see below; scrolling lights the church.
- **The dark minute** — a near-black interlude where the pointer carries a
  candle; the words read only inside its light. On touch the flame is carried
  for you. Keyboard, reduced-motion and no-JS readers get plain text.
- **The snuffing** — a single candle between the Wolf Hall cards gutters and is
  put out by the scroll, smoke curl and all.
- **The repertoire is a listening menu** — no synthesised notes. Each row
  links straight to a real recording on Spotify, mostly the Academy of St
  Martin in the Fields under Marriner — the same room this ensemble plays.
- **One flame lights everything** — a single clock breathes the veil over the
  photographs, the embers, the strings and the kindle field together.
- **The Programme** — a docked, candlelit Spotify player with the ensemble's
  real recordings (IDs verified in MEDIA.md).
- **Concert mode** — *Lights down* in the nav: the gallery presents one image
  at a time, full screen under the grade, flames guttering at the foot, the
  Programme dock alongside. Slides are built from the gallery markup, so real
  photography joins concert mode automatically.
- **The engraver's details** — ghost numerals behind the movement heads, a
  drawn flourish under *by candlelight*, film grain, themed scrollbar and
  selection, a flickering favicon, and a 404 marked *tacet*.

## The kindling

Between Movements I and II the scroll itself lights the church: the room goes
dark, then a hundred candle flames catch one by one, staggered at random but
seeded — the room lights the same way on every visit. Desktop pins the screen
and scrubs the lighting against the scroll; a phone lights them in passing with
no pin, which never fights the page scroll. Flames are DOM elements animated on
transform and opacity only, fewer on a phone, flicker disabled under
`prefers-reduced-motion`, and without GSAP the field simply stands lit.

## Sound

There is no synthesised audio anywhere on the page — a first pass tried it
(a Web Audio pluck on the strings, an ambient bed, a phrase engine for the
repertoire list) and it read as cheap next to what real recordings could do,
so it came back out. Every sound on the page now is a real recording:

- **Movement IV** carries the ensemble's actual playing: ‘The Mirror and the
  Light’ from Debbie Wiseman's *Wolf Hall* score, streamed by Spotify. Nothing
  loads from Spotify until the reader clicks — until then it is a facade in
  the page's own palette, and a plain link if the script never runs. That
  keeps a third party off the critical path and means a blocked embed can
  never paint a white box into a black page.
- **The repertoire list** in Movement II links each work straight out to
  Spotify — mostly the Academy of St Martin in the Fields under Sir Neville
  Marriner, the same room this ensemble plays in. Plain `<a target="_blank">`
  links, so they work with the script off.
- **The Programme dock**, docked from the nav, is the same pattern as
  Movement IV — a facade that only fetches Spotify once a recording is
  chosen.

Everything researched — recordings, photography sources, verified facts, and
one unresolved contradiction — is in [`MEDIA.md`](MEDIA.md).

## Design system

Defined as custom properties at the top of `index.html`.

| Token | Value | Role |
|---|---|---|
| `--nave` | `#07060B` | near-black, warm violet-brown |
| `--ivory` | `#F2E7D0` | candle ivory, primary text |
| `--flame` | `#E0A458` | candle gold, accent |
| `--flame-bright` | `#FFE3AE` | an excited string |
| `--velvet` | `#6E2634` | deep wine, secondary |
| `--smoke` | `#8E87A0` | muted captions |

### The candlelight grade

Every photograph passes through one shared filter — `.plate img` — so the whole
page reads as a single room lit by a single source, rather than a scrapbook.
A gold radial bloom and a vignette sit over the top. Drop any new image in and
it joins the same world without further work.

## Mobile

The phone build is not the desktop build scaled down:

- Pixel ratio capped at 1.5, antialiasing off, embers 150 → 55, string segments
  48 → 30, single-pass strings
- Seven wider-spaced strings instead of fifteen — a fingertip is not a cursor
- Per-image parallax is desktop-only via `gsap.matchMedia`; nine scrubbed
  transforms is where a phone's frame budget disappears
- The pinned horizontal gallery becomes a native snap-scroll carousel, which
  never fights the page scroll
- Resize is filtered: mobile URL-bar show/hide fires `resize` constantly, so
  height-only changes just resize the buffer and never rebuild geometry
- **Audio never auto-starts on touch.** A stray tap while scrolling must not
  play sound; the toggle is the only way in. Mouse can unlock on first click
- No hover on touch, so repertoire rows light on press and on focus
- Targets 44–56px, safe-area insets respected, `prefers-reduced-motion` honoured

---

## TODO before this goes live

**1. Replace the placeholder photography.** This is the big one.

Every image is currently hotlinked from Wikimedia Commons as a stand-in. Two
steps, in either order:

```bash
node tools/fetch-placeholders.mjs   # stop hotlinking, and credit them properly
node tools/set-image.mjs --list     # then swap them one at a time
```

The first is worth doing even though they are only placeholders: it ends the
hotlinking, survives a webview that blocks third-party images, and writes the
attribution that CC BY / CC BY-SA actually require. The candlelit church
interior is public domain; the rest are not.

What each slot wants is in [`assets/README.md`](assets/README.md) — hero,
Movement I ×2, Movement II, gallery ×5, on-screen ×2, coda. The grade needs no
changes.

**2. Fill in the real details.** Three things are still placeholders:

- **Booking email** — `bookings@locrianensemble.london`, in the coda. Not a
  live address as far as anyone here knows.
- **Concert dates** — there is now a diary on the page, fed by the `CONCERTS`
  array at the top of the script in `index.html`. It is empty, so the section
  falls back to the St Martin's listings link alone; add entries and the list
  appears. Past dates drop off by themselves.
- **The absolute URLs in the head** — canonical, `og:`, `twitter:` all point at
  `locrianensemble.london`, marked with a `SITE URL` comment so they can be
  changed together. Until they are right, share previews will not resolve the
  card at `assets/og.jpg`.

**3. The domain.** `locrianensemble.co.uk` has lapsed and now serves a
Vietnamese cockfighting streaming site. Worth recovering or replacing early —
it settles the point above.

**4. Ask Justin when the ensemble was formed.** His own site says he formed it
in 1985; Apple Music Classical and a 2019 concert listing both say 1995. The
page states no year, which is the safe position, but a founding year belongs on
a page like this. See [`MEDIA.md`](MEDIA.md).

**5. Nice to have.** The share card at `assets/og.jpg` is typographic — a
photograph of the ensemble by candlelight would do more work. A second
streaming embed for *Mozart by Candlelight*, the ensemble's live recording made
at St Martin's, if a streaming link for it turns up.
