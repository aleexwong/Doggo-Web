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

### Server-side enforcement (recommended)

`functions/` holds a Cloud Function (`submitScore`) that re-validates every
post — mode, score bounds, name length, the same profanity list, and a
best-effort per-IP rate limit — and writes with the Admin SDK. To make it the
enforced write path:

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
npm run test:e2e # headless-browser suite with Dog.CEO and Firestore mocked
```

CI (GitHub Actions) runs the build and the e2e suite on every push and PR.
Locally, point the suite at a pre-installed browser with
`CHROMIUM_PATH=/path/to/chromium npm run test:e2e`.

## Embed (Next.js site)

```html
<iframe
  src="https://<deployed-url>"
  title="Doggo dog breed guessing game"
  loading="lazy"
  allow="clipboard-write"
  style="width: 400px; aspect-ratio: 9 / 21; border: 0"
/>
```
