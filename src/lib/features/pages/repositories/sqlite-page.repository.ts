import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Page, CreatePageInput, UpdatePageInput, PageMetadata } from '../types/page';
import type { PageRepository } from './page.repository';

interface PageRow {
  id: string;
  workspaceId: string;
  categoryId: string;
  title: string;
  content?: string;
  bannerImage?: string | null;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqlitePageRepository implements PageRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAllMetadata(workspaceId: string, categoryId: string): Promise<PageMetadata[]> {
    const db = await this.getDb();
    const rows = await db.select<PageRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         category_id   AS categoryId,
         title,
         banner_image  AS bannerImage,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM pages
       WHERE workspace_id = $1 AND category_id = $2
       ORDER BY updated_at DESC`,
      [workspaceId, categoryId],
    );

    const pages = await Promise.all(
      rows.map(async (r) => {
        const tagsRows = await db.select<{ tag: string }[]>(
          'SELECT tag FROM page_tags WHERE page_id = $1',
          [r.id],
        );
        return {
          id: r.id,
          workspaceId: r.workspaceId,
          categoryId: r.categoryId,
          title: r.title,
          bannerImage: r.bannerImage ?? null,
          isFavorite: r.isFavorite === 1,
          deletedAt: r.deletedAt ?? null,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: tagsRows.map((t) => t.tag),
        };
      })
    );

    return pages;
  }

  async getById(id: string): Promise<Page | null> {
    const db = await this.getDb();
    const rows = await db.select<PageRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         category_id   AS categoryId,
         title,
         content,
         banner_image  AS bannerImage,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM pages
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    const tagsRows = await db.select<{ tag: string }[]>(
      'SELECT tag FROM page_tags WHERE page_id = $1',
      [id],
    );

    return {
      id: r.id,
      workspaceId: r.workspaceId,
      categoryId: r.categoryId,
      title: r.title,
      content: r.content ?? '',
      bannerImage: r.bannerImage ?? null,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsRows.map((t) => t.tag),
    };
  }

  async create(input: CreatePageInput): Promise<Page> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const title = input.title ?? 'Untitled';
    const content = input.content ?? '';
    const bannerImage = input.bannerImage ?? null;

    await db.execute(
      `INSERT INTO pages
         (id, workspace_id, category_id, title, content, banner_image, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $7)`,
      [id, input.workspaceId, input.categoryId, title, content, bannerImage, now],
    );

    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await db.execute('INSERT OR IGNORE INTO page_tags (page_id, tag) VALUES ($1, $2)', [
          id,
          tag,
        ]);
      }
    }

    return {
      id,
      workspaceId: input.workspaceId,
      categoryId: input.categoryId,
      title,
      content,
      bannerImage,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };
  }

  async update(id: string, data: UpdatePageInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) { sets.push(`title = $${i++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }
    if (data.bannerImage !== undefined) { sets.push(`banner_image = $${i++}`); params.push(data.bannerImage); }

    params.push(id);
    await db.execute(`UPDATE pages SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE pages SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE pages SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM pages WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE pages SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async addTag(pageId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO page_tags (page_id, tag) VALUES ($1, $2)', [
      pageId,
      tag,
    ]);
  }

  async removeTag(pageId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM page_tags WHERE page_id = $1 AND tag = $2', [
      pageId,
      tag,
    ]);
  }
}
