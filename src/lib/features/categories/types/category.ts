export type CategoryType =
  | 'links'
  | 'pages'
  | 'ideas'
  | 'books'
  | 'media'
  | 'audio'
  | 'documents'
  | 'images'
  | 'custom';

export type Category = {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: CategoryType;
  /** Single-char TUI icon: L, P, *, B, M, A, D, I, or user-defined */
  icon: string | null;
  isDefault: boolean;
  /** When true the category is hidden from the sidebar but still exists. */
  isHidden: boolean;
  position: number;
  createdAt: string;
};

export type CreateCategoryInput = {
  workspaceId: string;
  name: string;
  type: CategoryType;
  icon?: string;
};

/** Map from CategoryType to its canonical TUI icon (no conflicts). */
export const CATEGORY_TYPE_ICONS: Record<CategoryType, string> = {
  links: 'L',
  pages: 'P',
  ideas: '*',
  books: 'B',
  media: 'M',
  audio: 'A',
  documents: 'D',
  images: 'I',
  custom: '?',
};
