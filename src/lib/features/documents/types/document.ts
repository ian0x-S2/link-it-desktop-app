export type DocumentItem = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type CreateDocumentInput = {
  workspaceId: string;
  title: string;
  content?: string;
  url?: string | null;
  imageUrl?: string | null;
  tags?: string[];
};

export type UpdateDocumentInput = Partial<
  Omit<DocumentItem, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
