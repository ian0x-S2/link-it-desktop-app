import type { DocumentItem, CreateDocumentInput, UpdateDocumentInput } from '../types/document';

export interface DocumentRepository {
  getAll(workspaceId: string): Promise<DocumentItem[]>;
  getById(id: string): Promise<DocumentItem | null>;
  create(input: CreateDocumentInput): Promise<DocumentItem>;
  update(id: string, data: UpdateDocumentInput): Promise<void>;
  softDelete(id: string): Promise<void>;
  restore(id: string): Promise<void>;
  deletePermanently(id: string): Promise<void>;
  toggleFavorite(id: string): Promise<void>;
  addTag(docId: string, tag: string): Promise<void>;
  removeTag(docId: string, tag: string): Promise<void>;
}
