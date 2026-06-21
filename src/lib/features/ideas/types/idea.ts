export type Idea = {
  id: string;
  workspaceId: string;
  content: string;
  isFavorite: boolean;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateIdeaInput = {
  workspaceId: string;
  content: string;
};

export type UpdateIdeaInput = Partial<Pick<Idea, 'content' | 'isFavorite'>>;
