# UML Class Diagram Generator

An interactive, browser-based tool built with **React + TypeScript** for visually designing UML class diagrams and automatically generating the matching **Java source code**.

## Features
- **Visual editor:** add classes, abstract classes, interfaces and enums; drag them around a grid canvas (snaps to 10 px).
- **Members:** attributes and methods with visibility (`+ - # ~`), types, parameters, `static` and `abstract` flags.
- **All six UML relationships** in standard notation:
  inheritance, realization, association, aggregation, composition and dependency, with role names and multiplicities.
- **Live Java code generation:**
  - `extends` / `implements` from inheritance and realization arrows
  - fields generated from associations; multiplicities like `*`, `0..*`, `1..*` become `List<T>` (with `ArrayList` initialised)
  - composition creates the part object (`new Part()`)
  - `@Override` stubs auto-generated for interface methods and inherited abstract methods
  - optional constructors (no-arg + all-args) and getters/setters (`isX()` for booleans)
  - automatic imports (`List`, `ArrayList`, `LocalDate`, `Map`, ...) and package declaration
  - syntax-highlighted preview, copy to clipboard, download one file or all files as a `.zip`
- **Validation:** invalid / duplicate names, multiple superclasses, inheritance cycles, classes implementing non-interfaces, and more.
- **Undo / redo**, keyboard shortcuts, zoom and fit-to-screen.
- **Autosave** in the browser and a ready-made **sample** (library management system).
- **Responsive** layout for desktop, tablet and mobile, with light and dark themes.

## Tech stack
React 18 · TypeScript · Vite · JSZip (zip download). No backend; everything runs in the browser.

## Run locally
Requires Node.js 18+.
```bash
npm install
npm run dev
```
Open http://localhost:5173

Production build: `npm run build` (output in `dist/`).

## How to use
1. Click **+ Class / + Interface / + Abstract / + Enum** to add elements, then drag them into place.
2. Select an element to edit its name, attributes and methods in the right panel.
3. Choose a relationship type, press **Connect**, then click the **source** and then the **target** class.
   - Inheritance: *source extends target*
   - Realization: *source implements target*
   - Association / aggregation / composition: *source has field(s) of type target*
   - Dependency: *source uses target* (no field)
4. Open the **Java Code** tab to view, copy or download the generated code.

Shortcuts: `Delete` removes the selection · `Ctrl+Z` / `Ctrl+Y` undo/redo · `Esc` cancels / deselects.

## Project structure
```
src/
├── App.tsx                     app state, selection, shortcuts, fit-to-screen
├── types.ts                    UML data model (classes, members, relationships)
├── index.css                   responsive styles, light/dark theme
├── state/diagramReducer.ts     reducer with undo/redo history + autosave
├── model/
│   ├── javaGenerator.ts        UML → Java code generation
│   ├── javaUtils.ts            identifiers, params, imports, defaults
│   ├── validation.ts           diagram checks (errors / warnings)
│   ├── geometry.ts             node sizes and line endpoints
│   └── sample.ts               sample library diagram
└── components/
    ├── Toolbar.tsx             add / connect / undo / zoom / download
    ├── Canvas.tsx              scrollable, zoomable drawing area
    ├── ClassNode.tsx           draggable UML class box
    ├── RelationshipLayer.tsx   SVG relationship lines and labels
    ├── MarkerDefs.tsx          UML arrowheads and diamonds
    ├── ClassEditor.tsx         edit class, attributes, methods
    ├── RelationshipEditor.tsx  edit relationship type, direction, multiplicity
    ├── SettingsEditor.tsx      package, generation options, legend
    ├── CodePanel.tsx           code preview, copy, download, issues
    └── highlight.tsx           Java syntax highlighter
```
