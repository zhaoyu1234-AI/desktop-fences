use rusqlite::{Connection, Result};
use std::path::Path;

pub fn init_db(app_dir: &Path) -> Result<()> {
    let db_path = app_dir.join("fences.db");
    let conn = Connection::open(db_path)?;

    conn.execute_batch(
        "CREATE TABLE IF NOT EXISTS fences (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            x REAL NOT NULL DEFAULT 100,
            y REAL NOT NULL DEFAULT 100,
            width REAL NOT NULL DEFAULT 300,
            height REAL NOT NULL DEFAULT 400,
            color TEXT NOT NULL DEFAULT '20,20,30',
            opacity REAL NOT NULL DEFAULT 0.85,
            icon_size INTEGER NOT NULL DEFAULT 48,
            columns INTEGER NOT NULL DEFAULT 4,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS icon_positions (
            icon_id TEXT NOT NULL,
            fence_id TEXT NOT NULL,
            position_x REAL NOT NULL DEFAULT 0,
            position_y REAL NOT NULL DEFAULT 0,
            sort_order INTEGER NOT NULL DEFAULT 0,
            PRIMARY KEY (icon_id, fence_id),
            FOREIGN KEY (fence_id) REFERENCES fences(id) ON DELETE CASCADE
        );

        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        );"
    )?;

    Ok(())
}
