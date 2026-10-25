import type { Diagram } from '../types';
import { isValidIdentifier } from './javaUtils';

export interface Issue {
  level: 'error' | 'warning';
  message: string;
  targetId?: string;
}

export function validate(d: Diagram): Issue[] {
  const issues: Issue[] = [];
  const byId = new Map(d.classes.map((c) => [c.id, c]));
  const nameCount = new Map<string, number>();
  d.classes.forEach((c) => nameCount.set(c.name.trim(), (nameCount.get(c.name.trim()) ?? 0) + 1));

  for (const c of d.classes) {
    const name = c.name.trim();
    if (!name) {
      issues.push({ level: 'error', message: 'A class has no name and will be skipped.', targetId: c.id });
      continue;
    }
    if (!isValidIdentifier(name)) {
      issues.push({ level: 'error', message: `"${name}" is not a valid Java class name.`, targetId: c.id });
    }
    if ((nameCount.get(name) ?? 0) > 1) {
      issues.push({ level: 'error', message: `Duplicate class name "${name}".`, targetId: c.id });
    }

    const seen = new Set<string>();
    for (const a of c.attributes) {
      const n = a.name.trim();
      if (!isValidIdentifier(n)) {
        issues.push({ level: 'warning', message: `${name}: "${n || '(empty)'}" is not a valid ${c.kind === 'enum' ? 'constant' : 'field'} name.`, targetId: c.id });
      } else if (seen.has(n)) {
        issues.push({ level: 'warning', message: `${name}: duplicate member "${n}".`, targetId: c.id });
      }
      seen.add(n);
    }
    for (const m of c.methods) {
      const n = m.name.trim();
      if (!isValidIdentifier(n)) {
        issues.push({ level: 'warning', message: `${name}: "${n || '(empty)'}" is not a valid method name.`, targetId: c.id });
      }
      if (m.isAbstract && (c.kind === 'class' || c.kind === 'enum')) {
        issues.push({ level: 'warning', message: `${name}.${n}() is abstract, but ${name} is not abstract - a method body is generated instead.`, targetId: c.id });
      }
    }
  }

  // Relationship rules
  const superCount = new Map<string, number>();
  for (const r of d.relationships) {
    const s = byId.get(r.sourceId);
    const t = byId.get(r.targetId);
    if (!s || !t) continue;
    const sn = s.name.trim() || '(unnamed)';
    const tn = t.name.trim() || '(unnamed)';
    if (r.type === 'inheritance') {
      if ((s.kind === 'class' || s.kind === 'abstract') && (t.kind === 'class' || t.kind === 'abstract')) {
        superCount.set(s.id, (superCount.get(s.id) ?? 0) + 1);
      }
      if (s.kind === 'interface' && t.kind !== 'interface') {
        issues.push({ level: 'error', message: `Interface ${sn} cannot extend ${t.kind === 'enum' ? 'enum' : 'class'} ${tn}.`, targetId: r.id });
      }
      if (t.kind === 'enum') {
        issues.push({ level: 'error', message: `${sn} cannot extend enum ${tn} - enums are final.`, targetId: r.id });
      }
      if (s.kind === 'enum') {
        issues.push({ level: 'error', message: `Enum ${sn} cannot extend another type.`, targetId: r.id });
      }
    }
    if (r.type === 'realization' && t.kind !== 'interface') {
      issues.push({ level: 'error', message: `${sn} can only implement interfaces, but ${tn} is not an interface.`, targetId: r.id });
    }
    if (r.type === 'realization' && s.kind === 'interface') {
      issues.push({ level: 'warning', message: `Interface ${sn} should use inheritance (extends) for ${tn}.`, targetId: r.id });
    }
  }
  for (const [id, count] of superCount) {
    if (count > 1) {
      issues.push({ level: 'error', message: `${byId.get(id)?.name}: Java allows only one superclass (only the first is used).`, targetId: id });
    }
  }

  // Inheritance cycles
  const parent = new Map<string, string>();
  d.relationships
    .filter((r) => r.type === 'inheritance')
    .forEach((r) => { if (!parent.has(r.sourceId)) parent.set(r.sourceId, r.targetId); });
  const reported = new Set<string>();
  for (const start of parent.keys()) {
    const path = new Set<string>();
    let cur: string | undefined = start;
    while (cur && !path.has(cur)) {
      path.add(cur);
      cur = parent.get(cur);
    }
    if (cur && cur === start && !reported.has(start)) {
      path.forEach((p) => reported.add(p));
      issues.push({ level: 'error', message: `Inheritance cycle involving ${byId.get(start)?.name}.`, targetId: start });
    }
  }

  return issues;
}
