# Doggo Web 🐶

A dog breed guessing game in an Android phone frame — a web remake of the
[Doggo Android app](https://github.com/aleexwong/Doggo), built to be embedded
on a personal site via iframe.

## Play

- **Endless Streak** — one mistake ends the game.
- **60s Blitz** — answer as many as you can in a minute.
- Keyboard: press <kbd>1</kbd>–<kbd>4</kbd> to answer.

Photos from the free [Dog.CEO API](https://dog.ceo/dog-api/). No auth — best
scores live in `localStorage`.

## Three presentations

One build ships all three, chosen by a query string:

| URL | What you get |
| --- | --- |
| `/` or `?frame=arcade` | The screens behind the bulging glass of a CRT arcade monitor (**default**) |
| `?frame=phone` | The screens inside a drawn Android device |
| `?frame=web` | The same screens filling the browser, laid out responsively |

The **CRT** is a vertical cabinet monitor: a bezel, a tube whose corners bow
the way real glass does, and one overlay carrying what a photograph of a CRT
shows — the specular highlight where the glass bulges, scanlines, the RGB
aperture grille, the vignette where light travels further through thicker
glass at the edge, a slow roll bar, and a power LED. It defaults to the dark
theme, since a bright picture on a tube looks wrong, but a theme the player
has actually chosen still wins. Below 620px the tube stops holding 3:4 and
grows into the available height — on a phone a fixed 3:4 box costs the photo
half its area, and a taller portrait tube still reads as one. Turned sideways
the tube turns with the device and sits as a horizontal 4:3 cabinet, because
62vh of a 390px window is a 242px monitor. The leaderboard's own CRT treatment
switches off inside the tube rather than stacking two sets of scanlines.

The **frameless** version is a real web layout, not a stretched phone column:
a full-width header over a centred content column, which widens at ≥700px so a
tablet held upright doesn't read as a big phone. Where the room is wider than
it is tall, the game screen splits in two — photo on the left, question and
answers stacked on the right, one answer per row (see [Sizes](#sizes)). The
arcade leaderboard goes edge to edge and reads like an attract screen.

Credits sit under the frame where there is one to sit under, and on the home
screen where there isn't.

To swap which you get without a query string, change `DEFAULT_FRAME` in
[`src/game/layout.ts`](src/game/layout.ts) — that one constant is the whole
switch, `index.html` included. The script that picks a theme before first
paint runs before any module can load, so it can't import; instead a Vite
plugin injects the theme key, the surface colours and the list of frames that
want dark from [`src/game/appearance.ts`](src/game/appearance.ts) into the
HTML at build time.

## Design

The UI follows **Material 3 Expressive** (the current Android look) rather than
the flat-primary-app-bar Material of a few releases back:

- **Neutral surfaces, colour as signal.** The surface-container ramp is a
  plain grey ladder; the green only appears where it means something —
  primary actions, the correct answer, progress, the leader's row. No tint
  wash, no glow, no blur.
- Full M3 colour roles in a light **and** dark scheme. The theme follows the
  system by default; the app bar carries a toggle, and the choice persists in
  `localStorage`.
- Surface-coloured top app bar drawn edge to edge under the status bar, tonal
  containers instead of drop shadows, and the M3 shape scale.
- The photo *is* the card: it sizes itself and carries the radius and
  hairline, so nothing is cropped and there are no letterbox bands to fill.
- Expressive interaction: pill controls morph toward a squircle on press with
  a spring curve, buttons and rows carry state layers, and the leaderboard
  uses the grouped-list shape (large corners outside, tight corners inside).
- A wavy progress indicator for the blitz clock and the streak's progress to
  its next milestone, and a shape-morphing loading indicator.
- Everything is gated behind `prefers-reduced-motion`.

### Sizes

The same screens run inside a 384px device, a 640px tube and the whole
browser, so "is there room for two columns?" is a question about the app area,
not about the window. The game screen, and everything that has to give way on
a short screen, are `@container` queries on `.app-area` rather than media
queries:

- **Wider than tall** — container at least 380px wide and 5:4 — the photo
  takes the left, the question and the answers the right, one answer per row.
  That covers a desktop window, a tablet on its side, and a phone turned
  sideways, which stacked has no height left for a photo at all.
- **Short** — container 420px tall or less — the app bar and the progress
  strip lose their padding, the score and the question share one line, and the
  home hero becomes a header with the dog beside the title instead of above
  it. Screens that are stacks of fixed-height controls scroll rather than
  squash them: a 52px button pressed into 19px is not a button.
- Otherwise the phone layout: the photo above a 2×2 grid of answers.

The photo is placed absolutely inside its card, so its `max-height: 100%` has
the card's real height to resolve against. As a grid item the same percentage
had nothing definite to measure, and on a short screen the photo kept its
natural height and covered the answers below it — along with the taps meant
for them.

The drawn device keeps its 9:19.5 ratio and never stretches to fit its
contents, and its width has a floor: under about 300px the screens have
nothing to lay out in, so on a very short viewport the page scrolls rather
than shrink the device further.

Touch pointers get 44px targets (`@media (pointer: coarse)`), which is the one
thing here the app area can't tell you.

### Copy

In-app text is written to **CEFR B2**, so a non-native reader can play
without hitting a wall. Puns and culture references were the main casualties:
the rank ladder no longer says "Ruff Start", "Dog Whisperer" or "Fastest
Snoot in the West", and error text states plainly what failed. Three names
are kept as deliberate exceptions because they are the app's own labels and
the surrounding icons carry the meaning: **Blitz**, **Streak**, and **Top
Dogs**. `1UP` on the leaderboard is decoration, not instruction.

### Arcade leaderboard

**Top Dogs** is the one screen that steps outside the Material theme — it is a
cabinet high-score table, always dark whatever the app theme, drawn in a fixed
arcade palette that reads no `--m3-*` token:

- `1UP` / `HIGH SCORE` strip, a two-frame chomping Pac-Man, and a caret menu
  in place of the segmented button.
- `RANK · NAME · SCORE` columns, ordinal ranks (`1ST`, `2ND`…), zero-padded
  scores, and pellets as the dot leader. First three places take Pac-Man
  yellow, Inky cyan and Pinky pink.
- Loading is a line of pellets running past, as if something is eating them.
- CRT scanlines and tube vignette over the whole screen; the phone's system
  bars follow it dark.

**Anonymous players** are first-class here. A player who taps *post without a
name* gets a stable `Guest-####` handle, and the board renders those rows with
a ghost sprite (Blinky, Pinky, Inky, Clyde by position) and a dimmed name, so
they read as deliberate rather than broken. The blinking footer says how to
get on the board without an account.

### Device frame

The phone is drawn, not an image: a diagonal gradient across the padding ring
reads as a metal rail, with an earpiece slit in the top bezel, power above the
volume rocker on the right, a punch-hole camera in the display, and a black
mask between glass and rail.

## Leaderboard setup (Firebase)

Scores can be posted to a global "Top Dogs" leaderboard via the Firestore
REST API. It's optional — unset, the leaderboard UI hides itself entirely.

1. Create a [Firebase project](https://console.firebase.google.com) (or reuse
   the original [Doggo Android app](https://github.com/aleexwong/Doggo)'s).
2. In the console, create a **Cloud Firestore** database in production mode.
3. Grab the web app config values: the project ID and the Web API key
   (Project settings → General), for `VITE_FB_PROJECT_ID` and
   `VITE_FB_API_KEY`.
4. Copy `.env.example` to `.env` (or `.env.local`) and fill in those two
   variables — or set them in your deploy environment.
5. Deploy the security rules in [`firestore.rules`](firestore.rules):

   ```sh
   npx firebase-tools deploy --only firestore:rules --project <your-project-id>
   ```

The API key is a public client identifier, not a secret — abuse protection
lives in the Firestore rules (public read, validated create-only on the
`web_leaderboard_streak` and `web_leaderboard_blitz` collections).

Players can post under a chosen name (2–12 chars) or one-tap **post as guest**
(a stable `Guest-####` handle). Names run through a client-side profanity
filter (`src/game/profanity.ts`) before posting; note this is a UX gate only —
a determined user can bypass any client check.

The filter lowercases the name, undoes common leet substitutions, drops
everything that isn't a letter, and then looks for any blocked word as a
pattern that tolerates repeated letters — so `sh1t`, `f.u.c.k` and `fuuuck`
are all caught. It over-blocks by design: a name that merely contains a
blocked word (`Scunthorpe`, `Raccoon`) is refused, and posting as a guest is
the escape hatch.

### Server-side enforcement (recommended)

`functions/` holds a Cloud Function (`submitScore`) that re-validates every
post — mode, score bounds, name length, the same profanity list, and a
best-effort per-IP rate limit — and writes with the Admin SDK.

The word list really is the same list:
[`functions/profanity-words.json`](functions/profanity-words.json) is read by
both filters. It sits in `functions/` because `firebase deploy` packages only
that directory, so a copy anywhere else would never reach the server; Vite
inlines it into the client bundle at build time. Each side keeps its own few
lines of matching code, and `test/profanity-parity.test.ts` checks they still
agree on every word in the list.

To make the function the enforced write path:

1. Deploy it (needs the Blaze plan for outbound functions):

   ```sh
   cd functions && npm install
   npx firebase-tools deploy --only functions --project <your-project-id>
   ```
2. Set `VITE_LEADERBOARD_WRITE_URL` to the deployed function's URL and redeploy
   the site, so posts flow through the function.
3. In [`firestore.rules`](firestore.rules), change each `allow create` to
   `if false` and redeploy rules. Admin-SDK writes bypass rules, so direct
   client writes (which skip the checks) are now blocked.

Alternatively, [Firebase App Check](https://firebase.google.com/docs/app-check)
blocks requests that don't originate from your app with no code changes.

## Develop

```sh
npm install
npm run dev      # local dev server
npm run build    # typecheck + production build (dist/)
npm run lint     # ESLint
npm run format   # Prettier, in place (format:check to only report)
npm test         # unit tests — pure logic, no browser, under a second
npm run test:e2e # headless-browser suite with Dog.CEO and Firestore mocked
```

### Lint and format

Prettier owns formatting; `eslint-config-prettier` switches off every
stylistic ESLint rule, so anything ESLint reports is a real problem rather
than a matter of taste. Two things are deliberately left alone: the
stylesheet and the Markdown, both hand-arranged (see `.prettierignore`).

`eslint-plugin-react-hooks` runs at full strength, including the newer
`set-state-in-effect` rule. Two places suppress it with a comment saying
why — resetting photo state per round, and clearing the board when the
leaderboard mode changes.

### Tests

Two layers, because they catch different things:

- **Unit** (`test/`, `node --test` via [tsx](https://tsx.is)) covers the pure
  logic the e2e suite can only reach indirectly: every branch of the game
  reducer, breed-name formatting, distractor choice, the profanity filter and
  the leaderboard name rules. No build, no browser, no network.
- **E2E** (`e2e/run.mjs`, Playwright) drives the real app in headless Chromium
  with Dog.CEO and Firestore mocked at the network layer.

Node 22 or newer (the unit-test script uses the test runner's glob support).
Locally, point the e2e suite at a pre-installed browser with
`CHROMIUM_PATH=/path/to/chromium npm run test:e2e`.

### CI

[GitHub Actions](.github/workflows/ci.yml) runs on every push to `main` and
every PR, in three jobs:

| Job | What it runs |
| --- | --- |
| **Lint, types and unit tests** | `lint`, `format:check`, `build` (typecheck + bundle), `test`, and a syntax check on the Cloud Function |
| **End-to-end** | the Playwright suite in headless Chromium |
| **Dependency audit** | `npm audit --audit-level=high`, reporting only |

The fast job is split out so a broken PR fails in seconds instead of waiting
on a browser. The audit job does not fail the build: a vulnerable transitive
dependency is rarely something the PR in front of you can fix, and
[Dependabot](.github/dependabot.yml) is what raises the upgrade — weekly, for
the app, the function, and the actions themselves.

`npm audit` currently reports advisories against Vite's dev server (path
traversal and `server.fs.deny` bypass). They affect `npm run dev`, not the
static bundle that ships, and clearing them means Vite 5 → 8. That upgrade
belongs in its own change, with the e2e suite to check it.

Deployment is not automated here, because the hosting target lives outside
this repo. Firestore rules and the Cloud Function are deployed by hand; see
the leaderboard section above.

## Licence

[MIT](LICENSE). Dog photos come from [Dog.CEO](https://dog.ceo/dog-api/) and
carry their own terms.

## Embed (Next.js site)

The CRT is the default, and suits a block with room around it:

```html
<iframe
  src="https://<deployed-url>"
  title="Doggo dog breed guessing game"
  loading="lazy"
  allow="clipboard-write"
  style="width: 100%; max-width: 760px; height: 900px; border: 0"
/>
```

The device presentation suits a narrow slot on a page:

```html
<iframe
  src="https://<deployed-url>/?frame=phone"
  title="Doggo dog breed guessing game"
  loading="lazy"
  allow="clipboard-write"
  style="width: 400px; aspect-ratio: 9 / 21; border: 0"
/>
```

The frameless one suits a full-width block, and fills whatever box you give it:

```html
<iframe
  src="https://<deployed-url>/?frame=web"
  title="Doggo dog breed guessing game"
  loading="lazy"
  allow="clipboard-write"
  style="width: 100%; height: 720px; border: 0"
/>
```
