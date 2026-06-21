export type ImageItem = {
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

export type CreateImageInput = {
  workspaceId: string;
  title: string;
  content?: string;
  url?: string | null;
  imageUrl?: string | null;
  tags?: string[];
};

export type UpdateImageInput = Partial<
  Omit<ImageItem, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
