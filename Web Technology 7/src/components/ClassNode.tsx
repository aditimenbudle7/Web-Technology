import { useRef } from 'react';
import type { PointerEvent } from 'react';
import type { Attribute, Method, UmlClass } from '../types';
import { NODE_WIDTH, headerHeight, nodeHeight, sectionHeight } from '../model/geometry';
import type { Action } from '../state/diagramReducer';

interface Props {
  cls: UmlClass;
  zoom: number;
  selected: boolean;
  connectMode: boolean;
  isConnectSource: boolean;
  dispatch: (a: Action) => void;
  onSelect: () => void;
  onConnectClick: () => void;
}

const STEREOTYPE: Record<string, string> = { abstract: 'abstract', interface: 'interface', enum: 'enumeration' };
const GRID = 10;

const formatAttr = (a: Attribute, kind: UmlClass['kind']) =>
  kind === 'enum' ? a.name : `${a.visibility} ${a.name}${a.type ? `: ${a.type}` : ''}`;

const formatMethod = (m: Method) =>
  `${m.visibility} ${m.name}(${m.params})${m.returnType && m.returnType !== 'void' ? `: ${m.returnType}` : ''}`;

export default function ClassNode({ cls, zoom, selected, connectMode, isConnectSource, dispatch, onSelect, onConnectClick }: Props) {
  const drag = useRef<{ px: number; py: number; x: number; y: number; moved: boolean } | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    if (e.button !== 0) return;
    if (connectMode) {
      onConnectClick();
      return;
    }
    onSelect();
    drag.current = { px: e.clientX, py: e.clientY, x: cls.x, y: cls.y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = (e.clientX - d.px) / zoom;
    const dy = (e.clientY - d.py) / zoom;
    if (!d.moved && Math.abs(dx) + Math.abs(dy) < 3) return;
    if (!d.moved) {
      d.moved = true;
      dispatch({ type: 'CHECKPOINT' }); // one undo step per drag
    }
    const x = Math.max(0, Math.round((d.x + dx) / GRID) * GRID);
    const y = Math.max(0, Math.round((d.y + dy) / GRID) * GRID);
    dispatch({ type: 'MOVE_CLASS', id: cls.id, x, y });
  };

  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    if (drag.current && e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    drag.current = null;
  };

  const stereo = STEREOTYPE[cls.kind];
  const classes = [
    'uml-node',
    `kind-${cls.kind}`,
    selected && 'selected',
    connectMode && 'connectable',
    isConnectSource && 'connect-source',
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ left: cls.x, top: cls.y, width: NODE_WIDTH, height: nodeHeight(cls) }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      role="button"
      aria-label={`${cls.kind} ${cls.name}`}
    >
      <div className="node-header" style={{ height: headerHeight(cls) }}>
        {stereo && <div className="stereo">«{stereo}»</div>}
        <div className={`node-name ${cls.kind === 'abstract' ? 'italic' : ''}`}>{cls.name || 'Unnamed'}</div>
      </div>
      <div className="node-section" style={{ height: sectionHeight(cls.attributes.length) }}>
        {cls.attributes.map((a) => (
          <div key={a.id} className={`node-row ${a.isStatic && cls.kind !== 'enum' ? 'static' : ''}`} title={formatAttr(a, cls.kind)}>
            {formatAttr(a, cls.kind)}
          </div>
        ))}
      </div>
      <div className="node-section" style={{ height: sectionHeight(cls.methods.length) }}>
        {cls.methods.map((m) => (
          <div key={m.id}
            className={`node-row ${m.isStatic ? 'static' : ''} ${m.isAbstract || cls.kind === 'interface' ? 'italic' : ''}`}
            title={formatMethod(m)}>
            {formatMethod(m)}
          </div>
        ))}
      </div>
    </div>
  );
}
