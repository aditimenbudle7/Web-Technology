import type { RelationType, Settings } from '../types';
import { RELATION_LABELS } from '../types';
import type { Action } from '../state/diagramReducer';
import MarkerDefs, { lineStyle } from './MarkerDefs';

interface Props {
  settings: Settings;
  dispatch: (a: Action) => void;
}

const LEGEND_PREFIX = 'lg-';

export default function SettingsEditor({ settings, dispatch }: Props) {
  const update = (patch: Partial<Settings>) => dispatch({ type: 'UPDATE_SETTINGS', patch });
  return (
    <div className="editor">
      <h3>Code generation settings</h3>
      <label className="field">
        <span>Java package</span>
        <input className="input" value={settings.packageName} placeholder="leave empty for default package"
          spellCheck={false} onChange={(e) => update({ packageName: e.target.value })} />
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.generateConstructors}
          onChange={(e) => update({ generateConstructors: e.target.checked })} />
        Generate constructors
      </label>
      <label className="check">
        <input type="checkbox" checked={settings.generateGettersSetters}
          onChange={(e) => update({ generateGettersSetters: e.target.checked })} />
        Generate getters &amp; setters
      </label>

      <h3>Relationship notation</h3>
      <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true"><MarkerDefs prefix={LEGEND_PREFIX} /></svg>
      <ul className="legend">
        {(Object.keys(RELATION_LABELS) as RelationType[]).map((t) => {
          const { dashed, markerStart, markerEnd } = lineStyle(t, LEGEND_PREFIX, false);
          return (
            <li key={t}>
              <svg width="90" height="20" aria-hidden="true">
                <line x1="12" y1="10" x2="80" y2="10" className="rel-line"
                  strokeDasharray={dashed ? '7 5' : undefined} markerStart={markerStart} markerEnd={markerEnd} />
              </svg>
              <span>{RELATION_LABELS[t]}</span>
            </li>
          );
        })}
      </ul>

      <h3>How to use</h3>
      <ol className="tips">
        <li>Add classes from the toolbar and drag them by any part of the box.</li>
        <li>Select a class to edit its name, attributes and methods here.</li>
        <li>Pick a relationship type, press <strong>Connect</strong>, then click the source and target class.</li>
        <li>Open the <strong>Java Code</strong> tab to see the generated code update live.</li>
        <li>Shortcuts: <kbd>Delete</kbd> removes the selection, <kbd>Ctrl</kbd>+<kbd>Z</kbd> / <kbd>Ctrl</kbd>+<kbd>Y</kbd> undo/redo, <kbd>Esc</kbd> cancels.</li>
      </ol>
    </div>
  );
}
