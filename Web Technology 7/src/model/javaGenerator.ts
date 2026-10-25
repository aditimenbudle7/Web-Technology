import type { Diagram, Method, Settings, UmlClass, Visibility } from '../types';
import {
  VISIBILITY_KEYWORD, addImportsFor, capitalize, defaultValue, formatParams,
  isMany, lowerFirst, paramTypes,
} from './javaUtils';

export interface GeneratedFile {
  classId: string;
  fileName: string;
  code: string;
}

interface Field {
  visibility: Visibility;
  isStatic: boolean;
  type: string;
  name: string;
  init?: string;
  fromAttribute: boolean;
}

type ClassMap = Map<string, UmlClass>;

const IND = '    ';

const signature = (m: Method) => `${m.name.trim()}(${paramTypes(m.params).join(',')})`;
const returnTypeOf = (m: Method) => m.returnType.trim() || 'void';

export function superclassOf(c: UmlClass, d: Diagram, byId: ClassMap): UmlClass | undefined {
  if (c.kind === 'interface' || c.kind === 'enum') return undefined;
  for (const r of d.relationships) {
    if (r.type === 'inheritance' && r.sourceId === c.id) {
      const t = byId.get(r.targetId);
      if (t && (t.kind === 'class' || t.kind === 'abstract') && t.id !== c.id) return t;
    }
  }
  return undefined;
}

/** For classes: the implemented interfaces. For interfaces: the extended interfaces. */
export function interfacesOf(c: UmlClass, d: Diagram, byId: ClassMap): UmlClass[] {
  const result: UmlClass[] = [];
  for (const r of d.relationships) {
    if (r.sourceId !== c.id || (r.type !== 'realization' && r.type !== 'inheritance')) continue;
    const t = byId.get(r.targetId);
    if (t && t.kind === 'interface' && t.id !== c.id && !result.includes(t)) result.push(t);
  }
  return result;
}

interface InheritanceInfo {
  inheritedSigs: Set<string>; // used to add @Override
  stubs: { method: Method; fromInterface: boolean }[]; // abstract methods the class must implement
}

function inheritanceInfo(c: UmlClass, d: Diagram, byId: ClassMap): InheritanceInfo {
  const inheritedSigs = new Set<string>();
  const required = new Map<string, { method: Method; fromInterface: boolean }>();
  const implementedAbove = new Set<string>();
  const requiredIfaces: UmlClass[] = [...interfacesOf(c, d, byId)];
  const satisfiedIfaces: UmlClass[] = [];

  // Walk up the superclass chain. Once a concrete ancestor is reached,
  // everything above it is assumed to be implemented already.
  const visited = new Set<string>([c.id]);
  let satisfied = false;
  let anc = superclassOf(c, d, byId);
  while (anc && !visited.has(anc.id)) {
    visited.add(anc.id);
    if (anc.kind !== 'abstract') satisfied = true;
    for (const m of anc.methods) {
      if (m.isStatic || !m.name.trim()) continue;
      const s = signature(m);
      inheritedSigs.add(s);
      if (satisfied) continue;
      if (m.isAbstract) {
        if (!required.has(s)) required.set(s, { method: m, fromInterface: false });
      } else {
        implementedAbove.add(s);
      }
    }
    (satisfied ? satisfiedIfaces : requiredIfaces).push(...interfacesOf(anc, d, byId));
    anc = superclassOf(anc, d, byId);
  }

  const seen = new Set<string>();
  const walk = (start: UmlClass[], isRequired: boolean) => {
    const queue = [...start];
    while (queue.length) {
      const i = queue.shift()!;
      if (seen.has(i.id)) continue;
      seen.add(i.id);
      for (const m of i.methods) {
        if (m.isStatic || !m.name.trim()) continue;
        const s = signature(m);
        inheritedSigs.add(s);
        if (isRequired && !required.has(s)) required.set(s, { method: m, fromInterface: true });
      }
      queue.push(...interfacesOf(i, d, byId));
    }
  };
  walk(satisfiedIfaces, false);
  walk(requiredIfaces, true);

  const own = new Set(c.methods.map(signature));
  const needsStubs = c.kind === 'class' || c.kind === 'enum';
  const stubs = needsStubs
    ? [...required.entries()].filter(([s]) => !own.has(s) && !implementedAbove.has(s)).map(([, v]) => v)
    : [];
  return { inheritedSigs, stubs };
}

function relationFields(c: UmlClass, d: Diagram, byId: ClassMap): Field[] {
  const fields: Field[] = [];
  const taken = new Set(c.attributes.map((a) => a.name.trim()));
  for (const r of d.relationships) {
    if (r.sourceId !== c.id) continue;
    if (r.type !== 'association' && r.type !== 'aggregation' && r.type !== 'composition') continue;
    const target = byId.get(r.targetId);
    if (!target || !target.name.trim()) continue;
    const many = isMany(r.targetMultiplicity);
    const tName = target.name.trim();
    let name = r.label.trim() || (many ? `${lowerFirst(tName)}s` : lowerFirst(tName));
    while (taken.has(name)) name += '_';
    taken.add(name);
    let init: string | undefined;
    if (many) init = 'new ArrayList<>()';
    else if (r.type === 'composition' && target.kind === 'class') init = `new ${tName}()`;
    fields.push({
      visibility: '-',
      isStatic: false,
      type: many ? `List<${tName}>` : tName,
      name,
      init,
      fromAttribute: false,
    });
  }
  return fields;
}

function methodBody(returnType: string): string[] {
  const def = defaultValue(returnType);
  const lines = [`${IND}${IND}// TODO: implement`];
  if (def !== null) lines.push(`${IND}${IND}return ${def};`);
  return lines;
}

function generateClass(c: UmlClass, d: Diagram, byId: ClassMap, settings: Settings): string {
  const name = c.name.trim();
  const imports = new Set<string>();
  const sup = superclassOf(c, d, byId);
  const ifaces = interfacesOf(c, d, byId).map((i) => i.name.trim()).filter(Boolean);
  const { inheritedSigs, stubs } = inheritanceInfo(c, d, byId);
  const methods = c.methods.filter((m) => m.name.trim());

  const attrFields: Field[] = c.kind === 'enum' ? [] : c.attributes
    .filter((a) => a.name.trim())
    .map((a) => ({
      visibility: a.visibility, isStatic: a.isStatic, type: a.type.trim() || 'Object',
      name: a.name.trim(), fromAttribute: true,
    }));
  const relFields = c.kind === 'class' || c.kind === 'abstract' ? relationFields(c, d, byId) : [];
  const fields = [...attrFields, ...relFields];

  // ---- imports ----
  fields.forEach((f) => addImportsFor(f.type, imports));
  if (fields.some((f) => f.init?.startsWith('new ArrayList'))) imports.add('java.util.ArrayList');
  [...methods, ...stubs.map((s) => s.method)].forEach((m) => {
    addImportsFor(m.returnType, imports);
    addImportsFor(m.params, imports);
  });

  const blocks: string[][] = [];

  // ---- enum constants ----
  if (c.kind === 'enum') {
    const constants = c.attributes.map((a) => a.name.trim()).filter(Boolean);
    blocks.push([`${IND}${constants.join(', ')};`]);
  }

  // ---- fields ----
  if (fields.length) {
    blocks.push(fields.map((f) => {
      if (c.kind === 'interface') {
        return `${IND}${f.type} ${f.name} = ${defaultValue(f.type) ?? 'null'};`;
      }
      const mods = `${VISIBILITY_KEYWORD[f.visibility]}${f.isStatic ? 'static ' : ''}`;
      return `${IND}${mods}${f.type} ${f.name}${f.init ? ` = ${f.init}` : ''};`;
    }));
  }

  // ---- constructors ----
  if (settings.generateConstructors && (c.kind === 'class' || c.kind === 'abstract')) {
    blocks.push([`${IND}public ${name}() {`, `${IND}}`]);
    const ctorFields = attrFields.filter((f) => !f.isStatic);
    if (ctorFields.length) {
      blocks.push([
        `${IND}public ${name}(${ctorFields.map((f) => `${f.type} ${f.name}`).join(', ')}) {`,
        ...ctorFields.map((f) => `${IND}${IND}this.${f.name} = ${f.name};`),
        `${IND}}`,
      ]);
    }
  }

  // ---- declared methods ----
  for (const m of methods) {
    const ret = returnTypeOf(m);
    const params = formatParams(m.params);
    const override = !m.isStatic && inheritedSigs.has(signature(m)) && c.kind !== 'interface';
    const head = override ? [`${IND}@Override`] : [];
    if (c.kind === 'interface') {
      if (m.isStatic) {
        blocks.push([`${IND}static ${ret} ${m.name}(${params}) {`, ...methodBody(ret), `${IND}}`]);
      } else {
        blocks.push([`${IND}${ret} ${m.name}(${params});`]);
      }
    } else if (m.isAbstract && c.kind === 'abstract') {
      blocks.push([...head, `${IND}${VISIBILITY_KEYWORD[m.visibility]}abstract ${ret} ${m.name}(${params});`]);
    } else {
      const mods = `${VISIBILITY_KEYWORD[m.visibility]}${m.isStatic ? 'static ' : ''}`;
      blocks.push([...head, `${IND}${mods}${ret} ${m.name}(${params}) {`, ...methodBody(ret), `${IND}}`]);
    }
  }

  // ---- stubs for inherited abstract / interface methods ----
  for (const { method: m, fromInterface } of stubs) {
    const ret = returnTypeOf(m);
    const vis = fromInterface ? 'public ' : VISIBILITY_KEYWORD[m.visibility] || 'public ';
    blocks.push([
      `${IND}@Override`,
      `${IND}${vis}${ret} ${m.name.trim()}(${formatParams(m.params)}) {`,
      ...methodBody(ret),
      `${IND}}`,
    ]);
  }

  // ---- getters & setters ----
  if (settings.generateGettersSetters && (c.kind === 'class' || c.kind === 'abstract')) {
    const ownNames = new Set(methods.map((m) => m.name.trim()));
    for (const f of fields) {
      if (f.isStatic || (f.visibility !== '-' && f.visibility !== '#')) continue;
      const getter = `${f.type === 'boolean' ? 'is' : 'get'}${capitalize(f.name)}`;
      const setter = `set${capitalize(f.name)}`;
      if (!ownNames.has(getter)) {
        blocks.push([`${IND}public ${f.type} ${getter}() {`, `${IND}${IND}return ${f.name};`, `${IND}}`]);
      }
      if (!ownNames.has(setter)) {
        blocks.push([
          `${IND}public void ${setter}(${f.type} ${f.name}) {`,
          `${IND}${IND}this.${f.name} = ${f.name};`,
          `${IND}}`,
        ]);
      }
    }
  }

  // ---- assemble ----
  const out: string[] = [];
  const pkg = settings.packageName.trim();
  if (pkg) out.push(`package ${pkg};`, '');
  if (imports.size) out.push(...[...imports].sort().map((i) => `import ${i};`), '');
  out.push('/**', ` * ${name} - generated from the UML class diagram.`, ' */');

  let decl: string;
  if (c.kind === 'interface') {
    decl = `public interface ${name}${ifaces.length ? ` extends ${ifaces.join(', ')}` : ''} {`;
  } else if (c.kind === 'enum') {
    decl = `public enum ${name}${ifaces.length ? ` implements ${ifaces.join(', ')}` : ''} {`;
  } else {
    decl = `public ${c.kind === 'abstract' ? 'abstract ' : ''}class ${name}`
      + `${sup ? ` extends ${sup.name.trim()}` : ''}`
      + `${ifaces.length ? ` implements ${ifaces.join(', ')}` : ''} {`;
  }
  out.push(decl);
  blocks.forEach((b, i) => {
    if (i > 0) out.push('');
    out.push(...b);
  });
  out.push('}', '');
  return out.join('\n');
}

export function generateJava(d: Diagram): GeneratedFile[] {
  const byId: ClassMap = new Map(d.classes.map((c) => [c.id, c]));
  return d.classes
    .filter((c) => c.name.trim())
    .map((c) => ({
      classId: c.id,
      fileName: `${c.name.trim()}.java`,
      code: generateClass(c, d, byId, d.settings),
    }));
}
