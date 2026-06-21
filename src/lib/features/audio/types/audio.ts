export type Audio = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  artist: string;
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: string[];
};

export type CreateAudioInput = {
  workspaceId: string;
  title: string;
  content?: string;
  url?: string | null;
  imageUrl?: string | null;
  artist?: string;
  tags?: string[];
};

export type UpdateAudioInput = Partial<
  Omit<Audio, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
