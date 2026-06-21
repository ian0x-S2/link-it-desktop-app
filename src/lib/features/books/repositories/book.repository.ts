import type { Book, CreateBookInput, UpdateBookInput } from '../types/book';

export interface BookRepository {
  getAll(workspaceId: string): Promise<Book[]>;
  getById(id: string): Promise<Book | null>;
  create(input: CreateBookInput): Promise<Book>;
  update(id: string, data: UpdateBookInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(bookId: string, tag: string): Promise<void>;
  removeTag(bookId: string, tag: string): Promise<void>;
}
