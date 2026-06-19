import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Idea, CreateIdeaInput, UpdateIdeaInput } from '../types/idea';
import type { IdeaRepository } from './idea.repository';

interface IdeaRow {
  id: string;
  workspaceId: string;
  categoryId: string;
  content: string;
  isFavorite: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export class SqliteIdeaRepository implements IdeaRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string, categoryId: string): Promise<Idea[]> {
    const db = await this.getDb();
    const rows = await db.select<IdeaRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         category_id   AS categoryId,
         content,
         is_favorite   AS isFavorite,
         deleted_at    AS deletedAt,
         created_at    AS createdAt,
         updated_at    AS updatedAt
       FROM ideas
       WHERE workspace_id = $1 AND category_id = $2
       ORDER BY created_at DESC`,
      [workspaceId, categoryId],
    );

    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      categoryId: r.categoryId,
      content: r.content,
      isFavorite: r.isFavorite === 1,
      deletedAt: r.deletedAt ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  async create(input: CreateIdeaInput): Promise<Idea> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    await db.execute(
      `INSERT INTO ideas
         (id, workspace_id, category_id, content, is_favorite, created_at, updated_at)
       VALUES ($1, $2, $3, $4, 0, $5, $5)`,
      [id, input.workspaceId, input.categoryId, input.content, now],
    );

    return {
      id,
      workspaceId: input.workspaceId,
      categoryId: input.categoryId,
      content: input.content,
      isFavorite: false,
      deletedAt: null,
      createdAt: now,
      updatedAt: now,
    };
  }

  async update(id: string, data: UpdateIdeaInput): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    const sets: string[] = ['updated_at = $1'];
    const params: unknown[] = [now];
    let i = 2;

    if (data.content !== undefined) { sets.push(`content = $${i++}`); params.push(data.content); }
    if (data.isFavorite !== undefined) { sets.push(`is_favorite = $${i++}`); params.push(data.isFavorite ? 1 : 0); }

    params.push(id);
    await db.execute(`UPDATE ideas SET ${sets.join(', ')} WHERE id = $${i}`, params);
  }

  async softDelete(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE ideas SET deleted_at = $1, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async restore(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute('UPDATE ideas SET deleted_at = NULL, updated_at = $1 WHERE id = $2', [now, id]);
  }

  async deletePermanently(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM ideas WHERE id = $1', [id]);
  }

  async toggleFavorite(id: string): Promise<void> {
    const db = await this.getDb();
    const now = new Date().toISOString();
    await db.execute(
      'UPDATE ideas SET is_favorite = NOT is_favorite, updated_at = $1 WHERE id = $2',
      [now, id],
    );
  }
}
