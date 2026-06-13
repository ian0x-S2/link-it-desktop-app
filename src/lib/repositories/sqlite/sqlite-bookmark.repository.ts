import type { BookmarkRepository } from '../bookmark.repository';
import type { Bookmark } from '../../types/bookmark';
import { getDatabase } from '../../db/database';
import type Database from '@tauri-apps/plugin-sql';

interface BookmarkRow {
  id: string;
  title: string;
  url: string;
  imageUrl: string;
  faviconUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  isFavorite: number;
}

interface TagRow {
  tag: string;
}

export class SqliteBookmarkRepository implements BookmarkRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(): Promise<Bookmark[]> {
    const db = await this.getDb();
    const rows = await db.select<BookmarkRow[]>(`
      SELECT 
        id, 
        title, 
        url, 
        image_url as imageUrl, 
        favicon_url as faviconUrl, 
        description, 
        created_at as createdAt, 
        updated_at as updatedAt, 
        is_favorite as isFavorite 
      FROM bookmarks 
      ORDER BY created_at DESC
    `);

    const bookmarks = await Promise.all(
      rows.map(async (row) => {
        const tags = await db.select<TagRow[]>(
          'SELECT tag FROM bookmark_tags WHERE bookmark_id = $1',
          [row.id]
        );

        return {
          id: row.id,
          title: row.title,
          url: row.url,
          imageUrl: row.imageUrl || '',
          faviconUrl: row.faviconUrl || '',
          description: row.description || '',
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          isFavorite: row.isFavorite === 1,
          tags: tags.map((t) => t.tag),
        };
      })
    );

    return bookmarks;
  }

  async create(data: Omit<Bookmark, 'id' | 'createdAt' | 'updatedAt'>): Promise<Bookmark> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO bookmarks 
       (id, title, url, image_url, favicon_url, description, created_at, updated_at, is_favorite)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        id,
        data.title,
        data.url,
        data.imageUrl || '',
        data.faviconUrl || '',
        data.description || '',
        now,
        now,
        data.isFavorite ? 1 : 0,
      ]
    );

    if (data.tags && data.tags.length > 0) {
      for (const tag of data.tags) {
        await db.execute(
          'INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag) VALUES ($1, $2)',
          [id, tag]
        );
      }
    }

    return {
      id,
      title: data.title,
      url: data.url,
      imageUrl: data.imageUrl || '',
      faviconUrl: data.faviconUrl || '',
      description: data.description || '',
      createdAt: now,
      updatedAt: now,
      isFavorite: data.isFavorite,
      tags: data.tags || [],
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM bookmarks WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE bookmarks SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id]
    );
  }
}