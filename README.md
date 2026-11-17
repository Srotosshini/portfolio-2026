# The shoebox shelf

Srotosshini's portfolio: a shelf of handmade shoebox dioramas. Vite, Three.js, plain JavaScript.

Everything on screen right now is a **placeholder**. The site is built so that the real artwork goes in by dropping files into `public/` with the right name. No code changes.

## Run it

```bash
npm install
```

```bash
npm run dev
```

Then open http://localhost:5173. The page reloads by itself when a file in `public/` or `src/` changes.

```bash
npm run build
```

The build prints two numbers: how heavy the shelf landing is against the 3 MB budget, and how many placeholder texts are left.

## Putting the artwork in

Most placeholders print the file name they are waiting for. Save the real file under that name and the placeholder is gone.

**Drawings** go in `public/drawings/`, with a transparent background.

- Keep the paper inside the outline, erase everything outside it. The white cut edge, the tab and the shadow are added for you.
- For line boil, save each tracing with a number: `coin-1.png`, `coin-2.png`, `coin-3.png`. One file (`coin.png`) works too, it just holds still.
- A cabinet's screen is whatever hole you cut in the drawing. Erase the screen area and the clip shows through it.
- PNG or WebP, about 1200 px on the long side.

| File (add `-1`, `-2`, `-3`) | What it is |
|---|---|
| `label-games`, `label-photography`, `label-code`, `label-design`, `label-research`, `label-about` | the six masking-tape labels |
| `label-unbuilt` | the "still cutting this one out" strip |
| `shelf-jar`, `shelf-roll` | loose things on the shelf |
| `cabinet-snikisnak`, `cabinet-patchwork`, `cabinet-duckie`, `cabinet-park`, `cabinet-jam` | the five cereal-box cabinets |
| `claw-machine`, `claw` | the machine (cut the glass out) and the claw |
| `character-1`, `character-2`, `character-3` | characters hanging in the claw machine |
| `coin` | the paper coin |
| `cutout-spatial-equity` | the quiet cutout for Spatial Equity |
| `reel`, `reel-stand`, `crank` | photography: a film reel (cut its holes out), what it stands on, and the handle on the right-hand one |
| `projector` | photography: the slide projector, lens pointing right |
| `screen` | photography: the paper sheet the photos are projected onto (one tracing is enough) |
| `photo-corners` | photography: four photo corners on a transparent sheet, laid over every print |
| `self-portrait` | About |

If your projector drawing puts the lens or the slide slot somewhere other than the stand-in's, change `LENS` and `SLOT` at the top of [src/rooms/photography.js](src/rooms/photography.js) (fractions of the drawing's width and height).

**Scanned materials** go in `public/textures/` as JPG, up to about 2000 px.

| File | Used for |
|---|---|
| `paper.jpg` | the wall behind the shelf, and the paper cards |
| `cardboard.jpg` | the shelf and the outside of every box |
| `black-card.jpg` | inside the arcade and the dark box |
| `velvet.jpg`, `cutting-mat.jpg`, `manila.jpg` | inside photography, design, art and research |
| `masking-tape.png` | the name strip and the tape buttons |
| `index-card.jpg` | the index card |
| `lining-<box>.jpg` | the inside of one box, if it should differ (`lining-about.jpg`) |
| `back-<box>.jpg` | a drawing that fills one box's back wall (`back-games.jpg` replaces the stand-in neon) |
| `film-strip.png` | one frame's width of film, sprocket holes cut out (transparent), repeated along the strip |

**Everything else**

| File | What it is |
|---|---|
| `public/fonts/hand.woff2` | the handwriting font, used for every heading and label |
| `public/clips/<game>.mp4` | 20 to 40 seconds of gameplay, landscape |
| `public/clips/<game>.jpg` | one still from the clip, shown on the cabinet before a coin goes in |
| `public/process/<game>-1.jpg` … | process images |
| `public/photos/*.jpg` | photography: every image here goes onto the film, in file-name order (`01.jpg`, `02.jpg`, …) |
| `public/photos/thumbs/*.jpg` | optional smaller copies with the same names (about 600 px); the film uses these and only fetches the big one when it is projected |
| `public/cv.pdf` | the CV |

Game names in file names: `snikisnak`, `patchwork`, `duckie`, `park`, `jam`, `spatial-equity`.

Photos need no list. To give one a caption (and a description for people using screen readers), add it under `photos` in `src/data/projects.js`, by file name without the extension.

## Writing

All text is in one file: [src/data/projects.js](src/data/projects.js). Anything that starts with `TODO:` is a placeholder and shows up in grey pencil on the site. Replace the whole string with your own words.

When it is ready to send out, set `placeholders: false` near the top of that file. That hides anything still unfinished.

## Publishing

The workflow in `.github/workflows/deploy.yml` builds and publishes the site every time `main` is pushed. It needs one setting, once: in the GitHub repository, **Settings → Pages → Source → GitHub Actions**.

## Where things are

```
index.html            the shelf
list.html             the plain list (baked at build time, works without JavaScript)
src/main.js           scene setup, render loop, moving between shelf, box and project
src/shelf.js          the shelf and its six boxes
src/rooms/            one file per room (arcade.js, photography.js, about.js)
src/lib/paper.js      cutout, tab, shadow, pop-up, line boil
src/lib/scraps.js     paper off-cuts that fly up when pieces pop and stay on the floor
src/lib/stepped.js    the 12 fps stop-motion clock
src/lib/camera.js     camera framing and moves
src/lib/overlay.js    buttons over the scene, the paper card, clips behind the screens
src/lib/pages.js      the project page template (shared by the cards and the list)
src/lib/placeholders.js   every stand-in drawing; nothing here should survive
src/data/projects.js  all the words
```
