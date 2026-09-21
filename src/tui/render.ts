import { cellKind, parseLevel } from "../engine/parse.js";
import type { Board, CellKind, Difficulty, GameState, Level } from "../engine/types.js";
import type { PlayerSave, SaveFile } from "../scores/store.js";
import { formatTime, isUnlocked, playerStats, starBar } from "../scores/store.js";
import { LEVELS, LEVEL_COUNT } from "../levels/campaign.js";
import {
  clip,
  fg,
  pad,
  paint,
  paintBar,
  repeat,
  surround,
  visibleWidth,
} from "./ansi.js";
import type { Theme } from "./themes.js";
import { THEMES } from "./themes.js";
import type { Session } from "../engine/game.js";

export type MenuId =
  | "play"
  | "levels"
  | "themes"
  | "scores"
  | "profiles"
  | "help"
  | "quit";

export const MENU_ITEMS: { id: MenuId; label: string }[] = [
  { id: "play", label: "Play" },
  { id: "levels", label: "Select level" },
  { id: "themes", label: "Themes" },
  { id: "scores", label: "High scores" },
  { id: "profiles", label: "Players" },
  { id: "help", label: "How to play" },
  { id: "quit", label: "Quit" },
];

export type Scale = { w: number; h: number };

export function fitScale(
  boardW: number,
  boardH: number,
  maxW: number,
  maxH: number,
): Scale {
  if (boardW * 4 + 2 <= maxW && boardH * 2 + 2 <= maxH) return { w: 4, h: 2 };
  return { w: 2, h: 1 };
}

export function renderBoard(
  board: Board,
  state: GameState,
  theme: Theme,
  color: boolean,
  scale: Scale = { w: 2, h: 1 },
): string[] {
  const bounds = occupiedBounds(board);
  const lines: string[] = Array.from(
    { length: (bounds.y1 - bounds.y0 + 1) * scale.h },
    () => "",
  );

  for (let y = bounds.y0; y <= bounds.y1; y += 1) {
    const sprites: string[][] = [];
    for (let x = bounds.x0; x <= bounds.x1; x += 1) {
      const cell = (y << 8) | x;
      sprites.push(sprite(cellKind(board, state, cell), theme, scale, color, x, y));
    }
    for (let r = 0; r < scale.h; r += 1) {
      lines[(y - bounds.y0) * scale.h + r] = sprites.map((cell) => cell[r]!).join("");
    }
  }
  return lines;
}

function occupiedBounds(board: Board): { x0: number; x1: number; y0: number; y1: number } {
  let x0 = board.width;
  let y0 = board.height;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < board.height; y += 1) {
    for (let x = 0; x < board.width; x += 1) {
      const cell = (y << 8) | x;
      if (board.walls.has(cell) || board.floors.has(cell) || board.goals.has(cell)) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  if (x1 < x0) return { x0: 0, x1: board.width - 1, y0: 0, y1: board.height - 1 };
  return { x0, x1, y0, y1 };
}

export function renderMenu(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  index: number;
  player: PlayerSave | null;
}): string {
  const { theme, color, index, player, cols, rows } = options;
  const stats = playerStats(player);
  const next = continueLevel(player);
  const header = chromeBar(
    cols,
    theme,
    color,
    " SOKOBAN",
    `${player?.name ?? "guest"}  ·  ${stats.completed}/${LEVEL_COUNT}  ·  ${theme.name} `,
  );
  const footer = keysBar(cols, theme, color, "↑↓ select    enter confirm    q quit");

  const menu = MENU_ITEMS.map((item, i) => {
    const selected = i === index;
    const label = selected ? `  ▸ ${item.label}` : `    ${item.label}`;
    const line = pad(label, 40);
    return selected
      ? paint(line, { fg: theme.title, bg: theme.accent, enabled: color })
      : colorize(theme, color, "text", line);
  });

  const hint = MENU_HINTS[MENU_ITEMS[index]!.id];
  const left = [
    "",
    colorize(theme, color, "muted", "  campaign"),
    "",
    ...menu,
    "",
    colorize(theme, color, "muted", `  ${hint}`),
  ];

  const preview = framedBoard(next, theme, color, Math.max(24, cols - 40), Math.max(8, rows - 8));
  const right = [
    colorize(theme, color, "muted", `  continue  ${String(next.id).padStart(2, "0")}`),
    colorize(theme, color, "title", `  ${next.name}`),
    colorize(
      theme,
      color,
      "muted",
      `  ${difficultyLabel(next.difficulty)}  ·  par ${next.parMoves}/${next.parPushes}`,
    ),
    "",
    ...preview.map((line) => `  ${line}`),
  ];

  const stage = splitStage(left, right, cols, theme, color);
  return assemble(cols, rows, theme, color, [header], stage, [footer], "top");
}

export function renderPlay(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  session: Session;
  player: PlayerSave | null;
  win: boolean;
  newBest: boolean;
}): string {
  const { theme, color, session, win, cols, rows } = options;
  const level = session.level;
  const header = [
    colorize(theme, color, "muted", ` ${String(level.id).padStart(2, "0")}`),
    colorize(theme, color, "title", ` ${level.name}`),
  ];

  const statsLine = ` ${session.moves} moves   ${session.pushes} pushes   ${session.placed}/${session.totalBoxes}   ${formatTime(session.elapsedMs)}`;
  const footer = win
    ? [
        colorize(
          theme,
          color,
          "ok",
          ` cleared  ${session.moves} moves · ${session.pushes} pushes${options.newBest ? "  ·  new best" : ""}`,
        ),
        colorize(theme, color, "muted", " enter next   r retry   q menu"),
      ]
    : [
        colorize(theme, color, "muted", statsLine),
        colorize(theme, color, "muted", " arrows move   u undo   r restart   q menu"),
      ];

  const stageH = Math.max(6, rows - header.length - footer.length);
  const innerW = Math.max(10, cols - 4);
  const innerH = Math.max(4, stageH - 2);
  const bounds = occupiedBounds(session.board);
  const scale = fitScale(bounds.x1 - bounds.x0 + 1, bounds.y1 - bounds.y0 + 1, innerW, innerH);
  let board = renderBoard(session.board, session.state, theme, color, scale);
  if (win) board = overlayCard(board, winCard(session, options.newBest, theme, color), theme, color);
  return quietStage(cols, rows, theme, color, header, board, footer);
}

export function renderLevels(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  index: number;
  player: PlayerSave | null;
}): string {
  const { theme, color, index, player, cols, rows } = options;
  const current = LEVELS[index]!;
  const record = player?.levels[String(current.id)];
  const header = chromeBar(cols, theme, color, " SELECT LEVEL", `${player?.name ?? "guest"}  ·  ${theme.name} `);
  const footer = keysBar(cols, theme, color, "arrows move    enter play    q back");

  const gridCols = cols >= 120 ? 10 : 5;
  const grid: string[] = [];
  for (let row = 0; row < Math.ceil(LEVELS.length / gridCols); row += 1) {
    let line = " ";
    for (let col = 0; col < gridCols; col += 1) {
      const i = row * gridCols + col;
      const level = LEVELS[i];
      if (!level) break;
      const selected = i === index;
      const done = (player?.levels[String(level.id)]?.completions ?? 0) > 0;
      const locked = !isUnlocked(player, level.id);
      const label = String(level.id).padStart(2, "0");
      const cell = selected ? ` ${label} ` : done ? ` ${label}*` : locked ? ` ${label}·` : ` ${label} `;
      const padded = pad(cell, 5);
      if (selected) line += paint(padded, { fg: theme.title, bg: theme.accent, enabled: color });
      else if (locked) line += colorize(theme, color, "muted", padded);
      else if (done) line += colorize(theme, color, "ok", padded);
      else line += colorize(theme, color, "text", padded);
    }
    grid.push(line);
  }

  const status = record
    ? `best ${record.bestMoves} moves · ${record.bestPushes} pushes · ${starBar(record.bestStars)} · ${record.completions} clears`
    : isUnlocked(player, current.id)
      ? "not yet cleared"
      : "locked — clear the previous level first";

  const left = [
    "",
    ...grid,
    "",
    colorize(theme, color, "title", `  ${String(current.id).padStart(2, "0")}  ${current.name}`),
    colorize(theme, color, "muted", `  ${difficultyLabel(current.difficulty)}  ·  par ${current.parMoves}/${current.parPushes}`),
    colorize(theme, color, "muted", `  ${status}`),
  ];
  const preview = framedBoard(current, theme, color, Math.max(24, cols - 56), Math.max(8, rows - 8));
  const right = ["", ...preview.map((line) => `  ${line}`)];
  return assemble(cols, rows, theme, color, [header], splitStage(left, right, cols, theme, color), [footer], "top");
}

export function renderThemes(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  index: number;
}): string {
  const { color, index, cols, rows } = options;
  const selected = THEMES[index]!;
  const header = chromeBar(cols, selected, color, " THEMES", `${selected.name} `);
  const footer = keysBar(cols, selected, color, "↑↓ choose    enter apply    q back");
  const list = THEMES.map((theme, i) => {
    const on = i === index;
    const line = pad(`${on ? "  ▸ " : "    "}${pad(theme.name, 12)}  ${theme.tagline}`, 42);
    return on
      ? paint(line, { fg: theme.title, bg: theme.accent, enabled: color })
      : colorize(options.theme, color, "text", line);
  });
  const sample = LEVELS[1]!;
  const preview = framedBoard(sample, selected, color, Math.max(24, cols - 50), Math.max(8, rows - 8));
  const left = ["", ...list];
  const right = [
    colorize(selected, color, "title", `  ${selected.name}`),
    colorize(selected, color, "muted", `  ${selected.tagline}`),
    "",
    ...preview.map((line) => `  ${line}`),
  ];
  return assemble(cols, rows, selected, color, [header], splitStage(left, right, cols, selected, color), [footer], "top");
}

export function renderScores(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  save: SaveFile;
}): string {
  const { theme, color, save, cols, rows } = options;
  const player = save.players[save.activePlayer];
  const stats = playerStats(player ?? null);
  const header = chromeBar(cols, theme, color, " HIGH SCORES", `${save.activePlayer || "guest"} `);
  const footer = keysBar(cols, theme, color, "q back");

  const hero = [
    metric(theme, color, "CLEARED", `${stats.completed}/${LEVEL_COUNT}`),
    metric(theme, color, "STARS", `${stats.stars}/${LEVEL_COUNT * 3}`),
    metric(theme, color, "AVG BEST", `${fmtAvg(stats.avgBestMoves)} moves`),
    metric(theme, color, "AVG ALL", `${fmtAvg(stats.avgAllMoves)} / clear`),
    metric(theme, color, "TIME", formatTime(stats.totalTimeMs)),
  ].join("      ");

  const ranking = Object.values(save.players)
    .map((item) => ({ name: item.name, stats: playerStats(item) }))
    .sort((a, b) => b.stats.completed - a.stats.completed || b.stats.stars - a.stats.stars);

  const table: string[] = [
    "",
    surround(hero, cols, { bg: theme.bg ?? 232, enabled: color }),
    "",
    colorize(theme, color, "accent", "  this machine"),
    colorize(theme, color, "muted", `  ${pad("name", 16)} ${pad("cleared", 10)} ${pad("stars", 8)} ${pad("avg moves", 12)}`),
  ];
  if (ranking.length === 0) {
    table.push(colorize(theme, color, "muted", "  no scores yet"));
  } else {
    for (const row of ranking.slice(0, 8)) {
      table.push(
        colorize(
          theme,
          color,
          "text",
          `  ${pad(row.name, 16)} ${pad(String(row.stats.completed), 10)} ${pad(String(row.stats.stars), 8)} ${pad(fmtAvg(row.stats.avgBestMoves), 12)}`,
        ),
      );
    }
  }
  if (player) {
    const recent = LEVELS.filter((level) => (player.levels[String(level.id)]?.completions ?? 0) > 0).slice(-10);
    if (recent.length > 0) {
      table.push("");
      table.push(colorize(theme, color, "accent", "  your clears"));
      for (const level of recent) {
        const rec = player.levels[String(level.id)]!;
        table.push(
          colorize(
            theme,
            color,
            "text",
            `  ${String(level.id).padStart(2, "0")}  ${pad(level.name, 16)}  ${starBar(rec.bestStars)}   ${rec.bestMoves}m  ${rec.bestPushes}p   ${formatTime(rec.bestTimeMs)}`,
          ),
        );
      }
    }
  }
  return assemble(cols, rows, theme, color, [header], table, [footer], "top");
}

export function renderHelp(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
}): string {
  const { theme, color, cols, rows } = options;
  const header = chromeBar(cols, theme, color, " HOW TO PLAY", `${theme.name} `);
  const footer = keysBar(cols, theme, color, "q back");
  const rules = [
    colorize(theme, color, "title", "  The warehouse"),
    colorize(theme, color, "text", "  You are the stick figure. Push every crate onto a dot."),
    colorize(theme, color, "text", "  You can only push — never pull."),
    colorize(theme, color, "text", "  A crate jammed in a corner is usually stuck."),
    "",
    colorize(theme, color, "title", "  Stars"),
    colorize(theme, color, "text", "  ★★★   at or under par moves"),
    colorize(theme, color, "text", "  ★★☆   within 1.5× par"),
    colorize(theme, color, "text", "  ★☆☆   cleared"),
  ];
  const keys = [
    colorize(theme, color, "title", "  Keys"),
    colorize(theme, color, "text", "  arrows   WASD   HJKL     move"),
    colorize(theme, color, "text", "  U                        undo"),
    colorize(theme, color, "text", "  R                        restart"),
    colorize(theme, color, "text", "  N / P                    next / previous"),
    colorize(theme, color, "text", "  T                        cycle theme"),
    colorize(theme, color, "text", "  Q / Esc                  back"),
    "",
    colorize(theme, color, "muted", "  Microban puzzles by David W. Skinner."),
    colorize(theme, color, "muted", "  Scores:  ~/.sokoban-tui/save.json"),
  ];
  return assemble(cols, rows, theme, color, [header], splitStage(rules, keys, cols, theme, color), [footer], "top");
}

export function renderProfiles(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  save: SaveFile;
  index: number;
  creating: boolean;
  draft: string;
}): string {
  const { theme, color, save, index, creating, draft, cols, rows } = options;
  const names = Object.keys(save.players);
  const header = chromeBar(cols, theme, color, " PLAYERS", `${save.activePlayer || "guest"} `);
  const footer = keysBar(
    cols,
    theme,
    color,
    creating ? "type a name    enter save    esc cancel" : "enter switch    n new player    q back",
  );
  const list =
    names.length === 0
      ? [colorize(theme, color, "muted", "  no players yet")]
      : names.map((name, i) => {
          const selected = !creating && i === index;
          const stats = playerStats(save.players[name]!);
          const active = name === save.activePlayer ? "  ·  active" : "";
          const line = pad(`${selected ? "  ▸ " : "    "}${name}${active}    ${stats.completed} cleared`, 48);
          return selected
            ? paint(line, { fg: theme.title, bg: theme.accent, enabled: color })
            : colorize(theme, color, "text", line);
        });
  const body = [
    "",
    ...list,
    "",
    creating
      ? colorize(theme, color, "accent", `  name  ${draft}█`)
      : colorize(theme, color, "muted", "  several people can share this machine"),
  ];
  return assemble(cols, rows, theme, color, [header], body, [footer], "top");
}

export function renderName(options: {
  cols: number;
  rows: number;
  theme: Theme;
  color: boolean;
  draft: string;
}): string {
  const { theme, color, draft, cols, rows } = options;
  const header = chromeBar(cols, theme, color, " SOKOBAN", "new player ");
  const footer = keysBar(cols, theme, color, "type a name    enter to start");
  const width = 42;
  const card = [
    colorize(theme, color, "muted", `┌${repeat("─", width - 2)}┐`),
    colorize(theme, color, "muted", `│${pad("", width - 2)}│`),
    colorize(theme, color, "title", `│${pad("S O K O B A N", width - 2, "center")}│`),
    colorize(theme, color, "muted", `│${pad("register a player to keep scores", width - 2, "center")}│`),
    colorize(theme, color, "muted", `│${pad("", width - 2)}│`),
    colorize(theme, color, "accent", `│${pad(`name  ${draft}█`, width - 2, "center")}│`),
    colorize(theme, color, "muted", `│${pad("", width - 2)}│`),
    colorize(theme, color, "muted", `└${repeat("─", width - 2)}┘`),
  ];
  return assemble(cols, rows, theme, color, [header], card, [footer]);
}

export function renderTooSmall(cols: number, rows: number, theme: Theme, color: boolean): string {
  const header = chromeBar(cols, theme, color, " SOKOBAN", "");
  const body = [
    colorize(theme, color, "warn", "  Terminal is too small."),
    colorize(theme, color, "muted", `  Need at least 60×18. Now ${cols}×${rows}.`),
  ];
  return assemble(cols, rows, theme, color, [header], body, [], "top");
}

const MENU_HINTS: Record<MenuId, string> = {
  play: "jump into the next unsolved puzzle",
  levels: "browse and replay the campaign",
  themes: "classic, neon, ice, and more",
  scores: "highs, averages, local ranking",
  profiles: "switch or add a player",
  help: "rules, keys, and stars",
  quit: "save and leave",
};

function sprite(
  kind: CellKind,
  theme: Theme,
  scale: Scale,
  color: boolean,
  x: number,
  y: number,
): string[] {
  if (scale.w === 2 && scale.h === 1) return compactTile(kind, theme, color);
  return warehouseTile(kind, theme, color, x, y);
}

function compactTile(kind: CellKind, theme: Theme, color: boolean): string[] {
  const glyph =
    kind === "wall"
      ? "██"
      : kind === "box"
        ? "[]"
        : kind === "box-on-goal"
          ? "<>"
          : kind === "goal"
            ? "● "
            : kind === "player" || kind === "player-on-goal"
              ? "o "
              : "  ";
  const bg =
    kind === "void"
      ? (theme.bg ?? 16)
      : kind === "wall"
        ? theme.colors.wall
        : theme.floorBg;
  return [paint(glyph, { fg: theme.colors[kind], bg, enabled: color })];
}

function warehouseTile(
  kind: CellKind,
  theme: Theme,
  color: boolean,
  x: number,
  y: number,
): string[] {
  const floor = theme.floorBg;
  const brick = theme.colors.wall;
  const mortar = theme.muted;
  const ink = 16;
  const crate = kind === "box-on-goal" ? theme.colors["box-on-goal"] : theme.colors.box;
  const fill = (text: string, fgcode: number, bg: number) =>
    paint(text, { fg: fgcode, bg, enabled: color });

  if (kind === "void") {
    const bg = theme.bg ?? 16;
    return [fill("    ", bg, bg), fill("    ", bg, bg)];
  }
  if (kind === "wall") {
    const a = (x + y) % 2 === 0;
    return a
      ? [fill("▀█▀█", brick, mortar), fill("█▀█▀", brick, mortar)]
      : [fill("█▀█▀", brick, mortar), fill("▀█▀█", brick, mortar)];
  }
  if (kind === "box" || kind === "box-on-goal") {
    return [fill("┌──┐", ink, crate), fill("│><│", ink, crate)];
  }
  if (kind === "player" || kind === "player-on-goal") {
    const bg = kind === "player-on-goal" ? theme.colors.goal : floor;
    return [fill(" o  ", theme.colors.player, bg), fill("/|\\ ", theme.colors.player, bg)];
  }
  if (kind === "goal") {
    return [fill("    ", theme.colors.goal, floor), fill(" ●  ", theme.colors.goal, floor)];
  }
  return [fill("    ", floor, floor), fill("    ", floor, floor)];
}

function quietStage(
  cols: number,
  rows: number,
  theme: Theme,
  color: boolean,
  header: string[],
  stage: string[],
  footer: string[],
): string {
  const bg = theme.bg ?? 16;
  const blank = paint(" ".repeat(Math.max(0, cols)), { bg, enabled: color });
  const line = (text: string) => surround(text, cols, { bg, enabled: color });
  const body = [...header.map(line), "", ...stage.map(line), "", ...footer.map(line)];
  const extra = rows - body.length;
  const top = Math.max(0, Math.floor(extra / 2));
  const lines = [
    ...Array.from({ length: top }, () => blank),
    ...body,
    ...Array.from({ length: Math.max(0, rows - top - body.length) }, () => blank),
  ].slice(0, rows);
  while (lines.length < rows) lines.push(blank);
  return lines.join("\n");
}

function framedBoard(level: Level, theme: Theme, color: boolean, maxW: number, maxH: number): string[] {
  const parsed = parseLevel(level.map);
  const bounds = occupiedBounds(parsed.board);
  const scale = fitScale(
    bounds.x1 - bounds.x0 + 1,
    bounds.y1 - bounds.y0 + 1,
    Math.max(8, maxW - 4),
    Math.max(3, maxH - 4),
  );
  return renderBoard(parsed.board, parsed.state, theme, color, scale);
}

function frameArt(lines: string[], theme: Theme, color: boolean): string[] {
  if (lines.length === 0) return lines;
  const width = visibleWidth(lines[0]!);
  const edge = (text: string) => fg(theme.frame, text, color);
  const top = edge(`╔${repeat("═", width)}╗`);
  const bottom = edge(`╚${repeat("═", width)}╝`);
  const mid = lines.map((line) => `${edge("║")}${line}${edge("║")}`);
  return [top, ...mid, bottom];
}

function overlayCard(base: string[], card: string[], theme: Theme, color: boolean): string[] {
  if (base.length < card.length + 2) return card;
  const width = visibleWidth(base[0] ?? "");
  if (width < 38) return base;
  const top = Math.max(1, Math.floor((base.length - card.length) / 2));
  const out = [...base];
  for (let i = 0; i < card.length; i += 1) {
    const y = top + i;
    if (y >= 0 && y < out.length) {
      out[y] = surround(card[i]!, width, { bg: theme.barBg, enabled: color });
    }
  }
  return out;
}

function winCard(session: Session, newBest: boolean, theme: Theme, color: boolean): string[] {
  const width = 36;
  const stars =
    session.level.parMoves > 0 ? starBar(starsNow(session.moves, session.level.parMoves)) : "";
  const lines = [
    "LEVEL CLEAR",
    `${session.moves} moves · ${session.pushes} pushes · ${formatTime(session.elapsedMs)}`,
    stars,
    newBest ? "new personal best" : "",
    "enter next    r retry    q menu",
  ].filter(Boolean);
  const box = [
    fg(theme.ok, `┌${repeat("─", width - 2)}┐`, color),
    ...lines.map((line) => fg(theme.title, `│${pad(line, width - 2, "center")}│`, color)),
    fg(theme.ok, `└${repeat("─", width - 2)}┘`, color),
  ];
  return box;
}

function splitStage(
  left: string[],
  right: string[],
  cols: number,
  theme: Theme,
  color: boolean,
): string[] {
  const leftW = cols >= 100 ? Math.min(48, Math.floor(cols * 0.4)) : Math.min(34, Math.floor(cols * 0.42));
  const rightW = Math.max(10, cols - leftW - 3);
  const rule = fg(theme.frame, "│", color);
  const height = Math.max(left.length, right.length);
  const lines: string[] = [];
  for (let i = 0; i < height; i += 1) {
    const l = pad(clip(left[i] ?? "", leftW), leftW);
    const r = pad(clip(right[i] ?? "", rightW), rightW);
    lines.push(`${l} ${rule}${r}`);
  }
  return lines;
}

function assemble(
  cols: number,
  rows: number,
  theme: Theme,
  color: boolean,
  header: string[],
  stage: string[],
  footer: string[],
  align: "center" | "top" = "center",
): string {
  const inner = Math.max(20, cols - 2);
  const edge = (text: string) => fg(theme.frame, text, color);
  const rule = edge(repeat("═", inner));
  const wrap = (line: string) =>
    `${edge("║")}${clip(line, inner)}${" ".repeat(Math.max(0, inner - visibleWidth(clip(line, inner))))}${edge("║")}`;

  const top = `${edge("╔")}${rule}${edge("╗")}`;
  const split = `${edge("╠")}${rule}${edge("╣")}`;
  const bottom = `${edge("╚")}${rule}${edge("╝")}`;

  const chrome = [
    top,
    ...header.map(wrap),
    split,
  ];
  const foot = footer.length
    ? [split, ...footer.map(wrap), bottom]
    : [bottom];
  const stageH = Math.max(1, rows - chrome.length - foot.length);
  const extra = stageH - stage.length;
  const topPad = align === "top" ? Math.min(1, Math.max(0, extra)) : Math.max(0, Math.floor(extra / 2));
  const blank = wrap("");
  const body = [
    ...Array.from({ length: topPad }, () => blank),
    ...stage.map((line) => wrap(surround(line, inner, { bg: theme.bg ?? 232, enabled: color }))),
    ...Array.from({ length: Math.max(0, stageH - topPad - stage.length) }, () => blank),
  ].slice(0, stageH);
  const lines = [...chrome, ...body, ...foot].slice(0, rows);
  while (lines.length < rows) lines.push(blank);
  return lines.join("\n");
}

function chromeBar(cols: number, theme: Theme, color: boolean, left: string, right: string): string {
  return paintBar(cols, left, right, { fg: theme.title, bg: theme.barBg, enabled: color });
}

function keysBar(cols: number, theme: Theme, color: boolean, text: string): string {
  return paintBar(cols, ` ${text}`, "", { fg: theme.muted, bg: theme.barBg, enabled: color });
}

function continueLevel(player: PlayerSave | null): Level {
  if (!player) return LEVELS[0]!;
  for (const level of LEVELS) {
    if ((player.levels[String(level.id)]?.completions ?? 0) === 0) return level;
  }
  return LEVELS[LEVEL_COUNT - 1]!;
}

function starsNow(moves: number, parMoves: number): number {
  if (moves <= parMoves) return 3;
  if (moves <= Math.ceil(parMoves * 1.5)) return 2;
  return 1;
}

function difficultyLabel(difficulty: Difficulty): string {
  return difficulty;
}

function fmtAvg(value: number | null): string {
  if (value == null) return "—";
  return String(Math.round(value * 10) / 10);
}

function metric(theme: Theme, color: boolean, label: string, value: string): string {
  return `${colorize(theme, color, "muted", label)}  ${colorize(theme, color, "title", value)}`;
}

function colorize(
  theme: Theme,
  color: boolean,
  token: "title" | "text" | "muted" | "accent" | "ok" | "warn",
  text: string,
): string {
  return fg(theme[token], text, color);
}
