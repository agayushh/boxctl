# sokoban-tui

A terminal Sokoban game. Fifty small, solvable puzzles, eight colour themes, and local high scores — no graphics, just a keyboard.

Anyone with Node 18+ can play:

```
npx sokoban-tui
```

or install it and play anytime:

```
npm install -g sokoban-tui
sokoban
```

## Play

Arrow keys, WASD, or HJKL move. You push crates onto goals. You cannot pull. Undo with `u`, restart with `r`, commands with `?`, cycle themes with `t`, back out with `q`.

Every level is open from the start. Skip a hard one with `n` / `p` or the level picker. Stars are awarded against par:

- ★★★ at or under par moves
- ★★☆ within 1.5× par
- ★☆☆ cleared

Register a player name on first launch. Several people can share a machine; scores stay under `~/.sokoban-tui/save.json`.

## Themes

`classic` · `dungeon` · `neon` · `forest` · `ice` · `retro` · `midnight` · `sakura`

```
sokoban --theme neon
sokoban --level 12
sokoban --scores
sokoban --list
sokoban --verify
```

## Scripts

```
npm install
npm test
npm run dev
npm run build
```

## Campaign

The first version ships the first 50 puzzles from **Microban** (April 2000) by David W. Skinner. They were written as a beginner set: small, distinct, and surprisingly sharp. Skinner released the collection for use in Sokoban programs.

A built-in solver has a path for every map (`sokoban --verify`). None of the fifty are dead ends. A few are expert-length (6, 8, 16, 35, 36) — skip them and come back.

## License

MIT. Puzzles remain credited to David W. Skinner.
