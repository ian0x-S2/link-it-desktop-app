import { SqliteDocumentRepository } from '../repositories/sqlite-document.repository';
import type { DocumentItem, CreateDocumentInput, UpdateDocumentInput } from '../types/document';

class DocumentActions {
  private repo = new SqliteDocumentRepository();

  async getDocuments(workspaceId: string): Promise<DocumentItem[]> {
    if (!workspaceId) throw new Error('Workspace ID is required.');
    return await this.repo.getAll(workspaceId);
  }

  async createDocument(input: CreateDocumentInput): Promise<DocumentItem> {
    if (!input.workspaceId) throw new Error('Workspace ID is required.');

    if (!input.title || !input.title.trim()) throw new Error('Title is required.');
    return await this.repo.create(input);
  }

  async updateDocument(id: string, data: UpdateDocumentInput): Promise<void> {
    if (!id) throw new Error('Document ID is required.');
    await this.repo.update(id, data);
  }

  async softDeleteDocument(id: string): Promise<void> {
    if (!id) throw new Error('Document ID is required.');
    await this.repo.softDelete(id);
  }

  async restoreDocument(id: string): Promise<void> {
    if (!id) throw new Error('Document ID is required.');
    await this.repo.restore(id);
  }

  async permanentlyDeleteDocument(id: string): Promise<void> {
    if (!id) throw new Error('Document ID is required.');
    await this.repo.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    if (!id) throw new Error('Document ID is required.');
    await this.repo.toggleFavorite(id);
  }

  async addTag(docId: string, tag: string): Promise<void> {
    if (!docId) throw new Error('Document ID is required.');
    const cleanTag = tag.trim().toLowerCase();
    if (!cleanTag) throw new Error('Tag name cannot be empty.');
    await this.repo.addTag(docId, cleanTag);
  }

  async removeTag(docId: string, tag: string): Promise<void> {
    if (!docId) throw new Error('Document ID is required.');
    await this.repo.removeTag(docId, tag);
  }
}

export const documentActions = new DocumentActions();
