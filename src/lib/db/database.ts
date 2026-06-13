import Database from '@tauri-apps/plugin-sql';

let db: Database | null = null;

export async function getDatabase(): Promise<Database> {
  if (!db) {
    // 1. Usando um nome novo ('link-it.db') para garantir um banco limpo, 
    // livre de qualquer estado corrompido do arquivo anterior.
    const connection = await Database.load('sqlite:link-it.db');
    
    // 2. Tenta criar as tabelas
    await initDatabase(connection);
    
    // 3. CORREÇÃO DE CACHE: Só atribuímos à variável global 'db' DEPOIS 
    // que as tabelas foram criadas com sucesso. Se o initDatabase falhar, 
    // a próxima chamada tentará criar as tabelas novamente.
    db = connection; 
  }
  return db;
}

async function initDatabase(database: Database): Promise<void> {
  // O SQLite vem com Foreign Keys desabilitadas por padrão.
  // Precisamos habilitá-las para que o "ON DELETE CASCADE" funcione corretamente.
  await database.execute('PRAGMA foreign_keys = ON');

  // NOTA IMPORTANTE: O driver SQL do Tauri NÃO aceita o ponto e vírgula (;) 
  // no final das strings SQL multi-linha. Removê-los resolve o erro "incomplete input".
  
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