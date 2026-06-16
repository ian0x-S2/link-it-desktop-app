import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    const connection = await Database.load('sqlite:link-it.db');

    await initDatabase(connection);

    db = connection;
  }
  return db;
}

async function initDatabase(database: Database): Promise<void> {
  await database.execute('PRAGMA foreign_keys = ON');

  await database.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      image_url TEXT,
      favicon_url TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0,
      deleted_at TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL,
      tag TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, tag),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    )
  `);

  // Safe migrations for existing databases.
  try {
    await database.execute('ALTER TABLE bookmarks ADD COLUMN deleted_at TEXT');
  } catch {
    // Column already exists — safe to ignore.
  }

  try {
    await database.execute('ALTER TABLE bookmarks ADD COLUMN workspace_id TEXT');
  } catch {
    // Column already exists — safe to ignore.
  }

  // Ensure there is always at least one workspace (the default).
  const existingWorkspaces = await database.select<{ count: number }[]>(
    'SELECT COUNT(*) as count FROM workspaces',
  );

  if (existingWorkspaces[0].count === 0) {
    const defaultId = crypto.randomUUID();
    const now = new Date().toISOString();
    await database.execute(
      'INSERT INTO workspaces (id, name, slug, created_at) VALUES ($1, $2, $3, $4)',
      [defaultId, 'My Workspace', 'my-workspace', now],
    );

    // Associate any orphan bookmarks (without workspace_id) to the default workspace.
    await database.execute('UPDATE bookmarks SET workspace_id = $1 WHERE workspace_id IS NULL', [
      defaultId,
    ]);
  } else {
    // Even if workspaces exist, migrate any remaining orphan bookmarks.
    const firstWorkspace = await database.select<{ id: string }[]>(
      'SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1',
    );
    if (firstWorkspace.length > 0) {
      await database.execute('UPDATE bookmarks SET workspace_id = $1 WHERE workspace_id IS NULL', [
        firstWorkspace[0].id,
      ]);
    }
  }
}
