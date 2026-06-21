export type Book = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  author: string;
  rating: number;
  status: string; // 'Backlog' | 'Reading' | 'Completed'
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
  url?: string | null;
  imageUrl?: string | null;
  author?: string;
  rating?: number;
  status?: string;
  tags?: string[];
};

export type UpdateBookInput = Partial<
  Omit<Book, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
