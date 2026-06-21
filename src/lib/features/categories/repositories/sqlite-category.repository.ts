import type Database from '@tauri-apps/plugin-sql';
import { getDatabase } from '$lib/core/database/database';
import type { Category, CreateCategoryInput } from '../types/category';
import type { CategoryRepository } from './category.repository';

interface CategoryRow {
  id: string;
  workspaceId: string;
  name: string;
  slug: string;
  type: string;
  icon: string | null;
  isDefault: number;
  isHidden: number;
  position: number;
  createdAt: string;
}

export class SqliteCategoryRepository implements CategoryRepository {
  private async getDb(): Promise<Database> {
    return await getDatabase();
  }

  async getAll(workspaceId: string): Promise<Category[]> {
    const db = await this.getDb();
    const rows = await db.select<CategoryRow[]>(
      `SELECT
         id,
         workspace_id  AS workspaceId,
         name,
         slug,
         type,
         icon,
         is_default    AS isDefault,
         is_hidden     AS isHidden,
         position,
         created_at    AS createdAt
       FROM categories
       WHERE workspace_id = $1
       ORDER BY position ASC, created_at ASC`,
      [workspaceId],
    );

    return rows.map((r) => ({
      id: r.id,
      workspaceId: r.workspaceId,
      name: r.name,
      slug: r.slug,
      type: r.type as Category['type'],
      icon: r.icon,
      isDefault: r.isDefault === 1,
      isHidden: r.isHidden === 1,
      position: r.position,
      createdAt: r.createdAt,
    }));
  }

  async create(input: CreateCategoryInput): Promise<Category> {
    const db = await this.getDb();
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Compute a slug from the name.
    const slug = input.name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Determine next position.
    const posResult = await db.select<{ maxPos: number | null }[]>(
      'SELECT MAX(position) as maxPos FROM categories WHERE workspace_id = $1',
      [input.workspaceId],
    );
    const nextPos = (posResult[0].maxPos ?? -1) + 1;

    const icon = input.icon ?? null;

    await db.execute(
      `INSERT INTO categories
         (id, workspace_id, name, slug, type, icon, is_default, is_hidden, position, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 0, 0, $7, $8)`,
      [id, input.workspaceId, input.name, slug, input.type, icon, nextPos, now],
    );

    return {
      id,
      workspaceId: input.workspaceId,
      name: input.name,
      slug,
      type: input.type,
      icon,
      isDefault: false,
      isHidden: false,
      position: nextPos,
      createdAt: now,
    };
  }

  async delete(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('DELETE FROM categories WHERE id = $1 AND is_default = 0', [id]);
  }

  async reorder(ids: string[]): Promise<void> {
    const db = await this.getDb();
    for (let i = 0; i < ids.length; i++) {
      await db.execute('UPDATE categories SET position = $1 WHERE id = $2', [i, ids[i]]);
    }
  }

  async toggleHidden(id: string): Promise<void> {
    const db = await this.getDb();
    await db.execute('UPDATE categories SET is_hidden = NOT is_hidden WHERE id = $1', [id]);
  }
}
