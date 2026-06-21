import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Audio, CreateAudioInput, UpdateAudioInput } from '../types/audio';
import type { AudioRepository } from './audio.repository';

interface AudioRow {
  id: string;
  workspaceId: string;
  title: string;
  content: string;
  url: string | null;
  imageUrl: string | null;
  artist: string;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqliteAudioRepository implements AudioRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<Audio[]> {
    const db = await this.getDb();
    const rows = await db.select<AudioRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         url,
         image_url     AS imageUrl,
         artist,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM audio
       WHERE workspace_id = $1
       ORDER BY created_at DESC`,
      [workspaceId],
    );

    const audioList = await Promise.all(
      rows.map(async (r) => {
        const tagsRows = await db.select<{ tag: string }[]>(
          'SELECT tag FROM audio_tags WHERE audio_id = $1',
          [r.id],
        );
        return {
          id: r.id,
          workspaceId: r.workspaceId,
          title: r.title,
          content: r.content,
          url: r.url,
          imageUrl: r.imageUrl,
          artist: r.artist,
          isFavorite: r.isFavorite === 1,
          deletedAt: r.deletedAt,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          tags: tagsRows.map((t) => t.tag),
        };
      })
    );

    return audioList;
  }

  async getById(id: string): Promise<Audio | null> {
    const db = await this.getDb();
    const rows = await db.select<AudioRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         title,
         content,
         url,
         image_url     AS imageUrl,
         artist,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM audio
       WHERE id = $1`,
      [id],
    );

    if (rows.length === 0) return null;
    const r = rows[0];

    const tagsRows = await db.select<{ tag: string }[]>(
      'SELECT tag FROM audio_tags WHERE audio_id = $1',
      [id],
    );

    return {
      id: r.id,
      workspaceId: r.workspaceId,
      title: r.title,
      content: r.content,
      url: r.url,
      imageUrl: r.imageUrl,
      artist: r.artist,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      tags: tagsRows.map((t) => t.tag),
    };
  }

  async create(input: CreateAudioInput): Promise<Audio> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const title = input.title;
    const content = input.content ?? '';
    const url = input.url ?? null;
    const imageUrl = input.imageUrl ?? null;
    const artist = input.artist ?? '';

    await db.execute(
      `INSERT INTO audio
         (id, workspace_id, title, content, url, image_url, artist, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 0, $8, $8)`,
      [id, input.workspaceId, title, content, url, imageUrl, artist, now],
    );

    if (input.tags && input.tags.length > 0) {
      for (const tag of input.tags) {
        await db.execute('INSERT OR IGNORE INTO audio_tags (audio_id, tag) VALUES ($1, $2)', [
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
      artist,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
      tags: input.tags ?? [],
    };
  }

  async update(id: string, data: UpdateAudioInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.title !== undefined) { sets.push(`title = $${i++}`); params.push(data.title); }
    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.url !== undefined) { sets.push(`url = $${i++}`); params.push(data.url); }
    if (data.imageUrl !== undefined) { sets.push(`image_url = $${i++}`); params.push(data.imageUrl); }
    if (data.artist !== undefined) { sets.push(`artist = $${i++}`); params.push(data.artist); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }

    params.push(id);
    await db.execute(`UPDATE audio SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE audio SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE audio SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM audio WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE audio SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }

  async addTag(audioId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('INSERT OR IGNORE INTO audio_tags (audio_id, tag) VALUES ($1, $2)', [
      audioId,
      tag,
    ]);
  }

  async removeTag(audioId: string, tag: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM audio_tags WHERE audio_id = $1 AND tag = $2', [
      audioId,
      tag,
    ]);
  }
}
