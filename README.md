# Doggo Web 🐶

A dog breed guessing game in an Android phone frame — a web remake of the
[Doggo Android app](https://github.com/aleexwong/Doggo), built to be embedded
on a personal site via iframe.

## Play

- **Endless Streak** — play until you miss.
- **60s Blitz** — identify as many breeds as you can in a minute.
- Keyboard: press <kbd>1</kbd>–<kbd>4</kbd> to answer.

Photos from the free [Dog.CEO API](https://dog.ceo/dog-api/). No auth — best
scores live in `localStorage`.

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

Players can post under a chosen name or one-tap **post as guest** (a stable
`Guest-####` handle). Names run through a client-side profanity filter
(`src/game/profanity.ts`) before posting; note this is a UX gate only — a
determined user can bypass any client check, so real enforcement still needs
a server-side validator (a Cloud Function or Firebase App Check).

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
