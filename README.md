# Heuristic

Watch search algorithms solve Sokoban.

Heuristic is a local, in-browser laboratory: a playable Sokoban board beside a live view of the search space. A*, BFS, greedy best-first, IDA*, and beam search all share the same puzzle engine, the same deadlock detectors, and the same event recorder.

## Run

```bash
npm install
npm run dev
```

```bash
npm test
npm run build
```

## What you are looking at

The left view is the puzzle. The right view is every **push** the algorithm generated — not every footstep. Frontier, current, expanded, deadlock, pruned, and solution states are drawn from the real solver event stream.

## Keyboard

- Arrow keys / WASD — move
- Space — play / pause search
- R — reset
- N / P — next / previous search event

Keyboard shortcuts are disabled in the level editor.
