import type { Relationship, RelationType, UmlClass } from '../types';
import { RELATION_LABELS } from '../types';
import type { Action } from '../state/diagramReducer';

interface Props {
  rel: Relationship;
  classes: UmlClass[];
  dispatch: (a: Action) => void;
  onDelete: () => void;
}

const MEANING: Record<RelationType, (s: string, t: string) => string> = {
  inheritance: (s, t) => `${s} extends ${t}.`,
  realization: (s, t) => `${s} implements ${t}.`,
  association: (s, t) => `${s} has a reference to ${t} (generates a field in ${s}).`,
  aggregation: (s, t) => `${s} (whole) holds ${t} parts, which can exist on their own.`,
  composition: (s, t) => `${s} (whole) owns ${t} parts; they are created and destroyed with it.`,
  dependency: (s, t) => `${s} uses ${t} temporarily (no field is generated).`,
};

const HAS_FIELD: RelationType[] = ['association', 'aggregation', 'composition'];

export default function RelationshipEditor({ rel, classes, dispatch, onDelete }: Props) {
  const update = (patch: Partial<Relationship>) => dispatch({ type: 'UPDATE_RELATIONSHIP', id: rel.id, patch });
  const name = (id: string) => classes.find((c) => c.id === id)?.name || '?';
  const hasField = HAS_FIELD.includes(rel.type);

  return (
    <div className="editor">
      <label className="field">
        <span>Relationship type</span>
        <select className="input" value={rel.type} onChange={(e) => update({ type: e.target.value as RelationType })}>
          {(Object.keys(RELATION_LABELS) as RelationType[]).map((t) => <option key={t} value={t}>{RELATION_LABELS[t]}</option>)}
        </select>
      </label>

      <div className="editor-grid">
        <label className="field">
          <span>Source</span>
          <select className="input" value={rel.sourceId} onChange={(e) => update({ sourceId: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id} disabled={c.id === rel.targetId}>{c.name || 'Unnamed'}</option>)}
          </select>
        </label>
        <label className="field">
          <span>Target</span>
          <select className="input" value={rel.targetId} onChange={(e) => update({ targetId: e.target.value })}>
            {classes.map((c) => <option key={c.id} value={c.id} disabled={c.id === rel.sourceId}>{c.name || 'Unnamed'}</option>)}
          </select>
        </label>
      </div>

      <button className="btn btn-sm" onClick={() => update({
        sourceId: rel.targetId, targetId: rel.sourceId,
        sourceMultiplicity: rel.targetMultiplicity, targetMultiplicity: rel.sourceMultiplicity,
      })}>⇄ Swap direction</button>

      <p className="meaning">{MEANING[rel.type](name(rel.sourceId), name(rel.targetId))}</p>

      {hasField && (
        <>
          <label className="field">
            <span>Field / role name (optional)</span>
            <input className="input" value={rel.label} placeholder="auto from target name" spellCheck={false}
              onChange={(e) => update({ label: e.target.value })} />
          </label>
          <div className="editor-grid">
            <label className="field">
              <span>Source multiplicity</span>
              <input className="input" value={rel.sourceMultiplicity} placeholder="e.g. 1"
                onChange={(e) => update({ sourceMultiplicity: e.target.value })} />
            </label>
            <label className="field">
              <span>Target multiplicity</span>
              <input className="input" value={rel.targetMultiplicity} placeholder="e.g. 0..*"
                onChange={(e) => update({ targetMultiplicity: e.target.value })} />
            </label>
          </div>
          <p className="muted small">A target multiplicity of <code>*</code>, <code>0..*</code>, <code>1..*</code> or more than 1 generates a <code>List&lt;…&gt;</code> field.</p>
        </>
      )}

      <button className="btn btn-danger btn-block" onClick={onDelete}>Delete relationship</button>
    </div>
  );
}
