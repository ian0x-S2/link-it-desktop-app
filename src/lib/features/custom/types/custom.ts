export type CustomItem = {
  id: string;
  workspaceId: string;
  categoryId: string;
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

export type CreateCustomInput = {
  workspaceId: string;
  categoryId: string;
  title: string;
  content?: string;
  url?: string | null;
  imageUrl?: string | null;
  tags?: string[];
};

export type UpdateCustomInput = Partial<
  Omit<CustomItem, 'id' | 'workspaceId' | 'categoryId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
