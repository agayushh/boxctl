export type Key =
  | { type: "up" }
  | { type: "down" }
  | { type: "left" }
  | { type: "right" }
  | { type: "enter" }
  | { type: "escape" }
  | { type: "backspace" }
  | { type: "tab" }
  | { type: "char"; value: string }
  | { type: "ctrl"; value: string };

export function parseInput(chunk: string): Key[] {
  const keys: Key[] = [];
  let i = 0;
  while (i < chunk.length) {
    const ch = chunk[i]!;
    if (ch === "\x1b") {
      const next = chunk[i + 1];
      if (next === "[") {
        const code = chunk[i + 2];
        if (code === "A") {
          keys.push({ type: "up" });
          i += 3;
          continue;
        }
        if (code === "B") {
          keys.push({ type: "down" });
          i += 3;
          continue;
        }
        if (code === "C") {
          keys.push({ type: "right" });
          i += 3;
          continue;
        }
        if (code === "D") {
          keys.push({ type: "left" });
          i += 3;
          continue;
        }
        i += 3;
        continue;
      }
      if (next === "O") {
        const code = chunk[i + 2];
        if (code === "A") keys.push({ type: "up" });
        else if (code === "B") keys.push({ type: "down" });
        else if (code === "C") keys.push({ type: "right" });
        else if (code === "D") keys.push({ type: "left" });
        i += 3;
        continue;
      }
      keys.push({ type: "escape" });
      i += 1;
      continue;
    }
    if (ch === "\r" || ch === "\n") {
      keys.push({ type: "enter" });
      i += 1;
      continue;
    }
    if (ch === "\x7f" || ch === "\b") {
      keys.push({ type: "backspace" });
      i += 1;
      continue;
    }
    if (ch === "\t") {
      keys.push({ type: "tab" });
      i += 1;
      continue;
    }
    const code = ch.charCodeAt(0);
    if (code <= 26) {
      keys.push({ type: "ctrl", value: String.fromCharCode(code + 96) });
      i += 1;
      continue;
    }
    keys.push({ type: "char", value: ch });
    i += 1;
  }
  return keys;
}

export function asDir(key: Key): "up" | "down" | "left" | "right" | null {
  if (key.type === "up" || key.type === "down" || key.type === "left" || key.type === "right") {
    return key.type;
  }
  if (key.type !== "char") return null;
  const ch = key.value.toLowerCase();
  if (ch === "w" || ch === "k") return "up";
  if (ch === "s" || ch === "j") return "down";
  if (ch === "a" || ch === "h") return "left";
  if (ch === "d" || ch === "l") return "right";
  return null;
}
