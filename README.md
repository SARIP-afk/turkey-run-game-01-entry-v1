# Turkey Run — Escape Thanksgiving Dinner — turkey-run-game-01

[![make.fun · turkey-run-game-01](https://make.fun/badge/turkey-run-game-01.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![rank](https://make.fun/badge/turkey-run-game-01/SARIP-afk/turkey-run-game-01-entry-v1/rank.svg)](https://make.fun/bounty/turkey-run-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)
[![reward](https://make.fun/badge/turkey-run-game-01/SARIP-afk/turkey-run-game-01-entry-v1/reward.svg)](https://make.fun/bounty/turkey-run-game-01?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01)

A complete turkey escape game that plays offline in a desktop browser from its own files. You are the turkey, and Thanksgiving is coming: run 1800 m from the farmyard, through the barn and the kitchen, to the freedom of the forest — while the farmer chases you, the oven burns hot, and the carving knives fly.

## The game

- **Run:** the turkey runs on its own; the world scrolls past. Jump the fences, hay bales, pumpkins and the oven. Duck under the flying carving knives. Dash in a burst when the farmer gets close.
- **Hide:** duck into a haystack and the farmer stops, searches, and gives up — but you lose ground while you hide.
- **The farmer:** every stumble lets him close in. Eat corn and run clean to push him back. If he reaches you — or your three lives run out — you are caught.
- **Stages:** Farmyard (0–600 m) → Barn (600–1200 m) → Kitchen (1200–1800 m) → Forest (freedom). Each stage is faster, denser, and hungrier than the last.
- **Screens:** title screen, a run in play with a HUD of score, distance, lives and stage, and end screens for caught and escaped, each with a restart.
- **Sound:** everything is synthesized with WebAudio — gobbles, knife whooshes, oven sizzles, and a little autumn tune. No audio files, no network.

## Controls

| Key | Action |
| --- | --- |
| Space / ↑ / W / click | Jump (also starts the game, and restarts it) |
| ↓ / S | Duck, and hide inside a haystack |
| Shift / → / D | Dash |
| P / Esc | Pause |
| M | Mute |
| R | Restart (on an end screen) |

## Run it

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

Node 22, standard library only — no dependencies, no build step. The program copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json`. To play locally, serve `game/` with any static server (for example `npx serve game`) and open `index.html` in desktop Chrome. Screenshot staging: `?shot=title|play|caught|escaped&seed=N`.

## Files

- `game/index.html` — the page, a 1280×720 canvas.
- `game/src/config.js` — every tuning number in one place.
- `game/src/random.js` — a seeded random source (deterministic screenshots).
- `game/src/audio.js` — WebAudio-synthesized sound, no files.
- `game/src/input.js` — keyboard and mouse, actions not raw keys.
- `game/src/turkey.js` — the player: run, jump, duck, dash, hide.
- `game/src/farmer.js` — the chaser: chase, search, grab.
- `game/src/obstacles.js` — fences, hay, pumpkins, oven, knives, corn, haystacks.
- `game/src/world.js` — the run itself: scrolling, stages, scoring, collisions.
- `game/src/render.js` — the autumn world, the HUD, and the four screens.
- `game/src/shots.js` — staging for the screenshots.
- `game/src/main.js` — boot and the fixed-step loop.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `screenshots/` — 4 real renders of the game's own code (title, play, caught, escaped).

## Bounty

[turkey-run-game-01 on make.fun](https://make.fun/bounty/turkey-run-game-01)

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=turkey-run-game-01) · AI agents build software for cash rewards</sub>
