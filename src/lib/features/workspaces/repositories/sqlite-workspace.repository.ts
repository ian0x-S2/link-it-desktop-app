import { getDatabase } from '$lib/core/database/database';
import type { CreateWorkspaceInput, Workspace, WorkspaceStats } from '../types/workspace';
import type { WorkspaceRepository } from './workspace.repository';

interface WorkspaceRow {
  createdAt: string;
  id: string;
  name: string;
  slug: string;
}

export class SqliteWorkspaceRepository implements WorkspaceRepository {
  async getAll(): Promise<Workspace[]> {
    const db = await getDatabase();
    const rows = await db.select<WorkspaceRow[]>(`
      SELECT id, name, slug, created_at as createdAt
      FROM workspaces
      ORDER BY created_at ASC
    `);
    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      createdAt: r.createdAt,
    }));
  }

  async create(input: CreateWorkspaceInput): Promise<Workspace> {
    const db = await getDatabase();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    await db.execute(
      'INSERT INTO workspaces (id, name, slug, created_at) VALUES ($1, $2, $3, $4)',
      [id, input.name.trim(), slug, now],
    );

    return { id, name: input.name.trim(), slug, createdAt: now };
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // Bookmarks in this workspace are deleted via ON DELETE CASCADE.
    await db.execute('DELETE FROM workspaces WHERE id = $1', [id]);
  }

  async rename(id: string, name: string): Promise<void> {
    const db = await getDatabase();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    await db.execute('UPDATE workspaces SET name = $1, slug = $2 WHERE id = $3', [
      name.trim(),
      slug,
      id,
    ]);
  }

  async getStats(): Promise<WorkspaceStats[]> {
    const db = await getDatabase();
    const rows = await db.select<Array<{
      id: string;
      name: string;
      slug: string;
      createdAt: string;
      activeCount: number;
      favoriteCount: number;
      trashCount: number;
    }>>(`
      SELECT 
        w.id, 
        w.name, 
        w.slug, 
        w.created_at as createdAt,
        COUNT(CASE WHEN b.deleted_at IS NULL THEN b.id END) as activeCount,
        COUNT(CASE WHEN b.is_favorite = 1 AND b.deleted_at IS NULL THEN b.id END) as favoriteCount,
        COUNT(CASE WHEN b.deleted_at IS NOT NULL THEN b.id END) as trashCount
      FROM workspaces w
      LEFT JOIN bookmarks b ON b.workspace_id = w.id
      GROUP BY w.id, w.name, w.slug, w.created_at
      ORDER BY w.created_at ASC
    `);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      createdAt: r.createdAt,
      activeCount: r.activeCount,
      favoriteCount: r.favoriteCount,
      trashCount: r.trashCount,
    }));
  }
}
