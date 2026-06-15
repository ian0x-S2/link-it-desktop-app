export type Workspace = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type CreateWorkspaceInput = {
  name: string;
};
