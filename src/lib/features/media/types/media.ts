export type Media = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  rating: number;
  status: string; // 'Plan to Watch' | 'Watching' | 'Completed'
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type CreateMediaInput = {
  workspaceId: string;
  title: string;
  content?: string;
  url?: string | null;
  imageUrl?: string | null;
  rating?: number;
  status?: string;
  tags?: string[];
};

export type UpdateMediaInput = Partial<
  Omit<Media, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
