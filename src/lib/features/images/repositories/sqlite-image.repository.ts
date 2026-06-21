import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { ImageItem, CreateImageInput, UpdateImageInput } from '../types/image';
import type { ImageRepository } from './image.repository';

interface ImageRow {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqliteImageRepository implements ImageRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<ImageItem[]> {
    const db = await this.getDb();
    const rows = await db.select<ImageRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         url,
         image_url     AS imageUrl,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM images
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    const imageList = await Promise.all(
      rows.map(async (r) => {
        const tagsRows = await db.select<{ tag: string }[]>(
          'SELECT tag FROM image_tags WHERE image_id = $1',
          [r.id],
        );
        return {
          id: r.id,
          workspaceId: r.workspaceId,
          title: r.title,
          content: r.content,
          url: r.url,
          imageUrl: r.imageUrl,
          isFavorite: r.isFavorite === 1,
          deletedAt: r.deletedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: tagsRows.map((t) => t.tag),
        };
      })
    );

    return imageList;
  }

  async getById(id: string): Promise<ImageItem | null> {
    const db = await this.getDb();
    const rows = await db.select<ImageRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         url,
         image_url     AS imageUrl,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM images
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    const tagsRows = await db.select<{ tag: string }[]>(
      'SELECT tag FROM image_tags WHERE image_id = $1',
      [id],
    );

    return {
      id: r.id,
      workspaceId: r.workspaceId,
      title: r.title,
      content: r.content,
      url: r.url,
      imageUrl: r.imageUrl,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsRows.map((t) => t.tag),
    };
  }

  async create(input: CreateImageInput): Promise<ImageItem> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const title = input.title;
    const content = input.content ?? '';
    const url = input.url ?? null;
    const imageUrl = input.imageUrl ?? null;

    await db.execute(
      `INSERT INTO images
         (id, workspace_id, title, content, url, image_url, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, $7, $7)`,
      [id, input.workspaceId, title, content, url, imageUrl, now],
    );

    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await db.execute('INSERT OR IGNORE INTO image_tags (image_id, tag) VALUES ($1, $2)', [
          id,
          tag,
        ]);
      }
    }

    return {
      id,
      workspaceId: input.workspaceId,
      title,
      content,
      url,
      imageUrl,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };
  }

  async update(id: string, data: UpdateImageInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) { sets.push(`title = $${i++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.url !== undefined) { sets.push(`url = $${i++}`); params.push(data.url); }
    if (data.imageUrl !== undefined) { sets.push(`image_url = $${i++}`); params.push(data.imageUrl); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }

    params.push(id);
    await db.execute(`UPDATE images SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE images SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE images SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM images WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE images SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async addTag(imageId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO image_tags (image_id, tag) VALUES ($1, $2)', [
      imageId,
      tag,
    ]);
  }

  async removeTag(imageId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM image_tags WHERE image_id = $1 AND tag = $2', [
      imageId,
      tag,
    ]);
  }
}
