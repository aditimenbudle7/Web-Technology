export type Visibility = '+' | '-' | '#' | '~';
export type ClassKind = 'class' | 'abstract' | 'interface' | 'enum';

/**
 * Relationship direction convention (source → target):
 *  inheritance  : source extends target
 *  realization  : source implements target
 *  association  : source has a field of type target
 *  aggregation  : source (whole, hollow diamond) has target parts
 *  composition  : source (whole, filled diamond) owns target parts
 *  dependency   : source uses target (no field)
 */
export type RelationType =
  | 'inheritance'
  | 'realization'
  | 'association'
  | 'aggregation'
  | 'composition'
  | 'dependency';

export interface Attribute {
  id: string;
  visibility: Visibility;
  name: string;
  type: string;
  isStatic: boolean;
}

export interface Method {
  id: string;
  visibility: Visibility;
  name: string;
  params: string; // e.g. "String title, int qty"
  returnType: string;
  isStatic: boolean;
  isAbstract: boolean;
}

export interface UmlClass {
  id: string;
  name: string;
  kind: ClassKind;
  x: number;
  y: number;
  attributes: Attribute[];
  methods: Method[];
}

export interface Relationship {
  id: string;
  type: RelationType;
  sourceId: string;
  targetId: string;
  label: string; // field / role name for associations
  sourceMultiplicity: string;
  targetMultiplicity: string;
}

export interface Settings {
  packageName: string;
  generateGettersSetters: boolean;
  generateConstructors: boolean;
}

export interface Diagram {
  classes: UmlClass[];
  relationships: Relationship[];
  settings: Settings;
}

export type Selection = { kind: 'class'; id: string } | { kind: 'relationship'; id: string } | null;

export const RELATION_LABELS: Record<RelationType, string> = {
  inheritance: 'Inheritance (extends)',
  realization: 'Realization (implements)',
  association: 'Association',
  aggregation: 'Aggregation',
  composition: 'Composition',
  dependency: 'Dependency',
};

export const KIND_LABELS: Record<ClassKind, string> = {
  class: 'Class',
  abstract: 'Abstract class',
  interface: 'Interface',
  enum: 'Enum',
};
