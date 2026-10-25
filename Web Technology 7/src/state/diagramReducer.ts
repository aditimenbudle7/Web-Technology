import type { ClassKind, Diagram, Relationship, Settings, UmlClass } from '../types';
import { emptyDiagram, sampleDiagram } from '../model/sample';

export type Action =
  | { type: 'ADD_CLASS'; id: string; kind: ClassKind; x: number; y: number }
  | { type: 'UPDATE_CLASS'; id: string; patch: Partial<UmlClass> }
  | { type: 'MOVE_CLASS'; id: string; x: number; y: number } // not recorded in history
  | { type: 'DELETE_CLASS'; id: string }
  | { type: 'ADD_RELATIONSHIP'; rel: Relationship }
  | { type: 'UPDATE_RELATIONSHIP'; id: string; patch: Partial<Relationship> }
  | { type: 'DELETE_RELATIONSHIP'; id: string }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<Settings> }
  | { type: 'LOAD'; diagram: Diagram }
  | { type: 'CHECKPOINT' } // save current state before a drag
  | { type: 'UNDO' }
  | { type: 'REDO' };

export interface History {
  past: Diagram[];
  present: Diagram;
  future: Diagram[];
}

const MAX_HISTORY = 100;
export const STORAGE_KEY = 'uml-diagram-v1';

const BASE_NAMES: Record<ClassKind, string> = {
  class: 'NewClass',
  abstract: 'AbstractClass',
  interface: 'NewInterface',
  enum: 'NewEnum',
};

function uniqueName(base: string, d: Diagram): string {
  const names = new Set(d.classes.map((c) => c.name));
  if (!names.has(base)) return base;
  let i = 2;
  while (names.has(`${base}${i}`)) i++;
  return `${base}${i}`;
}

function apply(d: Diagram, action: Action): Diagram {
  switch (action.type) {
    case 'ADD_CLASS':
      return {
        ...d,
        classes: [...d.classes, {
          id: action.id,
          name: uniqueName(BASE_NAMES[action.kind], d),
          kind: action.kind,
          x: action.x,
          y: action.y,
          attributes: [],
          methods: [],
        }],
      };
    case 'UPDATE_CLASS':
      return { ...d, classes: d.classes.map((c) => (c.id === action.id ? { ...c, ...action.patch } : c)) };
    case 'MOVE_CLASS':
      return { ...d, classes: d.classes.map((c) => (c.id === action.id ? { ...c, x: action.x, y: action.y } : c)) };
    case 'DELETE_CLASS':
      return {
        ...d,
        classes: d.classes.filter((c) => c.id !== action.id),
        relationships: d.relationships.filter((r) => r.sourceId !== action.id && r.targetId !== action.id),
      };
    case 'ADD_RELATIONSHIP':
      return { ...d, relationships: [...d.relationships, action.rel] };
    case 'UPDATE_RELATIONSHIP':
      return { ...d, relationships: d.relationships.map((r) => (r.id === action.id ? { ...r, ...action.patch } : r)) };
    case 'DELETE_RELATIONSHIP':
      return { ...d, relationships: d.relationships.filter((r) => r.id !== action.id) };
    case 'UPDATE_SETTINGS':
      return { ...d, settings: { ...d.settings, ...action.patch } };
    case 'LOAD':
      return action.diagram;
    default:
      return d;
  }
}

export function historyReducer(h: History, action: Action): History {
  switch (action.type) {
    case 'UNDO': {
      if (!h.past.length) return h;
      return { past: h.past.slice(0, -1), present: h.past[h.past.length - 1], future: [h.present, ...h.future] };
    }
    case 'REDO': {
      if (!h.future.length) return h;
      return { past: [...h.past, h.present], present: h.future[0], future: h.future.slice(1) };
    }
    case 'CHECKPOINT':
      return { past: [...h.past, h.present].slice(-MAX_HISTORY), present: h.present, future: [] };
    case 'MOVE_CLASS':
      return { ...h, present: apply(h.present, action) };
    default: {
      const next = apply(h.present, action);
      if (next === h.present) return h;
      return { past: [...h.past, h.present].slice(-MAX_HISTORY), present: next, future: [] };
    }
  }
}

export function initHistory(): History {
  let present: Diagram = sampleDiagram();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Diagram;
      if (Array.isArray(parsed.classes) && Array.isArray(parsed.relationships) && parsed.settings) present = parsed;
    }
  } catch {
    /* storage unavailable - start with the sample */
  }
  return { past: [], present, future: [] };
}

export { emptyDiagram, sampleDiagram };
