import type { UmlClass } from '../types';

// Fixed sizes keep the drawn boxes and the computed line endpoints in sync.
export const NODE_WIDTH = 240;
export const ROW_HEIGHT = 20;
const BORDER = 2;
const SECTION_PADDING = 8; // 4px top + 4px bottom
const EMPTY_SECTION = 14;

export function headerHeight(c: UmlClass): number {
  return c.kind === 'class' ? 34 : 48;
}

export function sectionHeight(rows: number): number {
  // +1 for the section's top border
  return (rows > 0 ? rows * ROW_HEIGHT + SECTION_PADDING : EMPTY_SECTION) + 1;
}

export function nodeHeight(c: UmlClass): number {
  return BORDER * 2 + headerHeight(c) + sectionHeight(c.attributes.length) + sectionHeight(c.methods.length);
}

export interface Point { x: number; y: number }

export function center(c: UmlClass): Point {
  return { x: c.x + NODE_WIDTH / 2, y: c.y + nodeHeight(c) / 2 };
}

/** Point where the line from the box centre towards `toward` leaves the box. */
export function edgePoint(c: UmlClass, toward: Point): Point {
  const ctr = center(c);
  const dx = toward.x - ctr.x;
  const dy = toward.y - ctr.y;
  if (dx === 0 && dy === 0) return ctr;
  const halfW = NODE_WIDTH / 2;
  const halfH = nodeHeight(c) / 2;
  const sx = dx !== 0 ? halfW / Math.abs(dx) : Infinity;
  const sy = dy !== 0 ? halfH / Math.abs(dy) : Infinity;
  const s = Math.min(sx, sy);
  return { x: ctr.x + dx * s, y: ctr.y + dy * s };
}
