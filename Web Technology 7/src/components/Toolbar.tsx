import type { ClassKind, RelationType } from '../types';
import { RELATION_LABELS } from '../types';

interface Props {
  connectType: RelationType;
  connecting: boolean;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  hasCode: boolean;
  onAdd: (kind: ClassKind) => void;
  onConnectTypeChange: (t: RelationType) => void;
  onToggleConnect: () => void;
  onZoom: (z: number) => void;
  onFit: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onSample: () => void;
  onClear: () => void;
  onDownload: () => void;
}

const ZOOM_STEPS = [0.3, 0.4, 0.5, 0.67, 0.8, 0.9, 1, 1.1, 1.25, 1.5];

export default function Toolbar(p: Props) {
  const zoomOut = [...ZOOM_STEPS].reverse().find((z) => z < p.zoom - 0.001) ?? ZOOM_STEPS[0];
  const zoomIn = ZOOM_STEPS.find((z) => z > p.zoom + 0.001) ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  return (
    <header className="toolbar">
      <div className="brand">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" /><line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
        </svg>
        <span>UML → Java</span>
      </div>

      <div className="tool-group" aria-label="Add elements">
        <button className="btn" onClick={() => p.onAdd('class')}>+ Class</button>
        <button className="btn" onClick={() => p.onAdd('interface')}>+ Interface</button>
        <button className="btn" onClick={() => p.onAdd('abstract')}>+ Abstract</button>
        <button className="btn" onClick={() => p.onAdd('enum')}>+ Enum</button>
      </div>

      <div className="tool-group" aria-label="Relationships">
        <select className="input" value={p.connectType} aria-label="Relationship type"
          onChange={(e) => p.onConnectTypeChange(e.target.value as RelationType)}>
          {(Object.keys(RELATION_LABELS) as RelationType[]).map((t) => <option key={t} value={t}>{RELATION_LABELS[t]}</option>)}
        </select>
        <button className={`btn ${p.connecting ? 'btn-active' : ''}`} onClick={p.onToggleConnect} aria-pressed={p.connecting}>
          {p.connecting ? 'Cancel' : 'Connect'}
        </button>
      </div>

      <div className="tool-group" aria-label="History and zoom">
        <button className="btn icon" onClick={p.onUndo} disabled={!p.canUndo} title="Undo (Ctrl+Z)">↶</button>
        <button className="btn icon" onClick={p.onRedo} disabled={!p.canRedo} title="Redo (Ctrl+Y)">↷</button>
        <button className="btn icon" onClick={() => p.onZoom(zoomOut)} title="Zoom out">−</button>
        <span className="zoom-label">{Math.round(p.zoom * 100)}%</span>
        <button className="btn icon" onClick={() => p.onZoom(zoomIn)} title="Zoom in">+</button>
        <button className="btn" onClick={p.onFit} title="Fit diagram to screen">Fit</button>
      </div>

      <div className="tool-group push-right">
        <button className="btn" onClick={p.onSample}>Sample</button>
        <button className="btn" onClick={p.onClear}>Clear</button>
        <button className="btn btn-primary" onClick={p.onDownload} disabled={!p.hasCode}>Download Java</button>
      </div>
    </header>
  );
}
