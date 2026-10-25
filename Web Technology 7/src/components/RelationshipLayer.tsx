import type { Relationship, UmlClass } from '../types';
import { center, edgePoint } from '../model/geometry';
import MarkerDefs, { lineStyle } from './MarkerDefs';

interface Props {
  classes: UmlClass[];
  relationships: Relationship[];
  selectedId: string | null;
  width: number;
  height: number;
  onSelect: (id: string) => void;
}

const PREFIX = 'cv-';

/** Point `dist` px from `a` toward `b`, shifted sideways by `side` px. */
function labelPoint(a: { x: number; y: number }, b: { x: number; y: number }, dist: number, side: number) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  return { x: a.x + ux * dist - uy * side, y: a.y + uy * dist + ux * side };
}

export default function RelationshipLayer({ classes, relationships, selectedId, width, height, onSelect }: Props) {
  const byId = new Map(classes.map((c) => [c.id, c]));
  return (
    <svg className="rel-layer" width={width} height={height}>
      <MarkerDefs prefix={PREFIX} />
      {relationships.map((r) => {
        const s = byId.get(r.sourceId);
        const t = byId.get(r.targetId);
        if (!s || !t) return null;
        const p1 = edgePoint(s, center(t));
        const p2 = edgePoint(t, center(s));
        const selected = r.id === selectedId;
        const { dashed, markerStart, markerEnd } = lineStyle(r.type, PREFIX, selected);
        const d = `M${p1.x},${p1.y} L${p2.x},${p2.y}`;
        const mid = labelPoint(p1, p2, Math.hypot(p2.x - p1.x, p2.y - p1.y) / 2, -10);
        const srcLbl = labelPoint(p1, p2, 26, 12);
        const tgtLbl = labelPoint(p2, p1, 26, -12);
        return (
          <g key={r.id} className={`rel ${selected ? 'selected' : ''}`}>
            <path d={d} className="rel-line" strokeDasharray={dashed ? '7 5' : undefined}
              markerStart={markerStart} markerEnd={markerEnd} />
            <path d={d} className="rel-hit"
              onPointerDown={(e) => { e.stopPropagation(); onSelect(r.id); }} />
            {r.label && <text x={mid.x} y={mid.y} className="rel-label" textAnchor="middle">{r.label}</text>}
            {r.sourceMultiplicity && <text x={srcLbl.x} y={srcLbl.y} className="rel-mult" textAnchor="middle">{r.sourceMultiplicity}</text>}
            {r.targetMultiplicity && <text x={tgtLbl.x} y={tgtLbl.y} className="rel-mult" textAnchor="middle">{r.targetMultiplicity}</text>}
          </g>
        );
      })}
    </svg>
  );
}
