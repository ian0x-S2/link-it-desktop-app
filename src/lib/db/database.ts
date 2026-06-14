import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    const connection = await Database.load("sqlite:link-it.db");

    await initDatabase(connection);

    db = connection;
  }
  return db;
}

async function initDatabase(database: Database): Promise<void> {
  await database.execute("PRAGMA foreign_keys = ON");

  await database.execute(`
    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      image_url TEXT,
      favicon_url TEXT,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_favorite INTEGER NOT NULL DEFAULT 0
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
}
