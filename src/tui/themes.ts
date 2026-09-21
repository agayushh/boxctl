import type { CellKind } from "../engine/types.js";

export type ThemeId =
  | "classic"
  | "dungeon"
  | "neon"
  | "forest"
  | "ice"
  | "retro"
  | "midnight"
  | "sakura";

export type Theme = {
  id: ThemeId;
  name: string;
  tagline: string;
  glyphs: Record<CellKind, string>;
  colors: Record<CellKind, number>;
  frame: number;
  title: number;
  text: number;
  muted: number;
  accent: number;
  ok: number;
  warn: number;
  bg: number | null;
  barBg: number;
  floorBg: number;
};

const ascii: Record<CellKind, string> = {
  void: "  ",
  wall: "##",
  floor: "  ",
  goal: "..",
  box: "[]",
  "box-on-goal": "{}",
  player: "@ ",
  "player-on-goal": "@.",
};

const blocks: Record<CellKind, string> = {
  void: "  ",
  wall: "██",
  floor: "  ",
  goal: "··",
  box: "▓▓",
  "box-on-goal": "◆◆",
  player: "▲ ",
  "player-on-goal": "▲·",
};

export const THEMES: Theme[] = [
  {
    id: "classic",
    name: "Classic",
    tagline: "The original ASCII look",
    glyphs: ascii,
    colors: {
      void: 0,
      wall: 245,
      floor: 240,
      goal: 220,
      box: 208,
      "box-on-goal": 82,
      player: 51,
      "player-on-goal": 51,
    },
    frame: 245,
    title: 231,
    text: 252,
    muted: 244,
    accent: 220,
    ok: 82,
    warn: 208,
    bg: 232,
    barBg: 236,
    floorBg: 234,
  },
  {
    id: "dungeon",
    name: "Dungeon",
    tagline: "Torchlight and stone",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 94,
      floor: 236,
      goal: 178,
      box: 130,
      "box-on-goal": 220,
      player: 223,
      "player-on-goal": 230,
    },
    frame: 94,
    title: 220,
    text: 223,
    muted: 137,
    accent: 208,
    ok: 178,
    warn: 202,
    bg: 232,
    barBg: 52,
    floorBg: 234,
  },
  {
    id: "neon",
    name: "Neon",
    tagline: "Night city warehouse",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 54,
      floor: 235,
      goal: 213,
      box: 39,
      "box-on-goal": 48,
      player: 51,
      "player-on-goal": 123,
    },
    frame: 201,
    title: 51,
    text: 159,
    muted: 61,
    accent: 201,
    ok: 48,
    warn: 205,
    bg: 232,
    barBg: 53,
    floorBg: 234,
  },
  {
    id: "forest",
    name: "Forest",
    tagline: "Moss, crates, and clearings",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 22,
      floor: 235,
      goal: 114,
      box: 94,
      "box-on-goal": 70,
      player: 228,
      "player-on-goal": 191,
    },
    frame: 28,
    title: 150,
    text: 193,
    muted: 65,
    accent: 142,
    ok: 82,
    warn: 178,
    bg: 232,
    barBg: 22,
    floorBg: 234,
  },
  {
    id: "ice",
    name: "Ice",
    tagline: "Cold storage",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 67,
      floor: 236,
      goal: 159,
      box: 75,
      "box-on-goal": 87,
      player: 231,
      "player-on-goal": 195,
    },
    frame: 81,
    title: 195,
    text: 195,
    muted: 67,
    accent: 117,
    ok: 87,
    warn: 185,
    bg: 234,
    barBg: 24,
    floorBg: 235,
  },
  {
    id: "retro",
    name: "Retro",
    tagline: "Green phosphor terminal",
    glyphs: ascii,
    colors: {
      void: 0,
      wall: 34,
      floor: 22,
      goal: 46,
      box: 82,
      "box-on-goal": 118,
      player: 154,
      "player-on-goal": 154,
    },
    frame: 34,
    title: 46,
    text: 82,
    muted: 28,
    accent: 118,
    ok: 46,
    warn: 190,
    bg: 232,
    barBg: 22,
    floorBg: 233,
  },
  {
    id: "midnight",
    name: "Midnight",
    tagline: "Quiet blue warehouse",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 24,
      floor: 235,
      goal: 75,
      box: 67,
      "box-on-goal": 81,
      player: 189,
      "player-on-goal": 153,
    },
    frame: 61,
    title: 153,
    text: 189,
    muted: 60,
    accent: 75,
    ok: 80,
    warn: 141,
    bg: 232,
    barBg: 17,
    floorBg: 234,
  },
  {
    id: "sakura",
    name: "Sakura",
    tagline: "Pink crates at dusk",
    glyphs: blocks,
    colors: {
      void: 0,
      wall: 95,
      floor: 236,
      goal: 218,
      box: 175,
      "box-on-goal": 213,
      player: 231,
      "player-on-goal": 225,
    },
    frame: 175,
    title: 218,
    text: 224,
    muted: 132,
    accent: 213,
    ok: 176,
    warn: 203,
    bg: 232,
    barBg: 53,
    floorBg: 234,
  },
];

export function themeById(id: string): Theme {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0]!;
}

export const DEFAULT_THEME: ThemeId = "dungeon";
