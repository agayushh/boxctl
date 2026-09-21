import { Session } from "../engine/game.js";
import type { Dir } from "../engine/types.js";
import { LEVELS, LEVEL_COUNT, levelById } from "../levels/campaign.js";
import {
  activePlayer,
  isUnlocked,
  loadSave,
  recordCompletion,
  saveSave,
  upsertPlayer,
  type SaveFile,
} from "../scores/store.js";
import {
  ALT_OFF,
  ALT_ON,
  CLEAR,
  ERASE_LINE,
  HIDE_CURSOR,
  HOME,
  SHOW_CURSOR,
  WRAP_OFF,
  WRAP_ON,
  colorEnabled,
} from "./ansi.js";
import { asDir, parseInput, type Key } from "./keys.js";
import {
  MENU_ITEMS,
  renderHelp,
  renderLevels,
  renderMenu,
  renderName,
  renderPlay,
  renderProfiles,
  renderScores,
  renderThemes,
  renderTooSmall,
} from "./render.js";
import { THEMES, themeById, type Theme } from "./themes.js";

type Screen =
  | { kind: "name"; draft: string }
  | { kind: "menu"; index: number }
  | { kind: "play"; session: Session; win: boolean; newBest: boolean }
  | { kind: "levels"; index: number }
  | { kind: "themes"; index: number }
  | { kind: "scores" }
  | { kind: "help" }
  | { kind: "profiles"; index: number; creating: boolean; draft: string };

export type AppOptions = {
  savePath?: string;
  startLevel?: number;
  theme?: string;
};

export function runApp(options: AppOptions = {}): void {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stderr.write("sokoban needs an interactive terminal.\n");
    process.exitCode = 1;
    return;
  }

  const savePath = options.savePath;
  const save = loadSave(savePath);
  if (options.theme) save.theme = themeById(options.theme).id;

  const startLevel = options.startLevel;
  let screen: Screen = activePlayer(save)
    ? { kind: "menu", index: 0 }
    : { kind: "name", draft: "" };

  if (startLevel && activePlayer(save)) {
    screen = playLevel(save, startLevel, true);
  }

  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  process.stdout.write(ALT_ON + HIDE_CURSOR + WRAP_OFF + CLEAR);

  let closed = false;
  const close = () => {
    if (closed) return;
    closed = true;
    persist(save, savePath);
    stdin.setRawMode(false);
    process.stdout.write(SHOW_CURSOR + WRAP_ON + ALT_OFF);
    process.exit(0);
  };

  const draw = () => {
    const cols = process.stdout.columns ?? 80;
    const rows = process.stdout.rows ?? 24;
    const theme = themeById(save.theme);
    const color = colorEnabled();
    const player = activePlayer(save);
    let frame: string;
    if (cols < 60 || rows < 18) {
      frame = renderTooSmall(cols, rows, theme, color);
    } else {
      frame = renderScreen(screen, save, theme, color, cols, rows, player);
    }
    const lines = frame.split("\n");
    let out = HOME;
    for (let i = 0; i < rows; i += 1) {
      out += `\x1b[${i + 1};1H${ERASE_LINE}${lines[i] ?? ""}`;
    }
    process.stdout.write(out);
  };

  const handle = (key: Key) => {
    if (key.type === "ctrl" && key.value === "c") {
      close();
      return;
    }
    if (screen.kind === "menu" && key.type === "enter" && MENU_ITEMS[screen.index]?.id === "quit") {
      close();
      return;
    }
    screen = reduce(screen, key, save, startLevel);
    if (screen.kind === "menu" && key.type === "char" && key.value.toLowerCase() === "q") {
      close();
      return;
    }
    persist(save, savePath);
    draw();
  };

  stdin.on("data", (chunk: string) => {
    for (const key of parseInput(chunk)) handle(key);
  });
  process.stdout.on("resize", draw);
  process.on("SIGINT", close);
  process.on("SIGTERM", close);
  draw();
}

function persist(save: SaveFile, savePath?: string): void {
  saveSave(save, savePath);
}

function renderScreen(
  screen: Screen,
  save: SaveFile,
  theme: Theme,
  color: boolean,
  cols: number,
  rows: number,
  player: ReturnType<typeof activePlayer>,
): string {
  switch (screen.kind) {
    case "name":
      return renderName({ cols, rows, theme, color, draft: screen.draft });
    case "menu":
      return renderMenu({ cols, rows, theme, color, index: screen.index, player });
    case "play":
      return renderPlay({
        cols,
        rows,
        theme,
        color,
        session: screen.session,
        player,
        win: screen.win,
        newBest: screen.newBest,
      });
    case "levels":
      return renderLevels({ cols, rows, theme, color, index: screen.index, player });
    case "themes":
      return renderThemes({ cols, rows, theme, color, index: screen.index });
    case "scores":
      return renderScores({ cols, rows, theme, color, save });
    case "help":
      return renderHelp({ cols, rows, theme, color });
    case "profiles":
      return renderProfiles({
        cols,
        rows,
        theme,
        color,
        save,
        index: screen.index,
        creating: screen.creating,
        draft: screen.draft,
      });
  }
}

function reduce(screen: Screen, key: Key, save: SaveFile, startLevel?: number): Screen {
  const player = activePlayer(save);

  if (screen.kind === "name") {
    if (key.type === "enter") {
      if (screen.draft.trim().length === 0) return screen;
      upsertPlayer(save, screen.draft);
      if (startLevel) return playLevel(save, startLevel, true);
      return { kind: "menu", index: 0 };
    }
    return { ...screen, draft: editDraft(screen.draft, key) };
  }

  if (screen.kind === "menu") {
    if (key.type === "up") return { kind: "menu", index: wrap(screen.index - 1, MENU_ITEMS.length) };
    if (key.type === "down") return { kind: "menu", index: wrap(screen.index + 1, MENU_ITEMS.length) };
    if (key.type === "enter") return openMenu(MENU_ITEMS[screen.index]!.id, save);
    if (key.type === "char") {
      const ch = key.value.toLowerCase();
      if (ch === "p") return openMenu("play", save);
    }
    return screen;
  }

  if (screen.kind === "play") {
    if (quitKey(key)) return { kind: "menu", index: 0 };
    if (screen.win) {
      if (key.type === "enter" || (key.type === "char" && key.value.toLowerCase() === "n")) {
        return playLevel(save, screen.session.level.id + 1);
      }
      if (key.type === "char" && key.value.toLowerCase() === "r") {
        return playLevel(save, screen.session.level.id);
      }
      return screen;
    }
    if (key.type === "char") {
      const ch = key.value.toLowerCase();
      if (ch === "u") {
        screen.session.undo();
        return { ...screen };
      }
      if (ch === "r") return playLevel(save, screen.session.level.id);
      if (ch === "n") return playLevel(save, screen.session.level.id + 1);
      if (ch === "p") return playLevel(save, screen.session.level.id - 1);
      if (ch === "t") {
        const i = THEMES.findIndex((theme) => theme.id === save.theme);
        save.theme = THEMES[(i + 1) % THEMES.length]!.id;
        return { ...screen };
      }
    }
    const dir = asDir(key);
    if (dir) return movePlay(screen, dir, save);
    return screen;
  }

  if (screen.kind === "levels") {
    if (quitKey(key)) return { kind: "menu", index: 1 };
    const cols = 10;
    if (key.type === "left") return { kind: "levels", index: wrap(screen.index - 1, LEVEL_COUNT) };
    if (key.type === "right") return { kind: "levels", index: wrap(screen.index + 1, LEVEL_COUNT) };
    if (key.type === "up") return { kind: "levels", index: wrap(screen.index - cols, LEVEL_COUNT) };
    if (key.type === "down") return { kind: "levels", index: wrap(screen.index + cols, LEVEL_COUNT) };
    if (key.type === "enter") {
      const level = LEVELS[screen.index]!;
      if (!isUnlocked(player, level.id)) return screen;
      return playLevel(save, level.id);
    }
    return screen;
  }

  if (screen.kind === "themes") {
    if (quitKey(key)) return { kind: "menu", index: 2 };
    if (key.type === "up") return { kind: "themes", index: wrap(screen.index - 1, THEMES.length) };
    if (key.type === "down") return { kind: "themes", index: wrap(screen.index + 1, THEMES.length) };
    if (key.type === "enter") {
      save.theme = THEMES[screen.index]!.id;
      return { kind: "menu", index: 2 };
    }
    return screen;
  }

  if (screen.kind === "scores") {
    if (quitKey(key)) return { kind: "menu", index: 3 };
    return screen;
  }

  if (screen.kind === "help") {
    if (quitKey(key)) return { kind: "menu", index: 5 };
    return screen;
  }

  if (screen.kind === "profiles") {
    if (screen.creating) {
      if (key.type === "escape") return { kind: "profiles", index: screen.index, creating: false, draft: "" };
      if (key.type === "enter") {
        if (screen.draft.trim().length === 0) return screen;
        upsertPlayer(save, screen.draft);
        return { kind: "profiles", index: playerIndex(save, save.activePlayer), creating: false, draft: "" };
      }
      return { ...screen, draft: editDraft(screen.draft, key) };
    }
    if (quitKey(key)) return { kind: "menu", index: 4 };
    const names = Object.keys(save.players);
    if (key.type === "up" && names.length) return { ...screen, index: wrap(screen.index - 1, names.length) };
    if (key.type === "down" && names.length) return { ...screen, index: wrap(screen.index + 1, names.length) };
    if (key.type === "enter" && names[screen.index]) {
      save.activePlayer = names[screen.index]!;
      return { kind: "menu", index: 0 };
    }
    if (key.type === "char" && key.value.toLowerCase() === "n") {
      return { ...screen, creating: true, draft: "" };
    }
    return screen;
  }

  return screen;
}

function openMenu(id: (typeof MENU_ITEMS)[number]["id"], save: SaveFile): Screen {
  if (id === "play") {
    const player = activePlayer(save);
    const next = continueLevel(player);
    return playLevel(save, next);
  }
  if (id === "levels") return { kind: "levels", index: continueLevel(activePlayer(save)) - 1 };
  if (id === "themes") {
    const i = THEMES.findIndex((theme) => theme.id === save.theme);
    return { kind: "themes", index: i < 0 ? 0 : i };
  }
  if (id === "scores") return { kind: "scores" };
  if (id === "profiles") return { kind: "profiles", index: playerIndex(save, save.activePlayer), creating: false, draft: "" };
  if (id === "help") return { kind: "help" };
  return { kind: "menu", index: 0 };
}

function playLevel(save: SaveFile, id: number, force = false): Screen {
  const player = activePlayer(save);
  const clamped = Math.min(LEVEL_COUNT, Math.max(1, id));
  if (!force && !isUnlocked(player, clamped)) {
    return { kind: "levels", index: clamped - 1 };
  }
  return {
    kind: "play",
    session: new Session(levelById(clamped)),
    win: false,
    newBest: false,
  };
}

function movePlay(
  screen: Extract<Screen, { kind: "play" }>,
  dir: Dir,
  save: SaveFile,
): Screen {
  const moved = screen.session.tryMove(dir);
  if (!moved) return screen;
  if (!screen.session.won) return { ...screen, win: false, newBest: false };
  const player = activePlayer(save);
  let newBest = false;
  if (player) {
    const result = recordCompletion(player, screen.session.level, {
      moves: screen.session.moves,
      pushes: screen.session.pushes,
      timeMs: screen.session.elapsedMs,
    });
    newBest = result.newBest;
  }
  process.stdout.write("\x07");
  return { ...screen, win: true, newBest };
}

function continueLevel(player: ReturnType<typeof activePlayer>): number {
  if (!player) return 1;
  for (const level of LEVELS) {
    if ((player.levels[String(level.id)]?.completions ?? 0) === 0) return level.id;
  }
  return LEVEL_COUNT;
}

function playerIndex(save: SaveFile, name: string): number {
  const names = Object.keys(save.players);
  const i = names.indexOf(name);
  return i < 0 ? 0 : i;
}

function editDraft(draft: string, key: Key): string {
  if (key.type === "backspace") return draft.slice(0, -1);
  if (key.type !== "char") return draft;
  if (!/^[\p{L}\p{N} _.-]$/u.test(key.value)) return draft;
  if (draft.length >= 20) return draft;
  return draft + key.value;
}

function quitKey(key: Key): boolean {
  if (key.type === "escape") return true;
  return key.type === "char" && key.value.toLowerCase() === "q";
}

function wrap(index: number, length: number): number {
  if (length <= 0) return 0;
  return (index + length) % length;
}
