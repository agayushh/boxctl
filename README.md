# boxctl

Terminal Sokoban you can start with `npx boxctl`. Fifty crate-pushing puzzles, eight colour themes, undo, star ratings, and local high scores.

[![npm](https://img.shields.io/npm/v/boxctl?style=flat-square)](https://www.npmjs.com/package/boxctl)
[![license](https://img.shields.io/npm/l/boxctl?style=flat-square)](./LICENSE)
[![node](https://img.shields.io/node/v/boxctl?style=flat-square)](https://www.npmjs.com/package/boxctl)

```bash
npx boxctl
```

boxctl is a Sokoban game for the terminal, and a small TypeScript library with the same puzzles and a solver. Node.js 18 or newer is the only requirement. The published package has no runtime dependencies.

Install it once if you want the `boxctl` command on your PATH:

```bash
npm install -g boxctl
boxctl
```

## Contents

- [Play Sokoban in the terminal](#play-sokoban-in-the-terminal)
- [How to play](#how-to-play)
- [Commands](#commands)
- [Themes](#themes)
- [Stars and high scores](#stars-and-high-scores)
- [Microban puzzles](#microban-puzzles)
- [Sokoban solver](#sokoban-solver)
- [Use boxctl from TypeScript](#use-boxctl-from-typescript)
- [Develop](#develop)
- [Questions](#questions)
- [License](#license)

## Play Sokoban in the terminal

`npx boxctl` downloads the package and opens the game in the current terminal. The same command works on macOS, Linux, and Windows Terminal.

The playfield needs a terminal at least 60 columns by 18 rows. A larger window draws bigger tiles: brick walls, crates, goals, and a stick figure, in ANSI colour.

On first launch you register a player name. Scores for that name are kept on the machine.

## How to play

Sokoban is a crate-pushing puzzle. You are the warehouse worker. Push every crate onto a goal. You can push a crate by walking into it. You cannot pull, and you cannot step through walls.

This is level 1, The Little Yard, in the usual Sokoban characters. `@` is you, `$` is a crate, `.` is a goal, `*` is a crate already on a goal, and `#` is a wall.

```
####
# .#
#  ###
#*@  #
#  $ #
#  ###
####
```

| Key | Action |
| --- | --- |
| Arrow keys, WASD, or HJKL | Move |
| `u` | Undo the last move |
| `r` | Restart the level |
| `n` / `p` | Next / previous level |
| `t` | Cycle the colour theme |
| `?` | Show commands |
| `q` or Esc | Back out |

The menu covers Play, Select level, Themes, High scores, Players, How to play, and Quit.

## Commands

| Command | What it does |
| --- | --- |
| `boxctl` | Start the game |
| `boxctl --level 12` | Jump to a level (1 through 50) |
| `boxctl --theme neon` | Start in a theme |
| `boxctl --scores` | Print high scores for every player |
| `boxctl --list` | List the 50 levels |
| `boxctl --verify` | Solve every campaign map and print the result |
| `boxctl --help` | Show the same commands |

Theme ids: `classic`, `dungeon`, `neon`, `forest`, `ice`, `retro`, `midnight`, `sakura`.

## Themes

`t` during a level cycles the theme. The menu applies one until you change it. The choice is stored with your scores.

| Id | Name | Look |
| --- | --- | --- |
| `classic` | Warehouse | Bricks, crates, and a stick figure |
| `dungeon` | Dungeon | Torchlight and stone |
| `neon` | Neon | Night city warehouse |
| `forest` | Forest | Moss, crates, and clearings |
| `ice` | Ice | Cold storage |
| `retro` | Retro | Green phosphor terminal |
| `midnight` | Midnight | Quiet blue warehouse |
| `sakura` | Sakura | Pink crates at dusk |

## Stars and high scores

Each level has a par, taken from the built-in solver. Stars compare your move count with that par:

- ★★★ at or under par moves
- ★★☆ within 1.5× par
- ★☆☆ cleared

High scores live in `~/.boxctl/save.json`. Point `BOXCTL_SAVE` at another file if you want a different location. Several people can share a computer. Each player name keeps its own clears, stars, and times. `boxctl --scores` prints them.

## Microban puzzles

The campaign is the first 50 puzzles from **Microban** (April 2000) by David W. Skinner. Skinner wrote them as a beginner set: small boards, distinct ideas. He released the collection for use in Sokoban programs.

All 50 are open from the start. Skip with `n` / `p` or Select level, then come back.

| Difficulty | Levels |
| --- | --- |
| Easy | 14 |
| Medium | 21 |
| Hard | 10 |
| Expert | 5 |

The expert puzzles are 6, 8, 16, 35, and 36.

## Sokoban solver

`boxctl --verify` runs the solver on every campaign map and prints a move count and a push count for each one. The run ends with `50/50 solvable`. Par on each level is that solution.

The search walks the worker between pushes and tries crate pushes from the squares the worker can reach. It stops if a map would need more states than the cap. None of the fifty hit that cap.

## Use boxctl from TypeScript

The package exports the campaign, the parser, and the solver. After `npm install boxctl`:

```ts
import { LEVELS, parseLevel, solve } from "boxctl";

const level = LEVELS[0];
const solution = solve(parseLevel(level.map));
if (solution) {
  console.log(`${level.name}: ${solution.moves} moves, ${solution.pushes} pushes`);
}
```

`LEVELS` has all 50 maps, with `id`, `name`, `difficulty`, `parMoves`, and `parPushes`. `parseLevel` reads a Sokoban string (`#`, `@`, `$`, `.`, `*`, `+`). `solve` returns the path, or `null` if it stops at the state cap.

## Develop

```bash
npm install
npm test
npm run dev
npm run build
```

`npm test` checks the parser, the campaign, the controls, and that every par matches the solver. `npm run dev` starts the game from source.

## Questions

### How do I play Sokoban in the terminal?

Run `npx boxctl` in any terminal. You need Node.js 18 or newer. Nothing else is installed globally unless you want the `boxctl` command kept on your PATH.

### What is Sokoban?

Sokoban is a crate-pushing puzzle. The worker pushes boxes onto marked goals and cannot pull them. boxctl is that puzzle, drawn with terminal characters.

### Where does boxctl store high scores?

In `~/.boxctl/save.json`. Set the `BOXCTL_SAVE` environment variable to use a different path. Scores stay on that machine.

### Can I skip a Sokoban level?

Yes. Every puzzle is unlocked. Press `n` or `p` while you play, or choose Select level from the menu.

### Which Sokoban puzzles are included?

The first 50 Microban puzzles by David W. Skinner (April 2000): 14 easy, 21 medium, 10 hard, and 5 expert.

### Does boxctl include a Sokoban solver?

Yes. `boxctl --verify` solves the campaign. Programs can call `solve` on a parsed level and read back the moves and pushes.

## License

[MIT](./LICENSE). The Microban puzzles remain credited to David W. Skinner. See [NOTICE](./NOTICE).

Bugs and level notes: [github.com/agayushh/boxctl/issues](https://github.com/agayushh/boxctl/issues).
