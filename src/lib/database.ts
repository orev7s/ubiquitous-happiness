import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

const getDatabasePath = (): string => {
    const dbPath = process.env.DATABASE_PATH || './data/platform.db';
    const absolutePath = path.isAbsolute(dbPath)
        ? dbPath
        : path.join(process.cwd(), dbPath);

    const dir = path.dirname(absolutePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    return absolutePath;
};

let db: Database.Database | null = null;

export const getDatabase = (): Database.Database => {
    if (!db) {
        db = new Database(getDatabasePath());
        db.pragma('journal_mode = WAL');
        initializeTables(db);
    }
    return db;
};

const initializeTables = (database: Database.Database): void => {
    database.exec(`
    CREATE TABLE IF NOT EXISTS koyeb_accounts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      api_key TEXT NOT NULL,
      app_id TEXT NOT NULL,
      instance_type TEXT DEFAULT 'micro',
      enabled INTEGER DEFAULT 1,
      last_used_at TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deployments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      service_name TEXT NOT NULL,
      koyeb_account_id INTEGER NOT NULL,
      discord_token TEXT NOT NULL,
      discord_client_id TEXT NOT NULL,
      discord_owner_id TEXT NOT NULL,
      discord_guild_id TEXT,
      public_url TEXT,
      status TEXT DEFAULT 'pending',
      ping_enabled INTEGER DEFAULT 0,
      last_ping_at TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (koyeb_account_id) REFERENCES koyeb_accounts(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_deployments_user_id ON deployments(user_id);
    CREATE INDEX IF NOT EXISTS idx_deployments_status ON deployments(status);
    CREATE INDEX IF NOT EXISTS idx_koyeb_accounts_enabled ON koyeb_accounts(enabled);
  `);
};

export const closeDatabase = (): void => {
    if (db) {
        db.close();
        db = null;
    }
};
