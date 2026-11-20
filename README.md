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

Each placeholder is replaced by saving the real file under the name listed below.

**Drawings** go in `public/drawings/`, with a transparent background.

- Keep the paper inside the outline, erase everything outside it. The white cut edge, the tab and the shadow are added for you.
- For line boil, save each tracing with a number: `coin-1.png`, `coin-2.png`, `coin-3.png`. One file (`coin.png`) works too, it just holds still.
- A cabinet's screen is whatever hole you cut in the drawing. Erase the screen area and the clip shows through it.
- PNG or WebP, about 1200 px on the long side.

| File (add `-1`, `-2`, `-3`) | What it is |
|---|---|
| `label-games`, `label-photography`, `label-creative-coding`, `label-design`, `label-research`, `label-about` | the six masking-tape labels |
| `label-unbuilt` | the "still cutting this one out" strip |
| `shelf-jar`, `shelf-roll` | loose things on the shelf |
| `cabinet-snikisnak`, `cabinet-patchwork`, `cabinet-duckie`, `cabinet-park`, `cabinet-jam`, `cabinet-red-dot-rescue` | the cabinets, each made from a cardboard box: the name lettered in marker, the screen cut right out, bottle-cap buttons, a taped joystick |
| `claw-machine`, `claw` | the cardboard claw machine inside the arcade (cut the glass out) and its claw |
| `claw-marquee` | the games box on the shelf is a big claw machine: its marquee, a long strip across the top (about 10 : 1), with the hole for its little screen cut out |
| `claw-panel` | its control panel, a long strip across the bottom (about 9 : 1): joystick, buttons, coin slot, the prize door at the left |
| `claw-hub`, `claw-prong` | its claw: the hub, and one prong (the left one; it is used three times) |
| `plush-raccoon`, `plush-chameleon`, `plush-hamster`, `plush-blob`, `plush-duck`, `plush-kitten` | the plush toys in it, one drawing each. Which game each comes from is the `plushies` list in [src/data/projects.js](src/data/projects.js) |
| `character-1`, `character-2`, `character-3` | characters hanging in the claw machine |
| `poster-snikisnak`, `poster-patchwork`, `poster-duckie` | the posters of your games on the arcade wall (the first three games) |
| `ticket-counter`, `fun-pass` | the ticket counter (its ticket machine on top, at the right) and the fun pass propped on it |
| `coin` | the paper coin |
| `cutout-spatial-equity` | the quiet cutout for Spatial Equity |
| `reel`, `reel-stand`, `crank` | photography: a film reel (cut its holes out), what it stands on, and the handle on the right-hand one |
| `projector` | photography: the slide projector, lens pointing right |
| `curtain` | photography: one red velvet curtain, drawn flat as one whole sheet (it is folded into 12 pleats; one tracing) |
| `curtain-valance` | photography: the pelmet across the top of the opening, a long strip (about 16 : 1) |
| `screen` | photography: the paper sheet the photos are projected onto (one tracing is enough) |
| `photo-corners` | photography: four photo corners on a transparent sheet, laid over every print |
| `pack-fall-2026`, `pack-spring-2026`, … (`pack-<set>`) | creative coding: a booster pack's wrapper, front. Draw it on a sheet about 480 × 700, filling the sheet, with the tear line 14 % down from the top (the strip above it is what tears off). One tracing: packs don't boil |
| `pack-back` | creative coding: the back of a pack, as it looks from behind (all packs share it) |
| `era-skyline`, `era-dune`, `era-leaf`, `era-moon`, `era-stamp` | creative coding: the era symbols, on the stand-in wrappers and on every card of their set |
| `card-back` | creative coding: the back every card shares (your doodle logo on navy), the shape of a card (63 × 88) |
| `sticker-fall-2026`, `sticker-fall-2024` | creative coding: the "new release!" and "1st edition — rare" stickers on those packs |
| `tag-<set>` | creative coding: optional, a step's handwritten tag (otherwise "fall 2026 · shanghai · 6 cards" is written for you) |
| `case-sign` | creative coding: the "please don't touch (jk, touch everything)" sign |
| `case-note` | creative coding: the "pick a pack and rip it open" note |
| `binder` | creative coding: the binder standing on the counter, cover facing you (the count is taped on for you) |
| `stall-<slug>` | design: a market stall's front (`stall-jewelry`, …), on a sheet the shape of the stand-in's: the walls and the pointed gable, with the door and the window cut right out where the stand-in has them |
| `sign-<slug>` | design: the sign over a stall, in your lettering |
| `decor-<slug>` | design: what hangs on a stall's front: the velvet bunting, the resin ornaments, the bike-wheel wreath (on the door), the lanterns |
| `tag-<slug>` | design: optional, the tag that pops up over a stall (otherwise its name and one line are written for you) |
| `market-moon`, `market-star`, `market-tree`, `market-tree-star`, `market-lamp`, `market-garland` | design: the moon, a star for the sky, the Christmas tree and its star, a street lamp, the pine garland along the top |
| `market-mug`, `market-steam`, `market-sled`, `market-robin`, `market-robin-hop` | design: the mug on a window sill and its steam (draw two or three tracings: it rises), the sled, the robin standing and mid-hop (same size of sheet for both) |
| `market-note` | design: the "click a stall to go inside" note hanging from the lights |
| `market-back`, `market-case` | design: the "← back to the market" sign inside every stall, and the case study note pinned up in it |
| `doodle`, `doodle-idle` | About: your doodle, making a peace sign for the camera (it is also the you in every polaroid, so one drawing changes them all), and the same you waiting between photos |
| `selfie-camera` | About: your camera on its tripod, lens pointing left (toward you). If its countdown light, flash or photo slot are not where the stand-in has them, change `LIGHT`, `FLASH` and `SLOT` at the top of [src/rooms/about.js](src/rooms/about.js) |
| `corkboard`, `map`, `map-heart` | About: the corkboard on the wall, the map pinned to it (the stand-in is drawn to fit your places; a map of your own has to put them where the stand-in does), and the little heart that pops up on a place |
| `backdrop-roller` | About: the wooden roller the painted backdrop hangs from (the backdrop itself is the place drawings below) |
| `countdown-3`, `countdown-2`, `countdown-1`, `flash-burst` | About: the paper badges that pop up over the camera as it counts down, and the starburst when it flashes |
| `memories-box`, `rug` | About: the shoebox the photos go into when the board is full, and the rug on the floor |
| `pushpin` | About: a pushpin seen from the front (`pushpin-1`, `-2`, `-3` are used as three colours) |
| `place-dhaka`, `place-abu-dhabi`, `place-shanghai`, `place-zhangjiajie` (`place-<name>`) | About: the places, square: each hangs as the painted backdrop behind you, and is the background of its polaroid. The list of places is `about.places` in [src/data/projects.js](src/data/projects.js) (a name, and where it is for the map); add one there and a drawing here |

If your projector drawing puts the lens or the slide slot somewhere other than the stand-in's, change `LENS` and `SLOT` at the top of [src/rooms/photography.js](src/rooms/photography.js) (fractions of the drawing's width and height).

**Scanned materials** go in `public/textures/` as JPG, up to about 2000 px.

| File | Used for |
|---|---|
| `paper.jpg` | the wall behind the shelf, and the paper cards |
| `cardboard.jpg` | the shelf and the outside of every box |
| `arcade-wall.jpg`, `carpet.jpg` | the arcade: its cardboard walls, and its patterned paper carpet |
| `velvet.jpg`, `manila.jpg` | inside photography, and art and research |
| `night.jpg`, `snow.jpg` | the design box: its walls (the night sky), and its snowy floor |
| `masking-tape.png` | the name strip and the tape buttons |
| `index-card.jpg` | the index card |
| `lining-<box>.jpg` | the inside of one box, if it should differ (`lining-about.jpg`) |
| `back-<box>.jpg` | a drawing that fills one box's back wall |
| `film-strip.png` | one frame's width of film, sprocket holes cut out (transparent), repeated along the strip |
| `display-case.jpg` | the inside of the creative coding display case |
| `counter-mat.jpg` | the mat on its counter, one whole picture, wide (about 2.3 : 1) |

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

**Sketches** (creative coding, the card shop) are trading cards that come in booster packs, one pack per semester.

- The packs are in [src/data/sets.js](src/data/sets.js): each one's name, place (only where you have confirmed it), era symbol, wrapper and card finish, and its step on the staircase (`order`, 1 at the bottom). A semester with nothing in it yet shows as a sealed "lost set" pack (`sealed`); adding a new semester is one more entry at the top.
- The cards are in [src/data/sketches.js](src/data/sketches.js): which pack each is in, its title and date, what it uses (mouse, mic, camera, hand, ai), a vibe word, one line, what you learned, and its p5 editor link (`editorUrl`), which "try it yourself" opens in a new tab. Mark your favourite in each pack `chase: true`: it comes out last, face down, and turns itself over. Unmarked, the last card listed is the chase card.

No sketch runs on the site itself. Each card's picture is a short recording, in `public/cards/`:

| File | What it is |
|---|---|
| `<slug>.mp4` | 5 to 10 seconds of the sketch being used, muted, landscape, under about 1.5 MB |
| `<slug>.webm` | optional: the same clip as WebM (used first where it plays) |
| `<slug>.jpg` | one frame of it, shown until the clip loads, in the binder, and on the graded slabs in the case |
| `<slug>-process-1.jpg` … | optional: one or two process pictures for the back of the card (list them under `process` in sketches.js) |

Until a card's clip is there, a stand-in pattern plays in its picture. The cards a visitor has opened are kept in their binder (in their browser) for next time.

**Design** (the Christmas market) is in [src/data/design.js](src/data/design.js): a stall per project, left to right, each with its sign, trim colour, what hangs on its front, one line, its case study (the problem, what you made, how, what you learned), and what is inside (`interiorType`: `jewelry`, `resin`, `workshop`, `classroom`, or `shop` for a plain display table). Adding a stall is adding an entry. Each stall's files go in `public/design/<slug>/`:

| File | What it is |
|---|---|
| `cover.jpg` | a photo for the list page |
| `piece-1.png`, `piece-2.png`, … | jewelry and resin: a photo of each piece, cut out (transparent PNG); also shown small in the stall's window |
| `piece-1.mp4` … | jewelry: optional, a short video of the piece turning; on its stand, dragging turns it back and forth |
| `piece-1-process-1.jpg` … | resin: a few process photos per piece (moulds, pigments, the pour) |
| `sketch-1.jpg` … | jewelry: design sketches, pinned to the cork board |
| `product.png` | bloompath: the product, cut out; where its numbered tags go (and what they say) is under `hotspots` |
| `research-1.jpg`, `user-notes-1.jpg`, `sketch-1.jpg` | bloompath: taped up on the workshop wall |
| `page-1.jpg`, `page-2.jpg`, … | wild china: the module's pages, in order; the desks open them as a workbook |

The module's title and goal (for the blackboard) are under `module` in the data file. Until a file is there, a stand-in drawing takes its place.

**Sound** is off until the visitor turns it on (the switch beside "hold still"). Every sound is made in the browser, so there are no sound files: the card shop's foil crinkle, tear, card flick, sparkle and binder snap; the market's sleigh bells, door creak, shop bell, footsteps in the snow and the wind.

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
src/rooms/            one file per room (arcade.js, photography.js, creative-coding.js, design.js, about.js);
                      plush-machine.js is the claw machine the games box is on the shelf
src/data/design.js    the Christmas market's stalls and words
src/data/sets.js      the creative coding booster packs, one per semester
src/data/sketches.js  the cards (your sketches) and the card shop's words
src/lib/trading-cards.js  the cards themselves (HTML over the scene), the binder, a card held up big
src/lib/shop.js       stand-in drawings for the card shop; nothing here should survive
src/lib/sketches.js   stand-in pictures for the cards; nothing here should survive
src/lib/market.js     stand-in drawings for the Christmas market; nothing here should survive
src/lib/market-ui.js  the paper overlays inside the stalls (case study, workbook, notes, magnifier)
src/lib/sound.js      the sound switch's sounds
src/lib/paper.js      cutout, tab, shadow, pop-up, line boil
src/lib/scraps.js     paper off-cuts that fly up when pieces pop and stay on the floor
src/lib/stepped.js    the 12 fps stop-motion clock
src/lib/loop.js       the little scene each box plays over and over on the shelf
src/lib/plushies.js   stand-in drawings for the claw machine and its plush toys; nothing here should survive
src/lib/polaroids.js  stand-in drawings for the About room: camera, corkboard, desk, the places; nothing here should survive
src/lib/camera.js     camera framing and moves
src/lib/overlay.js    buttons over the scene, the paper card, clips behind the screens
src/lib/pages.js      the project page template (shared by the cards and the list)
src/lib/placeholders.js   every stand-in drawing; nothing here should survive
src/data/projects.js  all the words
```
