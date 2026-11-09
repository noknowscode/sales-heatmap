# Sales Heatmap gallery banners

Banners for the Uno Platform Studio samples gallery, made from real captures of **Sales Heatmap** (`sales-heatmap`,
branch `studio` at `fa78d98`, Uno.Sdk 7.0.0-dev.132), published Release for WebAssembly and driven in headless
Chromium. Nothing in them is redrawn: the card, its heatmap, its figures and its copy are the app's own. Styling is only
around and on top of the captures: CSS device frames, crop, perspective, falloff, blur, light, reflection and grain.
The only added text is the display name in the optional titled banner.

The app is one card, so the set leans on the card itself: its heatmap, its figures with their drawn arrows, Light and
Dark at one held moment, the feed every two seconds, and the same card built with four palettes.

## Finals

All in `finals/`: every banner at 1x (1200 × 630) and 2x (2400 × 1260), and two heroes at 1920 × 1080.

| Banner | Family | What it shows | Source captures (state · theme · viewport · DPR · session) |
|---|---|---|---|
| `showcase-desk` | showcase | The card in a desktop window (Light) between a Dark phone and a Light phone, on the lavender day | window: card, held moment · Light · 1440×900 · 3 · S4 ; phones: one held moment in both themes · Dark and Light · 430×932 · 3 · S4 |
| `showcase-phones` | showcase | Three phones on the violet night: Dark, Light (centre, raised), Dark | left and centre: one held moment in both themes ; right: a later moment · 430×932 · 3 · S4 |
| `showcase-daynight` | showcase | The widget's own original banner, current: two tablets, Light and Dark, on a ground from lavender day to violet night; one moment, so both screens agree cell for cell | held moment M1 · Light and Dark · 600×800 · 3 · S1 |
| `focus-heatmap` | focused | The heatmap's well lifted out of the card, laid back on the app's own violet: 96 cells of the Primary role, each cell's heat its opacity | well of M1 (card-relative 26..374 × 69..279 CSS px) · Light · 600×800 · 3 · S1 |
| `focus-figures` | focused | The totals with their drawn arrows (Monthly $337,162 up 16.5 %, Yearly $3,300,515 down 4.8 %), Dark, focused like a tilt-shift lens: heatmap and regions fall out of focus | card of M1 at 1.5x · Dark · 600×800 · 3 · S1 |
| `focus-regions` | focused | The top regions (Los Angeles up 27.4 %, New York down 3.3 %, Canada up 0.5 %), lifted out of the card at 1.5x, the card behind out of focus | regions panel and card of M1 · Light · 600×800 · 3 · S1 |
| `focus-card` | focused | The whole card in Dark, flat and sharp, standing on a dark violet floor that mirrors it, back-lit | card of M1 · Dark · 600×800 · 3 · S1 |
| `stylized-split` (+ hero) | stylized | One card, Light and Dark, at one held moment, cut on one diagonal at the angle of the card's own drawn arrow (56.3°) | card of M1 · Light and Dark · 600×800 · 3 · S1 |
| `stylized-palettes` (+ hero) | stylized | The theme does the look: one card from four builds (shipped violet, teal, magenta, orange), alternating Light and Dark, each on a band of its own palette | cards: violet M1 · Light · S1 ; teal · Dark · T ; magenta · Light · M ; orange · Dark · O ; all 600×800 · 3 |
| `stylized-stack` | stylized | Every two seconds: the heatmap's well at six moments of one running card, 2 s of feed apart, stacked oldest to newest like layers of time | wells of six moments 2 s apart · Light · 600×800 · 3 · S2 |
| `stylized-split-titled` | titled (**optional**) | `stylized-split` with the card moved right and "Sales Heatmap" in Roboto Medium on the day side | as `stylized-split` |

Strongest: **`stylized-split`** and **`stylized-palettes`** (both have heroes).
- `stylized-split` shows the whole card in both themes at one held moment of the feed: the figures read the same on
  both sides of the cut and the heatmap continues cell for cell across it, only the theme changes. The cut runs at the
  angle of the card's own drawn change arrow. It is the clearest single picture of the widget and of "the theme does
  the look", and it reads at 1x.
- `stylized-palettes` is the one only this sample makes: the same card from four builds of the app, each with a
  different palette in `Styles/ColorPaletteOverride.json`, every colour (heat, surfaces, outline, text) following the
  palette. It is the most colourful banner in the set and stops the scroll; the bands keep each card on its own palette.

## Capture

**Build.** `git archive studio` into a scratch folder (the repository was not touched), then
`dotnet publish SalesHeatmap/SalesHeatmap.csproj -f net10.0-browserwasm -c Release`, served with
`python3 -m http.server` on 8930. The three palette builds (below) came from the same export with only
`Styles/ColorPaletteOverride.json` replaced (the Uno.Sdk `Dsp` feature generates `ColorPaletteOverride.xaml` from it at
build time; each build's log confirms the new PrimaryColor), served on 8932, 8934 and 8936; the export was reverted and
deleted afterwards.

**Holding a moment.** The feed publishes a snapshot every 2 s and the card eases its figures for up to about 1.9 s
after each one; on this shared machine the easing never finished between snapshots in real time, so no real-time
frame had settled figures. `src/tools/drive.js` (adapted from PAC's driver: one page kept open, steps sent to a local
port) therefore installs Playwright's page clock before the app loads. Time flows normally until a `freeze` step pauses
the page clock and advances it 50 ms at a time until the figures have held still, the next snapshot is still ahead and
the LIVE dot is in the lit half of its blink. The page is then frozen: the theme is switched (`prefers-color-scheme`,
which the app follows) and 32 ms of page time run so the new theme paints, and the shots of a pair come from the same
moment, with the same figures and the same heatmap. Nothing in the app is changed: the timers simply run in page time.

**Sessions** (one browser, one context and one running app each; their steps are in `src/tools/sessions/`):
- **S1** (default build, 600×800, DPR 3): moment M1 in Light and Dark. Source of the tablets, the cards, the well and
  the regions panel. (S1 also held a phone moment whose Light shot did not repaint; it was not used.)
- **S2** (default build, 600×800, DPR 3): the page clock paused, then six shots 2 s of page time apart, each in Dark
  and in Light. Source of the stack.
- **S4** (default build, 430×932 then 1440×900, DPR 3): the phone pair (one moment, both themes), a later Dark phone,
  then the desktop window. Source of both phone showcases and the window.
- **T**, **M**, **O** (teal, magenta and orange builds, 600×800, DPR 3): one held moment each, Light and Dark.
- An earlier session (S3) made phone and desktop captures with the LIVE dot in its dim half; they were replaced by S4
  and are not kept. Every capture used shows the dot lit.

`src/tools/crop.py` cuts `src/cap/` from the raw captures at their own pixels (cards, the well and the regions panel
at 3x) or downsampled with Lanczos (full screens and the palette cards at 2x). Nothing is upsampled.

## Palette

Every colour is the app's own, listed with its role in `src/frames.css`.
- Shipped palette, `SalesHeatmap/Styles/ColorPaletteOverride.json` (Light / Dark): Primary #5946D2 / #C7BFFF,
  PrimaryContainer #E5DEFF / #4129BA, OnPrimaryContainer #170065, OnPrimary (Dark) #2A009F, Background #FCFBFF /
  #1C1B1F, Surface #FFFFFF / #302D37, SurfaceVariant #F2EFF5 / #47464F, OnSurface #1C1B1F / #E6E1E5, OnSurfaceVariant
  #8B8494 / #C9C5D0, Outline #79747E / #928F99, OutlineVariant #C9C5D0 / #57545D, Error #B3261E / #FFB4AB.
- `SalesHeatmap/App.xaml`: PositiveColor #1E7D3A / #7BD88F (a rise).
- Grounds mix two of these at a time (`color-mix()`); glows and shadows are OnPrimaryContainer #170065, the Dark
  PrimaryContainer #4129BA and the Dark Primary at reduced alpha. Device bezels are a graphite gradient around the Dark
  Background #1C1B1F.
- **Palette-swap builds** (real output of the app built with a different palette; `stylized-palettes` only): each
  `ColorPaletteOverride.json` was generated from one seed with Google's material-color-utilities 0.3.0, Fidelity scheme
  (`src/tools/palette.mjs`), in the same Material Theme Builder shape the shipped file uses. Seeds: teal #00897B,
  magenta #C2185B, orange #E8710A. The bands use teal Dark PrimaryContainer #32A192 into Background #0F1413, magenta
  Light Background #FFF8F7 and SurfaceVariant #FED9DF, orange Dark PrimaryContainer #E8710A into Background #1B110B. The
  shipped violet card is the default build.

## Rules kept

- **Real pixels.** Every card, screen, well and panel is a capture of the running app; nothing is retouched. The
  reflection in `focus-card` is the same capture flipped, the blurs are the same captures blurred.
- **No enlarging.** Captures are taken at DPR 3. In the 2x export nothing is shown above its own pixels: the cards in
  `focus-figures` and the panel in `focus-regions` exactly 1:1 (1.5x CSS), the heatmap well about 0.95 of its pixels at
  the near edge of its tilt, the stack's orthographic planes at most 1:1, the split and titled cards 0.67, the palette
  cards 0.62 (stored at 2x), the `focus-card` card 0.63, the screens in the frames 0.47 to 0.63 (stored at 2x).
- **Clean states.** Seeded sample data (the app's own random feed from its seeded first snapshot), figures settled, no
  spinner, cursor, focus ring, scroll indicator or Studio toolbar (Release build). Chromium's scrollbars are hidden.
- **Generic frames.** Window bar and phone and tablet bezels are plain CSS: no notch, camera, buttons or logo.
- **Safe area.** Key content sits inside the central 90%.
- **Text.** Focused banners keep their text at 10 px or more at 1x (`focus-card` 10.3 px at its smallest, the
  1.5x banners 16 px and up). Showcase and stylized banners with whole screens or four cards carry smaller UI text, as
  the house style does.

## Review

Two bounded passes over every final at full size.
- Pass 1: the phones and the desktop window (session S3) caught the LIVE dot in the dim half of its blink: recaptured
  in S4, where `freeze` waits for the lit half (the blink and the feed run on fixed timers, so `freeze` now gives up
  and reloads when they never line up). `showcase-daynight`'s ground passed through a muddy mauve between day and
  night: the seam is now narrow, centred between the tablets and interpolated in OKLCH. `focus-card` was a plain
  card on a flat ground: it now stands on a mirrored floor with a back light.
- Pass 2: `showcase-daynight`'s OKLCH seam came out as a bright indigo stripe: it is now a short sRGB blend
  (42 % to 58 %) hidden between the tablets. `focus-regions` sat left with an empty right edge: card and panel moved
  right and the light recentred. `stylized-stack`'s two oldest layers had faded almost to the ground: their fade was
  reduced (38 % at most), so every layer still reads as a heatmap.

## Rebuild

`src/*.html` are the compositions (one per banner, the heroes as their own files), `src/cap/` the captures they use,
`src/frames.css` the shared frames and palette, `src/fonts/` the app's Roboto Medium (from the app's own
`Uno.Fonts.Roboto` package, the file the WebAssembly build ships; licence beside it). `src/tools/palette.mjs` writes a
palette-swap `ColorPaletteOverride.json` from a seed (it needs `@material/material-color-utilities` 0.3.0 on
`NODE_PATH`). Render everything with
`cd src && NODE_PATH=$(npm root -g) sh tools/render-all.sh` (Playwright, then `tools/pack.py` recompresses losslessly),
or one composition with `node tools/render.js <html> <out.png> <W> <H> <scale>`.

## Uncertain

- **Figures differ between sessions and moments.** The feed changes every 2 s. Pairs from one held moment agree exactly
  (the split, the tablets, each phone pair, each palette card's Light and Dark). Across moments they differ: in
  `showcase-desk` the window is a later moment than the phones, in `showcase-phones` the right phone is a later moment
  than the left and centre ones, and in `stylized-palettes` each card is its own build and session.
- **Page clock.** The held moments use Playwright's page clock (above). The app runs unchanged, but its timers ran in
  page time rather than wall time while a moment was held.
- **Palette builds** are real builds of the app with a generated palette, not shipped palettes; they appear only in
  `stylized-palettes` (and its hero). The orange build's first session was stopped because its blink never lit in the
  quiet part of a cycle; its cards come from a second instance, held without waiting for the blink, and the dot
  happens to be lit in both (as it is in every card used).
- **Viewports.** Phones are 430×932, not 390×844: at 390 wide the card scales to the full screen width, edge to edge,
  so its outline would meet the bezel; at 430 it sits at its own 400 px with a margin either side. The tablets are a 600×800 portrait screen, so the card fills two thirds of it (the
  original banner's tablets showed it at about half).
- **Region names.** The card's content names places (Los Angeles, New York, Canada), not brands; no third-party brand
  appears.
- **Tilt.** Only text-free planes are tilted (the heatmap well, the stack); every element with text is flat.
- The titled variant sets the display name in Roboto Medium, the Material face the card's own titles use, with
  "Heatmap" in the Primary colour.
