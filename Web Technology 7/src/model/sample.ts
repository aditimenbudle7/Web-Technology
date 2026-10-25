import type { Diagram } from '../types';

/** A small library-management model that shows every feature. */
export function sampleDiagram(): Diagram {
  return {
    settings: { packageName: 'com.library.model', generateGettersSetters: true, generateConstructors: true },
    classes: [
      {
        id: 'c_person', name: 'Person', kind: 'abstract', x: 170, y: 30,
        attributes: [
          { id: 'a1', visibility: '#', name: 'name', type: 'String', isStatic: false },
          { id: 'a2', visibility: '#', name: 'email', type: 'String', isStatic: false },
        ],
        methods: [
          { id: 'm1', visibility: '+', name: 'getDetails', params: '', returnType: 'String', isStatic: false, isAbstract: true },
        ],
      },
      {
        id: 'c_member', name: 'Member', kind: 'class', x: 20, y: 280,
        attributes: [
          { id: 'a3', visibility: '-', name: 'memberId', type: 'int', isStatic: false },
          { id: 'a4', visibility: '-', name: 'joinedOn', type: 'LocalDate', isStatic: false },
        ],
        methods: [
          { id: 'm2', visibility: '+', name: 'borrowBook', params: 'Book book', returnType: 'boolean', isStatic: false, isAbstract: false },
        ],
      },
      {
        id: 'c_librarian', name: 'Librarian', kind: 'class', x: 320, y: 280,
        attributes: [
          { id: 'a5', visibility: '-', name: 'staffId', type: 'int', isStatic: false },
        ],
        methods: [
          { id: 'm3', visibility: '+', name: 'addBook', params: 'Book book', returnType: 'void', isStatic: false, isAbstract: false },
          { id: 'm4', visibility: '+', name: 'getDetails', params: '', returnType: 'String', isStatic: false, isAbstract: false },
        ],
      },
      {
        id: 'c_library', name: 'Library', kind: 'class', x: 620, y: 30,
        attributes: [
          { id: 'a6', visibility: '-', name: 'name', type: 'String', isStatic: false },
          { id: 'a7', visibility: '-', name: 'totalLibraries', type: 'int', isStatic: true },
        ],
        methods: [
          { id: 'm5', visibility: '+', name: 'findByTitle', params: 'String title', returnType: 'Book', isStatic: false, isAbstract: false },
        ],
      },
      {
        id: 'c_book', name: 'Book', kind: 'class', x: 620, y: 280,
        attributes: [
          { id: 'a8', visibility: '-', name: 'isbn', type: 'String', isStatic: false },
          { id: 'a9', visibility: '-', name: 'title', type: 'String', isStatic: false },
          { id: 'a10', visibility: '-', name: 'available', type: 'boolean', isStatic: false },
        ],
        methods: [],
      },
      {
        id: 'c_borrowable', name: 'Borrowable', kind: 'interface', x: 320, y: 500,
        attributes: [],
        methods: [
          { id: 'm6', visibility: '+', name: 'borrow', params: 'Member member', returnType: 'void', isStatic: false, isAbstract: false },
          { id: 'm7', visibility: '+', name: 'returnItem', params: '', returnType: 'void', isStatic: false, isAbstract: false },
        ],
      },
      {
        id: 'c_genre', name: 'Genre', kind: 'enum', x: 620, y: 500,
        attributes: [
          { id: 'a11', visibility: '+', name: 'FICTION', type: '', isStatic: true },
          { id: 'a12', visibility: '+', name: 'SCIENCE', type: '', isStatic: true },
          { id: 'a13', visibility: '+', name: 'HISTORY', type: '', isStatic: true },
        ],
        methods: [],
      },
    ],
    relationships: [
      { id: 'r1', type: 'inheritance', sourceId: 'c_member', targetId: 'c_person', label: '', sourceMultiplicity: '', targetMultiplicity: '' },
      { id: 'r2', type: 'inheritance', sourceId: 'c_librarian', targetId: 'c_person', label: '', sourceMultiplicity: '', targetMultiplicity: '' },
      { id: 'r3', type: 'realization', sourceId: 'c_book', targetId: 'c_borrowable', label: '', sourceMultiplicity: '', targetMultiplicity: '' },
      { id: 'r4', type: 'composition', sourceId: 'c_library', targetId: 'c_book', label: 'books', sourceMultiplicity: '1', targetMultiplicity: '0..*' },
      { id: 'r5', type: 'aggregation', sourceId: 'c_library', targetId: 'c_librarian', label: 'staff', sourceMultiplicity: '1', targetMultiplicity: '1..*' },
      { id: 'r6', type: 'association', sourceId: 'c_library', targetId: 'c_member', label: 'members', sourceMultiplicity: '1', targetMultiplicity: '0..*' },
      { id: 'r7', type: 'association', sourceId: 'c_book', targetId: 'c_genre', label: 'genre', sourceMultiplicity: '', targetMultiplicity: '1' },
      { id: 'r8', type: 'dependency', sourceId: 'c_librarian', targetId: 'c_book', label: '', sourceMultiplicity: '', targetMultiplicity: '' },
    ],
  };
}

export function emptyDiagram(): Diagram {
  return {
    settings: { packageName: 'com.example.model', generateGettersSetters: true, generateConstructors: true },
    classes: [],
    relationships: [],
  };
}
