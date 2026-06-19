export type Page = {
  id: string;
  workspaceId: string;
  categoryId: string;
  title: string;
  content: string;
  bannerImage: string | null;
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePageInput = {
  workspaceId: string;
  categoryId: string;
  title?: string;
  content?: string;
  bannerImage?: string;
};

export type UpdatePageInput = Partial<Pick<Page, 'title' | 'content' | 'isFavorite' | 'bannerImage'>>;

/** Lightweight page metadata for list views (no content). */
export type PageMetadata = Omit<Page, 'content'>;
