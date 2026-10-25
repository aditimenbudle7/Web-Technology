import type { Attribute, ClassKind, Method, UmlClass, Visibility } from '../types';
import { KIND_LABELS } from '../types';
import type { Action } from '../state/diagramReducer';
import { VISIBILITY_NAMES } from '../model/javaUtils';
import { uid } from '../model/uid';

interface Props {
  cls: UmlClass;
  dispatch: (a: Action) => void;
  onDelete: () => void;
}

const VISIBILITIES: Visibility[] = ['+', '-', '#', '~'];

function VisibilitySelect({ value, onChange }: { value: Visibility; onChange: (v: Visibility) => void }) {
  return (
    <select className="input vis" value={value} onChange={(e) => onChange(e.target.value as Visibility)}
      title={VISIBILITY_NAMES[value]} aria-label="Visibility">
      {VISIBILITIES.map((v) => <option key={v} value={v}>{v} {VISIBILITY_NAMES[v]}</option>)}
    </select>
  );
}

export default function ClassEditor({ cls, dispatch, onDelete }: Props) {
  const update = (patch: Partial<UmlClass>) => dispatch({ type: 'UPDATE_CLASS', id: cls.id, patch });
  const isEnum = cls.kind === 'enum';
  const isInterface = cls.kind === 'interface';

  const setAttr = (id: string, patch: Partial<Attribute>) =>
    update({ attributes: cls.attributes.map((a) => (a.id === id ? { ...a, ...patch } : a)) });
  const addAttr = () => {
    const n = cls.attributes.length + 1;
    const attr: Attribute = isEnum
      ? { id: uid('a'), visibility: '+', name: `CONSTANT_${n}`, type: '', isStatic: true }
      : { id: uid('a'), visibility: isInterface ? '+' : '-', name: `attribute${n}`, type: 'String', isStatic: isInterface };
    update({ attributes: [...cls.attributes, attr] });
  };
  const removeAttr = (id: string) => update({ attributes: cls.attributes.filter((a) => a.id !== id) });

  const setMethod = (id: string, patch: Partial<Method>) =>
    update({ methods: cls.methods.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const addMethod = () => {
    const m: Method = {
      id: uid('m'), visibility: '+', name: `method${cls.methods.length + 1}`, params: '',
      returnType: 'void', isStatic: false, isAbstract: false,
    };
    update({ methods: [...cls.methods, m] });
  };
  const removeMethod = (id: string) => update({ methods: cls.methods.filter((m) => m.id !== id) });

  const move = <T,>(list: T[], index: number, dir: -1 | 1): T[] => {
    const j = index + dir;
    if (j < 0 || j >= list.length) return list;
    const copy = [...list];
    [copy[index], copy[j]] = [copy[j], copy[index]];
    return copy;
  };

  return (
    <div className="editor">
      <div className="editor-grid">
        <label className="field">
          <span>Name</span>
          <input className="input" value={cls.name} onChange={(e) => update({ name: e.target.value })} spellCheck={false} />
        </label>
        <label className="field">
          <span>Type</span>
          <select className="input" value={cls.kind} onChange={(e) => update({ kind: e.target.value as ClassKind })}>
            {(Object.keys(KIND_LABELS) as ClassKind[]).map((k) => <option key={k} value={k}>{KIND_LABELS[k]}</option>)}
          </select>
        </label>
      </div>

      <section className="member-section">
        <div className="member-head">
          <h3>{isEnum ? 'Enum constants' : isInterface ? 'Constants' : 'Attributes'}</h3>
          <button className="btn btn-sm" onClick={addAttr}>+ Add</button>
        </div>
        {cls.attributes.length === 0 && <p className="muted small">None yet.</p>}
        {cls.attributes.map((a, i) => (
          <div key={a.id} className={`member-row ${isEnum ? 'enum-row' : ''}`}>
            {!isEnum && <VisibilitySelect value={a.visibility} onChange={(v) => setAttr(a.id, { visibility: v })} />}
            <input className="input" value={a.name} placeholder="name" spellCheck={false} aria-label="Attribute name"
              onChange={(e) => setAttr(a.id, { name: e.target.value })} />
            {!isEnum && (
              <input className="input" value={a.type} placeholder="type" spellCheck={false} aria-label="Attribute type"
                onChange={(e) => setAttr(a.id, { type: e.target.value })} />
            )}
            {!isEnum && !isInterface && (
              <label className="check" title="static">
                <input type="checkbox" checked={a.isStatic} onChange={(e) => setAttr(a.id, { isStatic: e.target.checked })} />
                static
              </label>
            )}
            <div className="row-actions">
              <button className="icon-btn" title="Move up" onClick={() => update({ attributes: move(cls.attributes, i, -1) })}>↑</button>
              <button className="icon-btn" title="Move down" onClick={() => update({ attributes: move(cls.attributes, i, 1) })}>↓</button>
              <button className="icon-btn danger" title="Remove" onClick={() => removeAttr(a.id)}>✕</button>
            </div>
          </div>
        ))}
      </section>

      <section className="member-section">
        <div className="member-head">
          <h3>Methods</h3>
          <button className="btn btn-sm" onClick={addMethod}>+ Add</button>
        </div>
        {cls.methods.length === 0 && <p className="muted small">None yet.</p>}
        {cls.methods.map((m, i) => (
          <div key={m.id} className="method-card">
            <div className="member-row">
              {!isInterface && <VisibilitySelect value={m.visibility} onChange={(v) => setMethod(m.id, { visibility: v })} />}
              <input className="input" value={m.name} placeholder="name" spellCheck={false} aria-label="Method name"
                onChange={(e) => setMethod(m.id, { name: e.target.value })} />
              <input className="input" value={m.returnType} placeholder="return type" spellCheck={false} aria-label="Return type"
                onChange={(e) => setMethod(m.id, { returnType: e.target.value })} />
              <div className="row-actions">
                <button className="icon-btn" title="Move up" onClick={() => update({ methods: move(cls.methods, i, -1) })}>↑</button>
                <button className="icon-btn" title="Move down" onClick={() => update({ methods: move(cls.methods, i, 1) })}>↓</button>
                <button className="icon-btn danger" title="Remove" onClick={() => removeMethod(m.id)}>✕</button>
              </div>
            </div>
            <div className="member-row">
              <input className="input" value={m.params} placeholder="parameters, e.g. String title, int qty"
                spellCheck={false} aria-label="Parameters" onChange={(e) => setMethod(m.id, { params: e.target.value })} />
              <label className="check">
                <input type="checkbox" checked={m.isStatic} onChange={(e) => setMethod(m.id, { isStatic: e.target.checked })} />
                static
              </label>
              {cls.kind === 'abstract' && (
                <label className="check">
                  <input type="checkbox" checked={m.isAbstract} onChange={(e) => setMethod(m.id, { isAbstract: e.target.checked })} />
                  abstract
                </label>
              )}
            </div>
          </div>
        ))}
      </section>

      <button className="btn btn-danger btn-block" onClick={onDelete}>Delete {KIND_LABELS[cls.kind].toLowerCase()}</button>
    </div>
  );
}
