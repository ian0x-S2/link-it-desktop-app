import { getDatabase } from "../../db/database";
import type { CreateWorkspaceInput, Workspace } from "../../types/workspace";
import type { WorkspaceRepository } from "../workspace.repository";

interface WorkspaceRow {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
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
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");

    await db.execute(
      "INSERT INTO workspaces (id, name, slug, created_at) VALUES ($1, $2, $3, $4)",
      [id, input.name.trim(), slug, now]
    );

    return { id, name: input.name.trim(), slug, createdAt: now };
  }

  async delete(id: string): Promise<void> {
    const db = await getDatabase();
    // Bookmarks in this workspace are deleted via ON DELETE CASCADE.
    await db.execute("DELETE FROM workspaces WHERE id = $1", [id]);
  }

  async rename(id: string, name: string): Promise<void> {
    const db = await getDatabase();
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "");
    await db.execute(
      "UPDATE workspaces SET name = $1, slug = $2 WHERE id = $3",
      [name.trim(), slug, id]
    );
  }
}
