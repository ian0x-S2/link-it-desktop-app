# AGENTS.md

## Project Overview

link-it is a local-first desktop bookmark manager with TUI asthetics built with:

* Tauri v2
* SvelteKit 2
* Svelte 5 (Runes)
* TypeScript
* SQLite
* @tauri-apps/plugin-sql
* tailwind css 

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

Do not introduce Clean Architecture, CQRS, DDD, ORMs, or additional abstraction layers unless explicitly requested.

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

shared/
  components/
  constants/
  types/
```

New functionality should be added inside a feature folder instead of creating global folders.

---

# Layer Responsibilities

## UI Layer

Svelte components are responsible only for presentation and user interaction.

Allowed:

* Rendering
* Event handling
* Calling stores

Not allowed:

* SQL queries
* Business rules
* Data validation
* Direct database access

---

## Store Layer

Stores manage reactive application state.

Allowed:

* UI state
* Loading state
* Error state
* Optimistic updates

Not allowed:

* SQL
* Database access
* Complex business rules

Stores communicate only with Actions.

---

## Action Layer

Actions contain all business logic.

Examples:

* URL validation
* Duplicate detection
* Tag normalization
* Sorting rules
* Domain-specific behavior

Services orchestrate repositories and return application data.

All business rules belong here.

---

## Repository Layer

Repositories are responsible only for data persistence.

Allowed:

* CRUD operations
* SQL execution
* Mapping database rows

Not allowed:

* Validation
* Sorting
* Business logic
* UI concerns

Repositories should remain thin.

---

# Dependency Injection

Use simple factory-based dependency injection.

Preferred:

```ts
createBookmarkStore(action)
```

Avoid hidden dependencies.

Do not instantiate repositories directly inside stores or components.

---

# SQLite

Use raw SQL.

Do not introduce:

* Prisma
* Drizzle
* TypeORM
* Sequelize
* Any ORM

Repository implementations should use @tauri-apps/plugin-sql directly.

---

# Validation

Use Zod for all external input validation.

Examples:

* Form submissions
* Import operations
* User-provided URLs
* Future settings screens

Validation should occur before business logic execution.

---

# TypeScript Guidelines

Prefer explicit types.

Separate:

```text
Bookmark
CreateBookmarkInput
UpdateBookmarkInput
BookmarkWithTags
```

Avoid using a single type for all operations.

Avoid `any`.

---

# Components

Avoid large page components.

As features grow, split UI into focused components.

Example:

```text
components/

BookmarkForm.svelte
BookmarkList.svelte
BookmarkItem.svelte
SearchBar.svelte
TagList.svelte
```

Components should be small and composable.

---

# Error Handling

Never silently ignore errors.

Actions should throw meaningful domain errors.

Stores should convert errors into UI state.

Repositories should only surface persistence errors.

---

# Performance

Prefer simplicity over premature optimization.

Optimize only when there is measurable evidence.

Avoid:

* Complex caching layers
* Unnecessary memoization
* Over-engineering

---

# Testing Philosophy

Business logic should be testable without SQLite.

Use repository interfaces to enable:

* Memory repositories
* Mock repositories
* Future test doubles

Actions should be the primary testing target.

---

# Code Generation Rules

When generating code for this project:

1. Follow the existing layered architecture.
2. Respect feature boundaries.
3. Keep repositories focused on persistence.
4. Keep business rules inside actions.
5. Keep stores focused on state management.
6. Use TypeScript strict mode patterns.
7. Prefer composition over inheritance.
8. Use raw SQL.
9. Use Svelte 5 runes.
10. Avoid introducing new architectural patterns without justification.

When in doubt, choose the simpler solution.



# Ultracite Code Standards

This project uses **Ultracite**, a zero-config preset that enforces strict code quality standards through automated formatting and linting.

## Quick Reference

- **Format code**: `npm exec -- ultracite fix`
- **Check for issues**: `npm exec -- ultracite check`
- **Diagnose setup**: `npm exec -- ultracite doctor`

Biome (the underlying engine) provides robust linting and formatting. Most issues are automatically fixable.

---

## Core Principles

Write code that is **accessible, performant, type-safe, and maintainable**. Focus on clarity and explicit intent over brevity.

### Type Safety & Explicitness

- Use explicit types for function parameters and return values when they enhance clarity
- Prefer `unknown` over `any` when the type is genuinely unknown
- Use const assertions (`as const`) for immutable values and literal types
- Leverage TypeScript's type narrowing instead of type assertions
- Use meaningful variable names instead of magic numbers - extract constants with descriptive names

### Modern JavaScript/TypeScript

- Use arrow functions for callbacks and short functions
- Prefer `for...of` loops over `.forEach()` and indexed `for` loops
- Use optional chaining (`?.`) and nullish coalescing (`??`) for safer property access
- Prefer template literals over string concatenation
- Use destructuring for object and array assignments
- Use `const` by default, `let` only when reassignment is needed, never `var`

### Async & Promises

- Always `await` promises in async functions - don't forget to use the return value
- Use `async/await` syntax instead of promise chains for better readability
- Handle errors appropriately in async code with try-catch blocks
- Don't use async functions as Promise executors
 