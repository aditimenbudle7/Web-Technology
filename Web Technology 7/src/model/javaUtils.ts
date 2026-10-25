import type { Visibility } from '../types';

export const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class', 'const', 'continue',
  'default', 'do', 'double', 'else', 'enum', 'extends', 'final', 'finally', 'float', 'for', 'goto', 'if',
  'implements', 'import', 'instanceof', 'int', 'interface', 'long', 'native', 'new', 'package', 'private',
  'protected', 'public', 'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false', 'null', 'var', 'record',
]);

export function isValidIdentifier(name: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) && !JAVA_KEYWORDS.has(name);
}

export const VISIBILITY_KEYWORD: Record<Visibility, string> = {
  '+': 'public ',
  '-': 'private ',
  '#': 'protected ',
  '~': '',
};

export const VISIBILITY_NAMES: Record<Visibility, string> = {
  '+': 'public',
  '-': 'private',
  '#': 'protected',
  '~': 'package',
};

/** Splits "Map<String, Integer> m, int x" at top-level commas only. */
export function splitParams(params: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of params) {
    if (ch === '<') depth++;
    if (ch === '>') depth--;
    if (ch === ',' && depth === 0) {
      if (cur.trim()) out.push(cur.trim());
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** Also accepts UML style "title: String" and converts it to "String title". */
function normaliseParam(p: string, index: number): string {
  const uml = p.match(/^([A-Za-z_$][\w$]*)\s*:\s*(.+)$/);
  if (uml) return `${uml[2].trim()} ${uml[1]}`;
  // Only a type was given (e.g. "int") – invent a name.
  if (!/\s[A-Za-z_$][\w$]*$/.test(p)) return `${p} arg${index}`;
  return p.replace(/\s+/g, ' ');
}

export function formatParams(params: string): string {
  return splitParams(params).map(normaliseParam).join(', ');
}

export function paramTypes(params: string): string[] {
  return splitParams(params)
    .map(normaliseParam)
    .map((p) => p.replace(/\s+[A-Za-z_$][\w$]*$/, '').replace(/\s+/g, ''));
}

export function defaultValue(type: string): string | null {
  const t = type.trim();
  switch (t) {
    case '':
    case 'void':
      return null;
    case 'boolean':
      return 'false';
    case 'char':
      return "'\\0'";
    case 'byte':
    case 'short':
    case 'int':
      return '0';
    case 'long':
      return '0L';
    case 'float':
      return '0.0f';
    case 'double':
      return '0.0';
    default:
      return 'null';
  }
}

export const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
export const lowerFirst = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

/** "*", "0..*", "1..*", "n" or a number > 1 means a collection. */
export function isMany(multiplicity: string): boolean {
  const m = multiplicity.trim();
  if (!m) return false;
  const upper = m.includes('..') ? m.split('..')[1].trim() : m;
  return upper === '*' || upper.toLowerCase() === 'n' || Number(upper) > 1;
}

const KNOWN_IMPORTS: Record<string, string> = {
  List: 'java.util.List',
  ArrayList: 'java.util.ArrayList',
  LinkedList: 'java.util.LinkedList',
  Map: 'java.util.Map',
  HashMap: 'java.util.HashMap',
  Set: 'java.util.Set',
  HashSet: 'java.util.HashSet',
  Optional: 'java.util.Optional',
  Date: 'java.util.Date',
  UUID: 'java.util.UUID',
  LocalDate: 'java.time.LocalDate',
  LocalDateTime: 'java.time.LocalDateTime',
  BigDecimal: 'java.math.BigDecimal',
};

export function addImportsFor(type: string, imports: Set<string>): void {
  for (const word of type.match(/[A-Za-z_$][\w$]*/g) ?? []) {
    const imp = KNOWN_IMPORTS[word];
    if (imp) imports.add(imp);
  }
}
