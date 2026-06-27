import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Media, CreateMediaInput, UpdateMediaInput } from '../types/media';
import type { MediaRepository } from './media.repository';

interface MediaRow {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  type: string;
  creator: string;
  description: string;
  url: string | null;
  imageUrl: string | null;
  rating: number;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  progressValue: number;
  progressTotal: number;
  progressUnit: string;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqliteMediaRepository implements MediaRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<Media[]> {
    const db = await this.getDb();
    const rows = await db.select<MediaRow[]>(
      `SELECT
         id,
         workspace_id   AS workspaceId,
         title,
         content,
         type,
         creator,
         description,
         url,
         image_url      AS imageUrl,
         rating,
         status,
         started_at     AS startedAt,
         finished_at    AS finishedAt,
         progress_value AS progressValue,
         progress_total AS progressTotal,
         progress_unit  AS progressUnit,
         is_favorite    AS isFavorite,
         deleted_at     AS deletedAt,
         created_at     AS createdAt,
         updated_at     AS updatedAt
       FROM media
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    const tagsRows = await db.select<{ mediaId: string; tag: string }[]>(
      `SELECT mt.media_id AS mediaId, mt.tag 
       FROM media_tags mt
       INNER JOIN media m ON mt.media_id = m.id
       WHERE m.workspace_id = $1`,
      [workspaceId],
    );

    const tagsMap = new Map<string, string[]>();
    for (const tagRow of tagsRows) {
      const list = tagsMap.get(tagRow.mediaId) ?? [];
      list.push(tagRow.tag);
      tagsMap.set(tagRow.mediaId, list);
    }

    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      title: r.title,
      content: r.content,
      type: r.type,
      creator: r.creator,
      description: r.description,
      url: r.url,
      imageUrl: r.imageUrl,
      rating: r.rating,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      progressValue: r.progressValue,
      progressTotal: r.progressTotal,
      progressUnit: r.progressUnit,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsMap.get(r.id) ?? [],
    }));
  }

  async getById(id: string): Promise<Media | null> {
    const db = await this.getDb();
    const rows = await db.select<MediaRow[]>(
      `SELECT
         id,
         workspace_id   AS workspaceId,
         title,
         content,
         type,
         creator,
         description,
         url,
         image_url      AS imageUrl,
         rating,
         status,
         started_at     AS startedAt,
         finished_at    AS finishedAt,
         progress_value AS progressValue,
         progress_total AS progressTotal,
         progress_unit  AS progressUnit,
         is_favorite    AS isFavorite,
         deleted_at     AS deletedAt,
         created_at     AS createdAt,
         updated_at     AS updatedAt
       FROM media
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    const tagsRows = await db.select<{ tag: string }[]>(
      'SELECT tag FROM media_tags WHERE media_id = $1',
      [id],
    );

    return {
      id: r.id,
      workspaceId: r.workspaceId,
      title: r.title,
      content: r.content,
      type: r.type,
      creator: r.creator,
      description: r.description,
      url: r.url,
      imageUrl: r.imageUrl,
      rating: r.rating,
      status: r.status,
      startedAt: r.startedAt,
      finishedAt: r.finishedAt,
      progressValue: r.progressValue,
      progressTotal: r.progressTotal,
      progressUnit: r.progressUnit,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsRows.map((t) => t.tag),
    };
  }

  async create(input: CreateMediaInput): Promise<Media> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const title = input.title;
    const content = input.content ?? '';
    const type = input.type ?? 'Movie';
    const creator = input.creator ?? '';
    const description = input.description ?? '';
    const url = input.url ?? null;
    const imageUrl = input.imageUrl ?? null;
    const rating = input.rating ?? 0;
    const status = input.status ?? 'Plan to Watch';
    const startedAt = input.startedAt ?? null;
    const finishedAt = input.finishedAt ?? null;
    const progressValue = input.progressValue ?? 0;
    const progressTotal = input.progressTotal ?? 0;
    const progressUnit = input.progressUnit ?? 'episodes';

    await db.execute(
      `INSERT INTO media
         (id, workspace_id, title, content, type, creator, description, url, image_url, rating, status, started_at, finished_at, progress_value, progress_total, progress_unit, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, 0, $17, $17)`,
      [id, input.workspaceId, title, content, type, creator, description, url, imageUrl, rating, status, startedAt, finishedAt, progressValue, progressTotal, progressUnit, now],
    );

    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await db.execute('INSERT OR IGNORE INTO media_tags (media_id, tag) VALUES ($1, $2)', [
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
      type,
      creator,
      description,
      url,
      imageUrl,
      rating,
      status,
      startedAt,
      finishedAt,
      progressValue,
      progressTotal,
      progressUnit,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };
  }

  async update(id: string, data: UpdateMediaInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) { sets.push(`title = $${i++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.type !== undefined) { sets.push(`type = $${i++}`); params.push(data.type); }
    if (data.creator !== undefined) { sets.push(`creator = $${i++}`); params.push(data.creator); }
    if (data.description !== undefined) { sets.push(`description = $${i++}`); params.push(data.description); }
    if (data.url !== undefined) { sets.push(`url = $${i++}`); params.push(data.url); }
    if (data.imageUrl !== undefined) { sets.push(`image_url = $${i++}`); params.push(data.imageUrl); }
    if (data.rating !== undefined) { sets.push(`rating = $${i++}`); params.push(data.rating); }
    if (data.status !== undefined) { sets.push(`status = $${i++}`); params.push(data.status); }
    if (data.startedAt !== undefined) { sets.push(`started_at = $${i++}`); params.push(data.startedAt); }
    if (data.finishedAt !== undefined) { sets.push(`finished_at = $${i++}`); params.push(data.finishedAt); }
    if (data.progressValue !== undefined) { sets.push(`progress_value = $${i++}`); params.push(data.progressValue); }
    if (data.progressTotal !== undefined) { sets.push(`progress_total = $${i++}`); params.push(data.progressTotal); }
    if (data.progressUnit !== undefined) { sets.push(`progress_unit = $${i++}`); params.push(data.progressUnit); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }

    params.push(id);
    await db.execute(`UPDATE media SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE media SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE media SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM media WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE media SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async addTag(mediaId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO media_tags (media_id, tag) VALUES ($1, $2)', [
      mediaId,
      tag,
    ]);
  }

  async removeTag(mediaId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM media_tags WHERE media_id = $1 AND tag = $2', [
      mediaId,
      tag,
    ]);
  }
}
