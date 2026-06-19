import type { Page, CreatePageInput, UpdatePageInput, PageMetadata } from '../types/page';
import { SqlitePageRepository } from '../repositories/sqlite-page.repository';
import type { PageRepository } from '../repositories/page.repository';

/** Extracts a title from the first heading line of markdown content. */
function extractTitleFromContent(content: string): string {
  const firstLine = content.split('\n')[0] ?? '';
  // Strip leading #s and trim whitespace.
  const heading = firstLine.replace(/^#+\s*/, '').trim();
  return heading || 'Untitled';
}

export class PageActions {
  private readonly repository: PageRepository;

  constructor(repository: PageRepository) {
    this.repository = repository;
  }

  async getPageMetadata(workspaceId: string, categoryId: string): Promise<PageMetadata[]> {
    return await this.repository.getAllMetadata(workspaceId, categoryId);
  }

  async getPage(id: string): Promise<Page | null> {
    return await this.repository.getById(id);
  }

  async createPage(input: CreatePageInput): Promise<Page> {
    return await this.repository.create(input);
  }

  async updatePage(id: string, data: UpdatePageInput): Promise<void> {
    const update: UpdatePageInput = { ...data };
    // Auto-extract title from content if content changed but title wasn't explicitly set.
    if (data.content !== undefined && data.title === undefined) {
      update.title = extractTitleFromContent(data.content);
    }
    await this.repository.update(id, update);
  }

  async softDeletePage(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async restorePage(id: string): Promise<void> {
    await this.repository.restore(id);
  }

  async permanentlyDeletePage(id: string): Promise<void> {
    await this.repository.deletePermanently(id);
  }

  async toggleFavorite(id: string): Promise<void> {
    await this.repository.toggleFavorite(id);
  }
}

export const pageActions = new PageActions(new SqlitePageRepository());
