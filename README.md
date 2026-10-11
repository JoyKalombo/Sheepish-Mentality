# Sheepish Mentality — React edition

A mobile-friendly, real-time party game rebuilt from Joy Kalombo's original Streamlit Sheepish Mentality game. Built with **React 18**, Vite, Express, and Socket.IO.

Think like your friends: the single largest group of similar answers earns one point each. Tied largest groups and all-unique answers earn no points. Typed answers use a local, quantized MiniLM embedding model and cosine similarity (0.78 threshold). Multiple-choice options and player picks match exactly. Conservative number and negation checks reduce incorrect merges; semantic matching is approximate and may miss some synonyms. No paid API is used, and player answers are not sent to an external embedding service.

## Included

- All **565 original question entries** (560 unique prompts): open questions, multiple choice, pick a player, emotions, emojis, and phrase completion.
- Host-created rooms, name-only invite screens, player names, and category selection. Each room draws from a shuffled deck of unique prompts; repeats resume only after the selected bank is exhausted.
- Live lobbies, private answer submission and editing, automatic reveals when all connected players submit, host fallback reveals, and cumulative scoreboards.
- Server-controlled scoring and round transitions: revealing twice cannot award points twice.
- Session reconnection in the same browser tab. Refreshing retains your player identity.
- Responsive layouts and keyboard-accessible forms.

## Run locally

Use Node.js 22 (minimum 20.9).

```sh
npm install
npm run dev
```

Open http://localhost:5173. Create a room, then join from a second browser or an incognito window. For phones on the same Wi-Fi, use your computer's LAN IP at port 5173 and allow local network connections.

```sh
npm test
npm run build
npm start
```

The production server serves the React build and multiplayer connection together at http://localhost:3001 (or `PORT`).

## Deploy

Use a Node host that supports persistent WebSocket connections, such as a web service. Set the build command to `npm ci && npm run build` and start command to `npm start`. The resulting HTTPS URL works on phones and computers without installation. Static hosting alone cannot run the multiplayer server.

This version uses **in-memory rooms** instead of the original Firebase database. Rooms and scores reset when the server restarts; run one server instance. Inactive rooms expire after 24 hours. Durable storage, host transfer, moderation, rate limiting, and installable PWA/native packaging are future work before a large public launch. React makes the interface suitable for those later additions, but this repository is a web app rather than an App Store package.

## Semantic matching

The free model is `Xenova/all-MiniLM-L6-v2`, loaded through Transformers.js with q8 quantization. The build downloads its weights into an ignored `server/model-cache/` directory; server startup loads it before accepting connections. One CPU inference runs at a time to limit memory use. Cosine matching requires every member of a group to match every other member, reducing chain merges. This is semantic answer comparison, not RAG: the game does not retrieve documents or generate answers.

## Migration notes

Original Streamlit files remain untouched. Question text was copied from `/Users/jk/HerdMentality/questions-*.json`. Firebase service-account files, environment variables, and Streamlit secrets were deliberately excluded. The new server does not require Firebase credentials. The original host workflow and scoring are retained while replacing timed page refreshes with real-time events.

No software license has been selected yet.
