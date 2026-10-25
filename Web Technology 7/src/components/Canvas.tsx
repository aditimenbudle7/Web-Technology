import type { RefObject } from 'react';
import type { Diagram, Selection } from '../types';
import type { Action } from '../state/diagramReducer';
import { NODE_WIDTH, nodeHeight } from '../model/geometry';
import ClassNode from './ClassNode';
import RelationshipLayer from './RelationshipLayer';

interface Props {
  diagram: Diagram;
  zoom: number;
  selection: Selection;
  connectMode: boolean;
  connectSourceId: string | null;
  scrollRef: RefObject<HTMLDivElement>;
  dispatch: (a: Action) => void;
  onSelect: (s: Selection) => void;
  onConnectClick: (classId: string) => void;
}

export default function Canvas({ diagram, zoom, selection, connectMode, connectSourceId, scrollRef, dispatch, onSelect, onConnectClick }: Props) {
  const width = Math.max(2000, ...diagram.classes.map((c) => c.x + NODE_WIDTH + 400));
  const height = Math.max(1400, ...diagram.classes.map((c) => c.y + nodeHeight(c) + 400));

  return (
    <div className={`canvas-scroll ${connectMode ? 'connecting' : ''}`} ref={scrollRef}>
      <div className="canvas-sizer" style={{ width: width * zoom, height: height * zoom }}>
        <div
          className="canvas-inner"
          style={{ width, height, transform: `scale(${zoom})` }}
          onPointerDown={() => onSelect(null)}
        >
          <RelationshipLayer
            classes={diagram.classes}
            relationships={diagram.relationships}
            selectedId={selection?.kind === 'relationship' ? selection.id : null}
            width={width}
            height={height}
            onSelect={(id) => onSelect({ kind: 'relationship', id })}
          />
          {diagram.classes.map((c) => (
            <ClassNode
              key={c.id}
              cls={c}
              zoom={zoom}
              selected={selection?.kind === 'class' && selection.id === c.id}
              connectMode={connectMode}
              isConnectSource={connectSourceId === c.id}
              dispatch={dispatch}
              onSelect={() => onSelect({ kind: 'class', id: c.id })}
              onConnectClick={() => onConnectClick(c.id)}
            />
          ))}
          {diagram.classes.length === 0 && (
            <div className="canvas-empty">
              <h2>Start your diagram</h2>
              <p>Use <strong>+ Class</strong>, <strong>+ Interface</strong>, <strong>+ Abstract</strong> or <strong>+ Enum</strong> in the toolbar, or load the sample.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
