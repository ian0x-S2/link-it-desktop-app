export type Media = {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  type: string; // 'Movie' | 'Series' | 'YouTube' | 'Other'
  creator: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  rating: number;
  status: string; // 'Plan to Watch' | 'Watching' | 'Completed' | 'Paused' | 'Abandoned'
  startedAt: string | null;
  finishedAt: string | null;
  progressValue: number;
  progressTotal: number;
  progressUnit: string; // 'episodes' | 'seasons' | 'minutes' | 'percent'
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
  type?: string;
  creator?: string;
  description?: string;
  url?: string | null;
  imageUrl?: string | null;
  rating?: number;
  status?: string;
  startedAt?: string | null;
  finishedAt?: string | null;
  progressValue?: number;
  progressTotal?: number;
  progressUnit?: string;
  tags?: string[];
};

export type UpdateMediaInput = Partial<
  Omit<Media, 'id' | 'workspaceId' | 'createdAt' | 'updatedAt' | 'tags'>
>;
