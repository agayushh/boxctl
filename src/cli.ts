#!/usr/bin/env node
import { parseLevel } from "./engine/parse.js";
import { solve } from "./engine/solver.js";
import { LEVELS } from "./levels/campaign.js";
import { formatTime, loadSave, playerStats } from "./scores/store.js";
import { runApp } from "./tui/app.js";
import { THEMES } from "./tui/themes.js";

const HELP = `sokoban — terminal crate-pushing

Usage:
  sokoban                 start the game
  sokoban --level 12      jump to a level
  sokoban --theme neon    start with a theme
  sokoban --scores        print high scores
  sokoban --list          list the 50 levels
  sokoban --verify        solve every campaign map
  sokoban --help          show this help

Themes: ${THEMES.map((theme) => theme.id).join(", ")}
`;

function main(argv: string[]): void {
  let startLevel: number | undefined;
  let theme: string | undefined;
  let scores = false;
  let list = false;
  let verify = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i]!;
    if (arg === "--help" || arg === "-h") {
      process.stdout.write(HELP);
      return;
    }
    if (arg === "--scores") {
      scores = true;
      continue;
    }
    if (arg === "--list") {
      list = true;
      continue;
    }
    if (arg === "--verify") {
      verify = true;
      continue;
    }
    if (arg === "--level" || arg.startsWith("--level=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      const n = Number(value);
      if (!Number.isInteger(n) || n < 1 || n > LEVELS.length) {
        process.stderr.write(`Invalid level: ${value}\n`);
        process.exitCode = 1;
        return;
      }
      startLevel = n;
      continue;
    }
    if (arg === "--theme" || arg.startsWith("--theme=")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      if (!THEMES.some((item) => item.id === value)) {
        process.stderr.write(`Unknown theme: ${value}\n`);
        process.exitCode = 1;
        return;
      }
      theme = value;
      continue;
    }
    process.stderr.write(`Unknown argument: ${arg}\n${HELP}`);
    process.exitCode = 1;
    return;
  }

  if (list) {
    for (const level of LEVELS) {
      process.stdout.write(
        `${String(level.id).padStart(2, "0")}  ${level.difficulty.padEnd(8)}  ${level.name}\n`,
      );
    }
    return;
  }

  if (verify) {
    verifyCampaign();
    return;
  }

  if (scores) {
    printScores();
    return;
  }

  const appOptions: { startLevel?: number; theme?: string } = {};
  if (startLevel !== undefined) appOptions.startLevel = startLevel;
  if (theme !== undefined) appOptions.theme = theme;
  runApp(appOptions);
}

function verifyCampaign(): void {
  let failed = 0;
  for (const level of LEVELS) {
    const parsed = parseLevel(level.map);
    const solution = solve(parsed, 250_000);
    if (!solution) {
      failed += 1;
      process.stdout.write(
        `${String(level.id).padStart(2, "0")}  FAIL  ${level.name}\n`,
      );
      continue;
    }
    process.stdout.write(
      `${String(level.id).padStart(2, "0")}  ok    ${String(solution.moves).padStart(3)} moves  ${String(solution.pushes).padStart(2)} pushes  ${level.name}\n`,
    );
  }
  if (failed > 0) {
    process.stderr.write(`${failed} unsolved maps.\n`);
    process.exitCode = 1;
    return;
  }
  process.stdout.write("50/50 solvable\n");
}

function printScores(): void {
  const save = loadSave();
  const names = Object.keys(save.players);
  if (names.length === 0) {
    process.stdout.write("No scores yet. Play a few levels first.\n");
    return;
  }
  for (const name of names) {
    const stats = playerStats(save.players[name]!);
    process.stdout.write(
      `${name}: ${stats.completed}/50 cleared · ${stats.stars} stars · avg ${stats.avgBestMoves ?? "—"} moves · ${formatTime(stats.totalTimeMs)}\n`,
    );
  }
}

main(process.argv.slice(2));
