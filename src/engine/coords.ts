const SHIFT = 8;
const MASK = 0xff;

export function pack(x: number, y: number): number {
  return (y << SHIFT) | x;
}

export function unpack(cell: number): { x: number; y: number } {
  return { x: cell & MASK, y: cell >> SHIFT };
}

export function step(cell: number, dx: number, dy: number): number {
  return pack((cell & MASK) + dx, (cell >> SHIFT) + dy);
}
