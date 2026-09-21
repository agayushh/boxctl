export const RESET = "\x1b[0m";
export const HIDE_CURSOR = "\x1b[?25l";
export const SHOW_CURSOR = "\x1b[?25h";
export const ALT_ON = "\x1b[?1049h";
export const ALT_OFF = "\x1b[?1049l";
export const WRAP_OFF = "\x1b[?7l";
export const WRAP_ON = "\x1b[?7h";
export const CLEAR = "\x1b[2J\x1b[H";
export const HOME = "\x1b[H";
export const ERASE_LINE = "\x1b[2K";

export function colorEnabled(): boolean {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR === "0") return false;
  return Boolean(process.stdout.isTTY);
}

export function fg(code: number, text: string, enabled = colorEnabled()): string {
  if (!enabled) return text;
  return `\x1b[38;5;${code}m${text}${RESET}`;
}

export function bg(code: number, text: string, enabled = colorEnabled()): string {
  if (!enabled) return text;
  return `\x1b[48;5;${code}m${text}${RESET}`;
}

export function paint(
  text: string,
  options: { fg?: number; bg?: number; enabled?: boolean },
): string {
  const enabled = options.enabled ?? colorEnabled();
  if (!enabled) return text;
  let out = "";
  if (options.bg !== undefined) out += `\x1b[48;5;${options.bg}m`;
  if (options.fg !== undefined) out += `\x1b[38;5;${options.fg}m`;
  return `${out}${text}${RESET}`;
}

export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, "");
}

export function visibleWidth(text: string): number {
  return stripAnsi(text).length;
}

export function pad(text: string, width: number, align: "left" | "center" | "right" = "left"): string {
  const size = visibleWidth(text);
  if (size >= width) return text;
  const extra = width - size;
  if (align === "right") return `${" ".repeat(extra)}${text}`;
  if (align === "left") return `${text}${" ".repeat(extra)}`;
  const left = Math.floor(extra / 2);
  return `${" ".repeat(left)}${text}${" ".repeat(extra - left)}`;
}

export function repeat(ch: string, count: number): string {
  return ch.repeat(Math.max(0, count));
}

export function clip(line: string, width: number): string {
  if (visibleWidth(line) <= width) return line;
  const chars = [...line];
  let out = "";
  let n = 0;
  let i = 0;
  while (i < chars.length && n < width) {
    if (chars[i] === "\x1b") {
      while (i < chars.length && chars[i] !== "m") {
        out += chars[i];
        i += 1;
      }
      if (i < chars.length) {
        out += chars[i];
        i += 1;
      }
      continue;
    }
    out += chars[i];
    n += 1;
    i += 1;
  }
  return out;
}

export function surround(
  content: string,
  cols: number,
  fill: { bg?: number; enabled?: boolean } = {},
): string {
  const clipped = clip(content, cols);
  const w = visibleWidth(clipped);
  const left = Math.max(0, Math.floor((cols - w) / 2));
  const right = Math.max(0, cols - w - left);
  const pad = (n: number) => {
    const opts: { bg?: number; enabled?: boolean } = {};
    if (fill.bg !== undefined) opts.bg = fill.bg;
    if (fill.enabled !== undefined) opts.enabled = fill.enabled;
    return paint(" ".repeat(n), opts);
  };
  return `${pad(left)}${clipped}${pad(right)}`;
}

export function paintBar(
  cols: number,
  left: string,
  right: string,
  colors: { fg: number; bg: number; enabled: boolean },
): string {
  const gap = Math.max(0, cols - visibleWidth(left) - visibleWidth(right));
  const line = clip(`${left}${" ".repeat(gap)}${right}`, cols);
  const padded = line + " ".repeat(Math.max(0, cols - visibleWidth(line)));
  return paint(padded, { fg: colors.fg, bg: colors.bg, enabled: colors.enabled });
}
