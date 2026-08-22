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
string physics *and* sounds a note through the Web Audio API. The field is
tuned to the **Locrian mode on B** — the ensemble's own name, made audible.
Candle embers drift upward through it.

Everything else is deliberately quiet so that one idea carries the page.

The page is structured as a concert programme — movements I–IV, each with a
tempo marking rather than a generic section label.

## Stack

| | |
|---|---|
| Three.js r128 | the string field and embers (CDN) |
| GSAP 3.12 + ScrollTrigger | reveals, parallax, pinned gallery (CDN) |
| Web Audio API | string plucks, synthesised — no audio files |
| Cormorant Garamond / Archivo | display / body (Google Fonts) |

No framework, no bundler, no dependencies to install.

## Local

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Open it in a real browser. Some embedded webviews block external images via
CSP and the page will look broken through no fault of its own.

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

Every image is currently hotlinked from Wikimedia Commons as a stand-in. They
are mostly **CC BY / CC BY-SA and require attribution if kept** (the candlelit
church interior is public domain). They should be swapped for the ensemble's
own photographs:

| Slot | Wants |
|---|---|
| Hero | The ensemble mid-performance at St Martin's, candlelit |
| Movement I | Justin with the cello; a close instrument detail |
| Movement II | The hall during a candlelight concert |
| Gallery ×5 | Performance shots, the nave, the players, the audience |
| On Screen ×2 | Angel Studios sessions, or Wolf Hall stills if cleared |

Drop files into `/assets`, point the `src` at them, keep the `srcset` widths.
The grade needs no changes.

**2. Fill in the real details.**

- Booking email is a placeholder: `bookings@locrianensemble.london`
- The concert diary links to St Martin's own listings — swap for the
  ensemble's dates once there's somewhere to point
- No upcoming-concerts data on the page yet

**3. The domain.** `locrianensemble.co.uk` has lapsed and now serves a
Vietnamese cockfighting streaming site. Worth recovering or replacing early.

**4. Nice to have.** Real audio excerpts instead of synthesised plucks; an
Open Graph image; a favicon.
