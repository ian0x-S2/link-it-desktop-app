import { SqliteBookRepository } from '../repositories/sqlite-book.repository';
import type { Book, CreateBookInput, UpdateBookInput } from '../types/book';

class BookActions {
  private repo = new SqliteBookRepository();

  async getBooks(workspaceId: string): Promise<Book[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createBook(input: CreateBookInput): Promise<Book> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');

    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateBook(id: string, data: UpdateBookInput): Promise<void> {
    if (!id) throw new Error('Book ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteBook(id: string): Promise<void> {
    if (!id) throw new Error('Book ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreBook(id: string): Promise<void> {
    if (!id) throw new Error('Book ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteBook(id: string): Promise<void> {
    if (!id) throw new Error('Book ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('Book ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(bookId: string, tag: string): Promise<void> {
    if (!bookId) throw new Error('Book ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(bookId, cleanTag);
  }

  async removeTag(bookId: string, tag: string): Promise<void> {
    if (!bookId) throw new Error('Book ID is required.');
    await this.repo.removeTag(bookId, tag);
  }
}

export const bookActions = new BookActions();
