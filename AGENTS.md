# AGENTS.md

## Project Overview

link-it is a local-first desktop personal knowledge manager with TUI aesthetics built with:

- Tauri v2
- SvelteKit 2
- Svelte 5 (Runes)
- TypeScript
- SQLite
- @tauri-apps/plugin-sql
- Tailwind CSS
- CodeMirror 6 (editor de notas markdown)
- Shadcn-svelte

The application runs entirely on the client machine and does not use an HTTP backend.

---

# Architecture Principles

The project follows a lightweight layered architecture:

```text
UI
 ↓
Store
 ↓
Actions
 ↓
Repository
 ↓
SQLite
```

The goal is to keep responsibilities isolated while avoiding unnecessary complexity.

Do not introduce Clean Architecture, CQRS, DDD, ORMs, or additional abstraction layers
unless explicitly requested.

---

# Feature-Based Organization

All business functionality must be organized by feature.

Preferred structure:

```text
src/lib/

core/
  database/
  errors/
  utils/

features/
  bookmarks/
    types/
    repositories/
    actions/
    stores/
    validators/

  notes/
    types/
    repositories/
    actions/
    stores/
    validators/
    editor/          ← extensões e widgets do CodeMirror

shared/
  components/
  constants/
  types/
```

Bookmarks and Notes are independent features. Do not couple them unless explicitly requested.
New functionality should be added inside a feature folder instead of creating global folders.

---

# Editor Architecture (Notes)

Notes use CodeMirror 6 as the editor engine.

## Core Principles

- CodeMirror manages its own DOM. Mount it via Svelte `use:action`, never inside reactive blocks.
- Editor state is CodeMirror's responsibility. Do not mirror it in Svelte `$state` unnecessarily.
- Persist only on explicit save or debounced autosave — never on every keystroke.

## Svelte Integration

```ts
function editor(node: HTMLElement, content: string) {
  const view = new EditorView({
    extensions: [basicSetup, markdown()],
    parent: node,
  });
  return {
    destroy: () => view.destroy(),
  };
}
```

## Svelte Components inside the Editor

Use CodeMirror `WidgetDecoration` to mount Svelte components inside the editor.
Use `mount` and `unmount` from Svelte 5 for lifecycle management.

```ts
import { mount, unmount } from 'svelte'

class MyWidget extends WidgetType {
  toDOM() {
    const el = document.createElement('span')
    mount(MyComponent, { target: el, props: { ... } })
    return el
  }
  destroy(el: HTMLElement) {
    unmount(el)
  }
}
```

Widgets are read-only from the editor's perspective.
Do not use widgets for content the user needs to edit as text.

## Extensions Organization

Place CodeMirror extensions inside `features/notes/editor/`:

```text
editor/
  index.ts          ← composição final das extensões
  markdown.ts       ← lang-markdown + highlight
  decorations.ts    ← widgets e decorações inline
  theme.ts          ← tema TUI
  keymaps.ts        ← atalhos customizados
```

---

# Layer Responsibilities

## UI Layer

Svelte components are responsible only for presentation and user interaction.

Allowed:

- Rendering
- Event handling
- Calling stores
- Mounting CodeMirror via `use:action`

Not allowed:

- SQL queries
- Business rules
- Data validation
- Direct database access
- CodeMirror extension logic (belongs in `editor/`)

---

## Store Layer

Stores manage reactive application state.

Allowed:

- UI state
- Loading state
- Error state
- Optimistic updates
- Note metadata (title, updatedAt) — not the editor content itself

Not allowed:

- SQL
- Database access
- Complex business rules
- Mirroring CodeMirror internal state

Stores communicate only with Actions.

---

## Action Layer

Actions contain all business logic.

Bookmark examples:

- URL validation
- Duplicate detection
- Tag normalization

Note examples:

- Title extraction from first heading
- Word count
- Autosave debounce logic
- Markdown sanitization on import/export

All business rules belong here.

---

## Repository Layer

Repositories are responsible only for data persistence.

Allowed:

- CRUD operations
- SQL execution
- Mapping database rows

Not allowed:

- Validation
- Sorting
- Business logic
- UI concerns

Repositories should remain thin.

---

# SQLite

Use raw SQL.

Do not introduce any ORM.

Notes schema should separate metadata from content:

```sql
CREATE TABLE notes (
  id        TEXT PRIMARY KEY,
  title     TEXT NOT NULL DEFAULT '',
  content   TEXT NOT NULL DEFAULT '',
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

Avoid storing derived data (word count, headings) in the database.
Compute them in actions when needed.

---

# Validation

Use Zod for all external input validation.

Note-specific examples:

- Import from `.md` files
- Title length limits
- Content size limits

Validation should occur before business logic execution.

---

# TypeScript Guidelines

Prefer explicit types. Separate input/output types per feature.

Notes example:

```text
Note
CreateNoteInput
UpdateNoteInput
NoteMetadata       ← id, title, updatedAt (sem content, para listagens)
```

Avoid `any`. Prefer `unknown` with narrowing.

---

# Components

Avoid large page components. Split UI into focused components.

Notes example:

```text
NoteList.svelte
NoteItem.svelte
NoteEditor.svelte    ← só monta o CodeMirror via use:action
NoteToolbar.svelte
```

`NoteEditor.svelte` should only be responsible for mounting and destroying the editor.
Extension logic lives in `features/notes/editor/`, not in the component.

---

# Error Handling

Never silently ignore errors.

Actions should throw meaningful domain errors.
Stores should convert errors into UI state.
Repositories should only surface persistence errors.

Editor errors (e.g. failed to load content) should be caught at the store level
and surfaced as UI state, never swallowed silently.

---

# Performance

Prefer simplicity over premature optimization.

Editor-specific rules:

- Debounce autosave (suggested: 1000ms)
- Do not read `view.state.doc.toString()` on every keystroke
- For large documents, prefer line-based operations over full document reads

---

# Testing Philosophy

Business logic should be testable without SQLite.

Use repository interfaces to enable mock repositories.
Actions should be the primary testing target.

Editor extensions can be tested with CodeMirror's own test utilities
(`@codemirror/state` allows creating headless editor states).

---

# Code Generation Rules

When generating code for this project:

1. Follow the existing layered architecture.
2. Respect feature boundaries — bookmarks and notes are independent.
3. Keep repositories focused on persistence.
4. Keep business rules inside actions.
5. Keep stores focused on state management.
6. Use TypeScript strict mode patterns.
7. Prefer composition over inheritance.
8. Use raw SQL.
9. Use Svelte 5 runes.
10. Use `mount`/`unmount` from Svelte 5 for widgets inside the editor.
    11s. Avoid introducing new architectural patterns without justification.

When in doubt, choose the simpler solution.
