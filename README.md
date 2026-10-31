# Mat Cat Yoga

A yoga practice guide for anyone. Newcomers answer a few questions; three are small tests to try on the spot
(forward fold, plank, one-leg stand). These give their **nature** (strong but stiff, flexible, strong and flexible,
steady balance, all-rounder, gentle start), and they pick one of three animals for it. Their code, like
**lively young bear** / **munterer junger Bär**, holds everything: the animal is the nature (a bear's practice leans
towards mobility), its age is the level (baby → young → grown → wise → ancient), the first word is the pace
(calm → lively → swift). Each day they pick a theme and a length, can swap or leave out poses, practise with the cat
guiding live, and give two answers of feedback. No accounts: the phone remembers, and the code works anywhere.
A fixed 10-minute **Grundton** (Fundamental) moves every part of the body once, for days with little time.
The app speaks English and German (EN/DE switch at the top; it starts in the phone's language).

## Run it

Open `index.html` in a browser. Everything (drawings, poses, composer, player) is inside that one file;
only the fonts come from Google Fonts.

## Use it offline on a phone

Hosted on GitHub Pages (or any HTTPS address), the app installs like an app and then opens without internet:

1. Open the Pages address once while online and wait a few seconds (the service worker saves the app and fonts).
2. **Android / Chrome:** menu ⋮ → **Add to Home screen** (or **Install app**). **iPhone / Safari:** Share → **Add to Home Screen**.
3. Open it from the home screen icon. It runs full screen and works in flight mode.

When you push a new version, the phone picks it up the next time the app opens online. Your animal, settings and
practice log stay on the phone. *Surprise me* needs Claude and is not available offline.

## Publish on GitHub Pages

1. Create a repository and push these files.
2. On GitHub: **Settings → Pages → Build and deployment → Source: Deploy from a branch**, branch `main`, folder `/ (root)`.
3. After a minute the app is live at `https://<your-user>.github.io/<repo>/`.

On your own web address the screen-on lock and full screen work best (HTTPS, top-level page).

## Where data lives

- **Inside Claude** (published as an artifact): pose ratings and the practice log are stored with the artifact,
  so Claude can read them and the composer remembers your recent practices. *Surprise me* asks Claude to write a class.
- **On GitHub Pages or any other host**: there is no server. Ratings, settings and the practice log stay in the
  browser on that device (localStorage). *Surprise me* is hidden, since it needs Claude.

## Project layout

| File | What it is |
|---|---|
| `index.html` | The built app, ready to host |
| `tree.html` | Animal Tree: explorer for the code model (nature × age × pace, plus theme and length) with sample classes |
| `sw.js`, `manifest.webmanifest`, `icons/` | Offline support and the home-screen icon (`sw.js` is generated from `sw.template.js`) |
| `src/i18n.js` | German for transition hints, cues, props, block and section names |
| `src/profile.js` | Natures (6 × 3 animals, EN/DE), ages, paces, levels, themes, care areas, assessment and nature scoring, feedback rules, profile → composer settings |
| `src/player.template.html` | Page layout, styles and app logic |
| `src/pose-engine.js` | Draws a figure (stick, bean or cat) from joint angles and interpolates between poses |
| `src/poses.js` | 71 poses: names in three languages, level, personal difficulty, cues, props, angles |
| `src/blocks.js` | Building blocks: warm-ups, salutations, flow modules, peak themes, connectors |
| `src/composer.js` | Composes a class around a peak, with memory, timing fit and a rules check |
| `src/generator.js` | Earlier generator, still used for its transition hints |
| `media/` | Tiny silent videos used as a fallback to keep the screen on |
| `build.py` | Rebuilds `index.html`, `tree.html` and `sw.js` from `src/` |

## Rebuild after changes

```
python3 build.py
```
