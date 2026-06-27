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

  // Categories are sidebar config only.
  // Built-in types (links, pages, ideas, books, media, audio, documents, images)
  // map 1:1 to their own tables. Only 'custom' items use category_id as a grouper.
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
      is_hidden    INTEGER NOT NULL DEFAULT 0,
      position     INTEGER NOT NULL DEFAULT 0,
      created_at   TEXT NOT NULL,
      UNIQUE(workspace_id, slug),
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  // ── Built-in feature tables (no category_id — workspace is the sole scope) ──

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title        TEXT NOT NULL,
      url          TEXT NOT NULL,
      image_url    TEXT,
      favicon_url  TEXT,
      description  TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
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
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      banner_image TEXT,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS page_tags (
      page_id TEXT NOT NULL,
      tag     TEXT NOT NULL,
      PRIMARY KEY (page_id, tag),
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS ideas (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      content      TEXT NOT NULL DEFAULT '',
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS idea_tags (
      idea_id TEXT NOT NULL,
      tag     TEXT NOT NULL,
      PRIMARY KEY (idea_id, tag),
      FOREIGN KEY (idea_id) REFERENCES ideas(id) ON DELETE CASCADE
    )
  `);


  await database.execute(`
    CREATE TABLE IF NOT EXISTS books (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      description  TEXT NOT NULL DEFAULT '',
      url          TEXT,
      image_url    TEXT,
      author       TEXT NOT NULL DEFAULT '',
      rating       INTEGER NOT NULL DEFAULT 0,
      status       TEXT NOT NULL DEFAULT 'Want to Read',
      started_at   TEXT,
      finished_at  TEXT,
      pages_read   INTEGER NOT NULL DEFAULT 0,
      pages_total  INTEGER NOT NULL DEFAULT 0,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  // Migrations for existing databases to support new book metadata
  try { await database.execute('ALTER TABLE books ADD COLUMN description TEXT NOT NULL DEFAULT ""'); } catch { /* ignore */ }
  try { await database.execute('ALTER TABLE books ADD COLUMN started_at TEXT'); } catch { /* ignore */ }
  try { await database.execute('ALTER TABLE books ADD COLUMN finished_at TEXT'); } catch { /* ignore */ }
  try { await database.execute('ALTER TABLE books ADD COLUMN pages_read INTEGER NOT NULL DEFAULT 0'); } catch { /* ignore */ }
  try { await database.execute('ALTER TABLE books ADD COLUMN pages_total INTEGER NOT NULL DEFAULT 0'); } catch { /* ignore */ }

  // Migrate status values from Portuguese to English
  try { await database.execute("UPDATE books SET status = 'Want to Read' WHERE status = 'Quero Ler'"); } catch { /* ignore */ }
  try { await database.execute("UPDATE books SET status = 'Reading' WHERE status = 'Lendo'"); } catch { /* ignore */ }
  try { await database.execute("UPDATE books SET status = 'Paused' WHERE status = 'Pausado'"); } catch { /* ignore */ }
  try { await database.execute("UPDATE books SET status = 'Completed' WHERE status = 'Concluído'"); } catch { /* ignore */ }
  try { await database.execute("UPDATE books SET status = 'Abandoned' WHERE status = 'Abandonado'"); } catch { /* ignore */ }


  await database.execute(`
    CREATE TABLE IF NOT EXISTS book_tags (
      book_id TEXT NOT NULL,
      tag     TEXT NOT NULL,
      PRIMARY KEY (book_id, tag),
      FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS media (
      id             TEXT PRIMARY KEY,
      workspace_id   TEXT NOT NULL,
      title          TEXT NOT NULL DEFAULT '',
      content        TEXT NOT NULL DEFAULT '',
      type           TEXT NOT NULL DEFAULT 'Movie',
      creator        TEXT NOT NULL DEFAULT '',
      description    TEXT NOT NULL DEFAULT '',
      url            TEXT,
      image_url      TEXT,
      rating         INTEGER NOT NULL DEFAULT 0,
      status         TEXT NOT NULL DEFAULT 'Plan to Watch',
      started_at     TEXT,
      finished_at    TEXT,
      progress_value INTEGER NOT NULL DEFAULT 0,
      progress_total INTEGER NOT NULL DEFAULT 0,
      progress_unit  TEXT NOT NULL DEFAULT 'episodes',
      is_favorite    INTEGER NOT NULL DEFAULT 0,
      deleted_at     TEXT,
      created_at     TEXT NOT NULL,
      updated_at     TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  // Migrations for existing databases to support new media metadata
  try { await database.execute("ALTER TABLE media ADD COLUMN type TEXT NOT NULL DEFAULT 'Movie'"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN creator TEXT NOT NULL DEFAULT ''"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN description TEXT NOT NULL DEFAULT ''"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN started_at TEXT"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN finished_at TEXT"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN progress_value INTEGER NOT NULL DEFAULT 0"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN progress_total INTEGER NOT NULL DEFAULT 0"); } catch { /* ignore */ }
  try { await database.execute("ALTER TABLE media ADD COLUMN progress_unit TEXT NOT NULL DEFAULT 'episodes'"); } catch { /* ignore */ }

  await database.execute(`
    CREATE TABLE IF NOT EXISTS media_tags (
      media_id TEXT NOT NULL,
      tag      TEXT NOT NULL,
      PRIMARY KEY (media_id, tag),
      FOREIGN KEY (media_id) REFERENCES media(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS audio (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      url          TEXT,
      image_url    TEXT,
      artist       TEXT NOT NULL DEFAULT '',
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS audio_tags (
      audio_id TEXT NOT NULL,
      tag      TEXT NOT NULL,
      PRIMARY KEY (audio_id, tag),
      FOREIGN KEY (audio_id) REFERENCES audio(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS documents (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      url          TEXT,
      image_url    TEXT,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS document_tags (
      document_id TEXT NOT NULL,
      tag         TEXT NOT NULL,
      PRIMARY KEY (document_id, tag),
      FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS images (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      url          TEXT,
      image_url    TEXT,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS image_tags (
      image_id TEXT NOT NULL,
      tag      TEXT NOT NULL,
      PRIMARY KEY (image_id, tag),
      FOREIGN KEY (image_id) REFERENCES images(id) ON DELETE CASCADE
    )
  `);

  // ── Custom items (the only feature that groups by category_id) ───────────────

  await database.execute(`
    CREATE TABLE IF NOT EXISTS custom_items (
      id           TEXT PRIMARY KEY,
      workspace_id TEXT NOT NULL,
      category_id  TEXT NOT NULL,
      title        TEXT NOT NULL DEFAULT '',
      content      TEXT NOT NULL DEFAULT '',
      url          TEXT,
      image_url    TEXT,
      is_favorite  INTEGER NOT NULL DEFAULT 0,
      deleted_at   TEXT,
      created_at   TEXT NOT NULL,
      updated_at   TEXT NOT NULL,
      FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE,
      FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE CASCADE
    )
  `);

  await database.execute(`
    CREATE TABLE IF NOT EXISTS custom_item_tags (
      custom_item_id TEXT NOT NULL,
      tag            TEXT NOT NULL,
      PRIMARY KEY (custom_item_id, tag),
      FOREIGN KEY (custom_item_id) REFERENCES custom_items(id) ON DELETE CASCADE
    )
  `);

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

    await seedDefaultCategories(database, defaultId);
  } else {
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
  }
}

/**
 * Creates the 8 default sidebar categories for a given workspace.
 * Called once per new workspace (including the initial default workspace).
 * These categories are sidebar-config only — they do NOT own data rows.
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
    { slug: 'links',     name: 'Links',     type: 'links',     icon: 'L', position: 0 },
    { slug: 'pages',     name: 'Pages',     type: 'pages',     icon: 'P', position: 1 },
    { slug: 'ideas',     name: 'Ideas',     type: 'ideas',     icon: '*', position: 2 },
    { slug: 'books',     name: 'Books',     type: 'books',     icon: 'B', position: 3 },
    { slug: 'media',     name: 'Media',     type: 'media',     icon: 'M', position: 4 },
    { slug: 'audio',     name: 'Audio',     type: 'audio',     icon: 'A', position: 5 },
    { slug: 'documents', name: 'Documents', type: 'documents', icon: 'D', position: 6 },
    { slug: 'images',    name: 'Images',    type: 'images',    icon: 'I', position: 7 },
  ];

  for (const cat of defaults) {
    const id = crypto.randomUUID();
    await database.execute(
      `INSERT OR IGNORE INTO categories
         (id, workspace_id, name, slug, type, icon, is_default, is_hidden, position, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, 1, 0, $7, $8)`,
      [id, workspaceId, cat.name, cat.slug, cat.type, cat.icon, cat.position, now],
    );
  }
}
