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

  // ── Core tables ──────────────────────────────────────────────────────────────

  await database.execute(`
    CREATE TABLE IF NOT EXISTS workspaces (
      id         TEXT PRIMARY KEY,
      name       TEXT NOT NULL,
      slug       TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS categories (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      name         TEXT NOT NULL,
      slug         TEXT NOT NULL,
      type         TEXT NOT NULL CHECK(type IN (
                     'links','pages','ideas','books',
                     'media','audio','documents','images','custom'
                   )),
      icon         TEXT,
      is_default   INTEGER NOT NULL DEFAULT 0,
      position     INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL,
      UNIQUE(workspace_id, slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category_id  TEXT,
      title        TEXT NOT NULL,
      url          TEXT NOT NULL,
      image_url    TEXT,
      favicon_url  TEXT,
      description  TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE SET NULL
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL,
      tag         TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, tag),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS pages (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category_id  TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      banner_image TEXT,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS ideas (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category_id  TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '',
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  // ── Safe migrations for existing databases ────────────────────────────────────

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

  try {
    await database.execute(
      'ALTER TABLE bookmarks ADD COLUMN category_id TEXT REFERENCES categories(id) ON DELETE SET NULL',
    );
  } catch {
    // Column already exists — safe to ignore.
  }

  try {
    await database.execute('ALTER TABLE pages ADD COLUMN banner_image TEXT');
  } catch {
    // Column already exists — safe to ignore.
  }

  // ── Ensure at least one workspace exists ──────────────────────────────────────

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

    await database.execute('UPDATE bookmarks SET workspace_id = $1 WHERE workspace_id IS NULL', [
      defaultId,
    ]);

    await seedDefaultCategories(database, defaultId);
  } else {
    // Migrate orphan bookmarks to the first workspace.
    const firstWorkspace = await database.select<{ id: string }[]>(
      'SELECT id FROM workspaces ORDER BY created_at ASC LIMIT 1',
    );
    if (firstWorkspace.length > 0) {
      await database.execute('UPDATE bookmarks SET workspace_id = $1 WHERE workspace_id IS NULL', [
        firstWorkspace[0].id,
      ]);

      // Seed categories for any workspace that still has none.
      const allWorkspaces = await database.select<{ id: string }[]>(
        'SELECT id FROM workspaces ORDER BY created_at ASC',
      );
      for (const ws of allWorkspaces) {
        const catCount = await database.select<{ count: number }[]>(
          'SELECT COUNT(*) as count FROM categories WHERE workspace_id = $1',
          [ws.id],
        );
        if (catCount[0].count === 0) {
          await seedDefaultCategories(database, ws.id);
        }
      }

      // Associate orphan bookmarks (no category_id) with the "links" default category.
      const firstWsId = firstWorkspace[0].id;
      const linksCat = await database.select<{ id: string }[]>(
        "SELECT id FROM categories WHERE workspace_id = $1 AND type = 'links' LIMIT 1",
        [firstWsId],
      );
      if (linksCat.length > 0) {
        await database.execute(
          'UPDATE bookmarks SET category_id = $1 WHERE workspace_id = $2 AND category_id IS NULL',
          [linksCat[0].id, firstWsId],
        );
      }
    }
  }
}

/**
 * Creates the 8 default categories for a given workspace.
 * Called once per new workspace (including the initial default workspace).
 */
export async function seedDefaultCategories(
  database: Database,
  workspaceId: string,
): Promise<void> {
  const now = new Date().toISOString();

  const defaults: Array<{
    slug: string;
    name: string;
    type: string;
    icon: string;
    position: number;
  }> = [
    { slug: 'links', name: 'Links', type: 'links', icon: 'L', position: 0 },
    { slug: 'pages', name: 'Pages', type: 'pages', icon: 'P', position: 1 },
    { slug: 'ideas', name: 'Ideas', type: 'ideas', icon: '*', position: 2 },
    { slug: 'books', name: 'Books', type: 'books', icon: 'B', position: 3 },
    { slug: 'media', name: 'Media', type: 'media', icon: 'M', position: 4 },
    { slug: 'audio', name: 'Audio', type: 'audio', icon: 'A', position: 5 },
    { slug: 'documents', name: 'Documents', type: 'documents', icon: 'D', position: 6 },
    { slug: 'images', name: 'Images', type: 'images', icon: 'I', position: 7 },
  ];

  for (const cat of defaults) {
    const id = crypto.randomUUID();
    await database.execute(
      `INSERT OR IGNORE INTO categories
         (id, workspace_id, name, slug, type, icon, is_default, position, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, $7, $8)`,
      [id, workspaceId, cat.name, cat.slug, cat.type, cat.icon, cat.position, now],
    );
  }
}
