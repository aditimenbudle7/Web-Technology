import { useCallback, useEffect, useLayoutEffect, useMemo, useReducer, useRef, useState } from 'react';
import type { ClassKind, RelationType, Selection } from './types';
import { STORAGE_KEY, emptyDiagram, historyReducer, initHistory, sampleDiagram } from './state/diagramReducer';
import { generateJava } from './model/javaGenerator';
import { validate } from './model/validation';
import { NODE_WIDTH, nodeHeight } from './model/geometry';
import { uid } from './model/uid';
import Toolbar from './components/Toolbar';
import Canvas from './components/Canvas';
import ClassEditor from './components/ClassEditor';
import RelationshipEditor from './components/RelationshipEditor';
import SettingsEditor from './components/SettingsEditor';
import CodePanel, { downloadAllAsZip } from './components/CodePanel';

type Tab = 'props' | 'code';

const DEFAULT_TARGET_MULTIPLICITY: Partial<Record<RelationType, string>> = {
  association: '1',
  aggregation: '0..*',
  composition: '0..*',
};

export default function App() {
  const [history, dispatch] = useReducer(historyReducer, undefined, initHistory);
  const diagram = history.present;
  const [selection, setSelection] = useState<Selection>(null);
  const [tab, setTab] = useState<Tab>('props');
  const [zoom, setZoom] = useState(1);
  const [connectType, setConnectType] = useState<RelationType>('association');
  const [connecting, setConnecting] = useState(false);
  const [connectSource, setConnectSource] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const files = useMemo(() => generateJava(diagram), [diagram]);
  const issues = useMemo(() => validate(diagram), [diagram]);
  const errorCount = issues.filter((i) => i.level === 'error').length;

  // Autosave in this browser
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(diagram));
    } catch {
      /* storage unavailable */
    }
  }, [diagram]);

  // Drop a selection that no longer exists (after delete / undo)
  const sel: Selection = selection && (selection.kind === 'class'
    ? diagram.classes.some((c) => c.id === selection.id)
    : diagram.relationships.some((r) => r.id === selection.id)) ? selection : null;
  const selectedClass = sel?.kind === 'class' ? diagram.classes.find((c) => c.id === sel.id) : undefined;
  const selectedRel = sel?.kind === 'relationship' ? diagram.relationships.find((r) => r.id === sel.id) : undefined;

  // Fit the whole diagram into the visible canvas
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);
  const fitToScreen = useCallback(() => {
    const el = scrollRef.current;
    if (!el || diagram.classes.length === 0) return;
    const pad = 30;
    const minX = Math.min(...diagram.classes.map((c) => c.x));
    const minY = Math.min(...diagram.classes.map((c) => c.y));
    const maxX = Math.max(...diagram.classes.map((c) => c.x + NODE_WIDTH));
    const maxY = Math.max(...diagram.classes.map((c) => c.y + nodeHeight(c)));
    const z = Math.max(0.3, Math.min(1.25,
      (el.clientWidth - pad * 2) / (maxX - minX),
      (el.clientHeight - pad * 2) / (maxY - minY)));
    pendingScroll.current = { left: Math.max(0, minX * z - pad), top: Math.max(0, minY * z - pad) };
    setZoom(z);
  }, [diagram.classes]);

  useLayoutEffect(() => {
    if (pendingScroll.current && scrollRef.current) {
      scrollRef.current.scrollTo(pendingScroll.current);
      pendingScroll.current = null;
    }
  }, [zoom]);

  // Small screens start zoomed to fit
  useEffect(() => {
    if (window.innerWidth < 860) fitToScreen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cancelConnect = useCallback(() => {
    setConnecting(false);
    setConnectSource(null);
  }, []);

  const addClass = (kind: ClassKind) => {
    const el = scrollRef.current;
    const jitter = () => Math.round((Math.random() * 80 - 40) / 10) * 10;
    let x = 60;
    let y = 60;
    if (el) {
      x = (el.scrollLeft + el.clientWidth / 2) / zoom - NODE_WIDTH / 2 + jitter();
      y = (el.scrollTop + el.clientHeight / 2) / zoom - 80 + jitter();
    }
    const id = uid('c');
    dispatch({ type: 'ADD_CLASS', id, kind, x: Math.max(20, Math.round(x / 10) * 10), y: Math.max(20, Math.round(y / 10) * 10) });
    setSelection({ kind: 'class', id });
    setTab('props');
    cancelConnect();
  };

  const handleConnectClick = (classId: string) => {
    if (!connectSource) {
      setConnectSource(classId);
      return;
    }
    if (connectSource === classId) return;
    const source = diagram.classes.find((c) => c.id === connectSource);
    const target = diagram.classes.find((c) => c.id === classId);
    let type = connectType;
    // Friendly auto-correction of the two most common mix-ups
    if (type === 'inheritance' && target?.kind === 'interface' && source?.kind !== 'interface') type = 'realization';
    if (type === 'realization' && source?.kind === 'interface' && target?.kind === 'interface') type = 'inheritance';
    const id = uid('r');
    dispatch({
      type: 'ADD_RELATIONSHIP',
      rel: {
        id, type, sourceId: connectSource, targetId: classId, label: '',
        sourceMultiplicity: '', targetMultiplicity: DEFAULT_TARGET_MULTIPLICITY[type] ?? '',
      },
    });
    setSelection({ kind: 'relationship', id });
    setTab('props');
    cancelConnect();
  };

  const deleteSelection = useCallback(() => {
    if (!sel) return;
    dispatch(sel.kind === 'class' ? { type: 'DELETE_CLASS', id: sel.id } : { type: 'DELETE_RELATIONSHIP', id: sel.id });
    setSelection(null);
  }, [sel]);

  // Keyboard shortcuts (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if (e.key === 'Escape') {
        if (connecting) cancelConnect();
        else setSelection(null);
        return;
      }
      if (typing) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        dispatch({ type: 'UNDO' });
      } else if (mod && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        dispatch({ type: 'REDO' });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteSelection();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [connecting, cancelConnect, deleteSelection]);

  const selectFromIssue = (targetId: string) => {
    if (diagram.classes.some((c) => c.id === targetId)) setSelection({ kind: 'class', id: targetId });
    else if (diagram.relationships.some((r) => r.id === targetId)) setSelection({ kind: 'relationship', id: targetId });
    setTab('props');
  };

  const connectHint = connecting
    ? connectSource
      ? `Now click the target class for the ${connectType} (Esc to cancel).`
      : `Click the source class for the ${connectType} (Esc to cancel).`
    : null;

  return (
    <div className="app">
      <Toolbar
        connectType={connectType}
        connecting={connecting}
        zoom={zoom}
        canUndo={history.past.length > 0}
        canRedo={history.future.length > 0}
        hasCode={files.length > 0}
        onAdd={addClass}
        onConnectTypeChange={(t) => { setConnectType(t); setConnectSource(null); }}
        onToggleConnect={() => (connecting ? cancelConnect() : (setConnecting(true), setSelection(null)))}
        onZoom={setZoom}
        onFit={fitToScreen}
        onUndo={() => dispatch({ type: 'UNDO' })}
        onRedo={() => dispatch({ type: 'REDO' })}
        onSample={() => {
          if (window.confirm('Replace the current diagram with the sample library model?')) {
            dispatch({ type: 'LOAD', diagram: sampleDiagram() });
            setSelection(null);
          }
        }}
        onClear={() => {
          if (window.confirm('Remove all classes and relationships?')) {
            dispatch({ type: 'LOAD', diagram: { ...emptyDiagram(), settings: diagram.settings } });
            setSelection(null);
          }
        }}
        onDownload={() => downloadAllAsZip(files, diagram.settings.packageName)}
      />

      {connectHint && <div className="hint-bar" role="status">{connectHint}</div>}

      <div className="workspace">
        <Canvas
          diagram={diagram}
          zoom={zoom}
          selection={sel}
          connectMode={connecting}
          connectSourceId={connectSource}
          scrollRef={scrollRef}
          dispatch={dispatch}
          onSelect={setSelection}
          onConnectClick={handleConnectClick}
        />

        <aside className="sidebar">
          <div className="tabs" role="tablist">
            <button role="tab" aria-selected={tab === 'props'} className={`tab ${tab === 'props' ? 'active' : ''}`}
              onClick={() => setTab('props')}>
              {selectedClass ? 'Class' : selectedRel ? 'Relationship' : 'Properties'}
            </button>
            <button role="tab" aria-selected={tab === 'code'} className={`tab ${tab === 'code' ? 'active' : ''}`}
              onClick={() => setTab('code')}>
              Java Code
              {issues.length > 0 && <span className={`badge ${errorCount ? 'badge-error' : ''}`}>{issues.length}</span>}
            </button>
          </div>
          <div className="sidebar-body">
            {tab === 'props' && (
              selectedClass ? (
                <ClassEditor key={selectedClass.id} cls={selectedClass} dispatch={dispatch} onDelete={deleteSelection} />
              ) : selectedRel ? (
                <RelationshipEditor key={selectedRel.id} rel={selectedRel} classes={diagram.classes} dispatch={dispatch} onDelete={deleteSelection} />
              ) : (
                <SettingsEditor settings={diagram.settings} dispatch={dispatch} />
              )
            )}
            {tab === 'code' && (
              <CodePanel
                files={files}
                issues={issues}
                packageName={diagram.settings.packageName}
                selectedClassId={selectedClass?.id ?? null}
                onIssueClick={selectFromIssue}
              />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
