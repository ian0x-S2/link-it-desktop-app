import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Bookmark } from '../types/bookmark';
import type { BookmarkRepository } from './bookmark.repository';

interface BookmarkRow {
  createdAt: string;
  deletedAt: string | null;
  description: string;
  faviconUrl: string;
  id: string;
  imageUrl: string;
  isFavorite: number;
  title: string;
  updatedAt: string;
  url: string;
  workspaceId: string;
}

interface TagRow {
  tag: string;
}

export class SqliteBookmarkRepository implements BookmarkRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<Bookmark[]> {
    const db = await this.getDb();
    const rows = await db.select<BookmarkRow[]>(
      `
      SELECT
        id,
        workspace_id as workspaceId,
        title,
        url,
        image_url as imageUrl,
        favicon_url as faviconUrl,
        description,
        created_at as createdAt,
        updated_at as updatedAt,
        deleted_at as deletedAt,
        is_favorite as isFavorite
      FROM bookmarks
      WHERE workspace_id = $1
      ORDER BY created_at DESC
    `,
      [workspaceId],
    );

    const bookmarks = await Promise.all(
      rows.map(async (row) => {
        const tags = await db.select<TagRow[]>(
          'SELECT tag FROM bookmark_tags WHERE bookmark_id = $1',
          [row.id],
        );

        return {
          id: row.id,
          workspaceId: row.workspaceId,
          title: row.title,
          url: row.url,
          imageUrl: row.imageUrl || '',
          faviconUrl: row.faviconUrl || '',
          description: row.description || '',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          deletedAt: row.deletedAt ?? null,
          isFavorite: row.isFavorite === 1,
          tags: tags.map((t) => t.tag),
        };
      }),
    );

    return bookmarks;
  }

  async create(data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO bookmarks
       (id, workspace_id, title, url, image_url, favicon_url, description, created_at, updated_at, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)`,
      [
        id,
        data.workspaceId,
        data.title,
        data.url,
        data.imageUrl || '',
        data.faviconUrl || '',
        data.description || '',
        now,
        data.isFavorite ? 1 : 0,
      ],
    );

    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        await db.execute('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag) VALUES ($1, $2)', [
          id,
          tag,
        ]);
      }
    }

    return {
      id,
      workspaceId: data.workspaceId,
      title: data.title,
      url: data.url,
      imageUrl: data.imageUrl || '',
      faviconUrl: data.faviconUrl || '',
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      isFavorite: data.isFavorite,
      tags: data.tags || [],
    };
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE bookmarks SET deleted_at = $1, updated_at = $1 WHERE id = $2', [
      now,
      id,
    ]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE bookmarks SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [
      now,
      id,
    ]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM bookmarks WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE bookmarks SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async update(
    id: string,
    data: Partial<Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>>,
  ): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];

    let paramIndex = 2;
    if (data.title !== undefined) {
      sets.push(`title = $${paramIndex++}`);
      params.push(data.title);
    }
    if (data.url !== undefined) {
      sets.push(`url = $${paramIndex++}`);
      params.push(data.url);
    }
    if (data.imageUrl !== undefined) {
      sets.push(`image_url = $${paramIndex++}`);
      params.push(data.imageUrl);
    }
    if (data.faviconUrl !== undefined) {
      sets.push(`favicon_url = $${paramIndex++}`);
      params.push(data.faviconUrl);
    }
    if (data.description !== undefined) {
      sets.push(`description = $${paramIndex++}`);
      params.push(data.description);
    }

    params.push(id);
    await db.execute(`UPDATE bookmarks SET ${sets.join(', ')} WHERE id = $${paramIndex}`, params);
  }

  async addTag(bookmarkId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag) VALUES ($1, $2)', [
      bookmarkId,
      tag,
    ]);
  }

  async removeTag(bookmarkId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM bookmark_tags WHERE bookmark_id = $1 AND tag = $2', [
      bookmarkId,
      tag,
    ]);
  }
}
