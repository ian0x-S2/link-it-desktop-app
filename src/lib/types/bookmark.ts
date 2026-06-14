export type Bookmark = {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  faviconUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  tags: string[];
  isFavorite: boolean;
};
