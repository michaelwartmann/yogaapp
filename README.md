# Mat Cat Yoga

A yoga practice guide for anyone. Newcomers choose an animal and answer a few questions (three are small tests
to try on the spot). They get a code like **calm young heron** / **ruhiger junger Reiher**: the animal is theirs
for good, its age is the level (baby → young → grown → wise → ancient), the first word is the pace
(calm → lively → swift). Each day they pick a theme and a length, can swap or leave out poses, practise with
the cat guiding live, and give two answers of feedback. The animal grows up when the poses feel easy and changes
pace with the tempo. No accounts: the phone remembers, and the code works on any other device.

## Run it

Open `index.html` in a browser. Everything (drawings, poses, composer, player) is inside that one file;
only the fonts come from Google Fonts.

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
| `tree.html` | Animal Tree: explorer for the code model (age × pace × theme × length) with sample classes |
| `src/profile.js` | Code words (42 animals EN/DE, ages, paces), levels, themes, care areas, assessment, feedback rules, profile → composer settings |
| `src/player.template.html` | Page layout, styles and app logic |
| `src/pose-engine.js` | Draws a figure (stick, bean or cat) from joint angles and interpolates between poses |
| `src/poses.js` | 71 poses: names in three languages, level, personal difficulty, cues, props, angles |
| `src/blocks.js` | Building blocks: warm-ups, salutations, flow modules, peak themes, connectors |
| `src/composer.js` | Composes a class around a peak, with memory, timing fit and a rules check |
| `src/generator.js` | Earlier generator, still used for its transition hints |
| `media/` | Tiny silent videos used as a fallback to keep the screen on |
| `build.py` | Rebuilds `index.html` from `src/` |

## Rebuild after changes

```
python3 build.py
```
