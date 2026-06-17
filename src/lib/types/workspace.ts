export type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
};

export type WorkspaceStats = Workspace & {
  activeCount: number;
  favoriteCount: number;
  trashCount: number;
};

