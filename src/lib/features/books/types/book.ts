export type Book = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  author: string;
  rating: number;
  status: string; // 'Want to Read' | 'Reading' | 'Paused' | 'Completed' | 'Abandoned'
  startedAt: string | null;
  finishedAt: string | null;
  pagesRead: number;
  pagesTotal: number;
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type CreateBookInput = {
  workspaceId: string;
  title: string;
  content?: string;
  description?: string;
  url?: string | null;
  imageUrl?: string | null;
  author?: string;
  rating?: number;
  status?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  pagesRead?: number;
  pagesTotal?: number;
  tags?: string[];
};

export type UpdateBookInput = Partial<
  Omit<Book, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;

