import type { RelationType } from '../types';

/** SVG arrowheads / diamonds for UML relationship lines. */
export default function MarkerDefs({ prefix }: { prefix: string }) {
  const variants = [
    { suffix: '', color: 'var(--line)' },
    { suffix: '-sel', color: 'var(--accent)' },
  ];
  return (
    <defs>
      {variants.map(({ suffix, color }) => (
        <g key={suffix}>
          <marker id={`${prefix}tri${suffix}`} viewBox="0 0 14 14" refX="13" refY="7"
            markerWidth="16" markerHeight="16" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M1,1 L13,7 L1,13 z" style={{ fill: 'var(--canvas)', stroke: color, strokeWidth: 1.5 }} />
          </marker>
          <marker id={`${prefix}open${suffix}`} viewBox="0 0 14 14" refX="13" refY="7"
            markerWidth="14" markerHeight="14" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M1,1 L13,7 L1,13" style={{ fill: 'none', stroke: color, strokeWidth: 1.5 }} />
          </marker>
          <marker id={`${prefix}agg${suffix}`} viewBox="0 0 22 12" refX="1" refY="6"
            markerWidth="22" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M1,6 L11,1 L21,6 L11,11 z" style={{ fill: 'var(--canvas)', stroke: color, strokeWidth: 1.5 }} />
          </marker>
          <marker id={`${prefix}comp${suffix}`} viewBox="0 0 22 12" refX="1" refY="6"
            markerWidth="22" markerHeight="12" markerUnits="userSpaceOnUse" orient="auto">
            <path d="M1,6 L11,1 L21,6 L11,11 z" style={{ fill: color, stroke: color, strokeWidth: 1.5 }} />
          </marker>
        </g>
      ))}
    </defs>
  );
}


export function lineStyle(type: RelationType, prefix: string, selected: boolean) {
  const s = selected ? '-sel' : '';
  const dashed = type === 'realization' || type === 'dependency';
  let markerStart: string | undefined;
  let markerEnd: string | undefined;
  switch (type) {
    case 'inheritance':
    case 'realization':
      markerEnd = `url(#${prefix}tri${s})`;
      break;
    case 'association':
    case 'dependency':
      markerEnd = `url(#${prefix}open${s})`;
      break;
    case 'aggregation':
      markerStart = `url(#${prefix}agg${s})`;
      break;
    case 'composition':
      markerStart = `url(#${prefix}comp${s})`;
      break;
  }
  return { dashed, markerStart, markerEnd };
}
