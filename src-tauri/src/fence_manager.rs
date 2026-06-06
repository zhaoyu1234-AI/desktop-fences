use crate::{Fence, Position};
use rusqlite::Connection;
use std::path::PathBuf;
use uuid::Uuid;

fn get_db_path() -> PathBuf {
    dirs::data_dir()
        .unwrap_or_else(|| PathBuf::from("."))
        .join("desktop-fences")
        .join("fences.db")
}

pub fn create_fence(name: String, x: f64, y: f64, width: f64, height: f64) -> Result<Fence, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    let id = Uuid::new_v4().to_string();

    conn.execute(
        "INSERT INTO fences (id, name, x, y, width, height) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (&id, &name, x, y, width, height),
    )
    .map_err(|e| e.to_string())?;

    Ok(Fence {
        id,
        name,
        x,
        y,
        width,
        height,
        color: "20,20,30".to_string(),
        opacity: 0.85,
        icon_size: 48,
        columns: 4,
    })
}

pub fn get_all_fences() -> Result<Vec<Fence>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    let mut stmt = conn
        .prepare("SELECT id, name, x, y, width, height, color, opacity, icon_size, columns FROM fences")
        .map_err(|e| e.to_string())?;

    let fences = stmt
        .query_map([], |row| {
            Ok(Fence {
                id: row.get(0)?,
                name: row.get(1)?,
                x: row.get(2)?,
                y: row.get(3)?,
                width: row.get(4)?,
                height: row.get(5)?,
                color: row.get(6)?,
                opacity: row.get(7)?,
                icon_size: row.get(8)?,
                columns: row.get(9)?,
            })
        })
        .map_err(|e| e.to_string())?
        .filter_map(|r| r.ok())
        .collect();

    Ok(fences)
}

pub fn update_fence(
    id: &str,
    name: Option<String>,
    x: Option<f64>,
    y: Option<f64>,
    width: Option<f64>,
    height: Option<f64>,
) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;

    if let Some(n) = name {
        conn.execute("UPDATE fences SET name = ?1 WHERE id = ?2", (&n, id))
            .map_err(|e| e.to_string())?;
    }
    if let Some(x_val) = x {
        conn.execute("UPDATE fences SET x = ?1 WHERE id = ?2", (x_val, id))
            .map_err(|e| e.to_string())?;
    }
    if let Some(y_val) = y {
        conn.execute("UPDATE fences SET y = ?1 WHERE id = ?2", (y_val, id))
            .map_err(|e| e.to_string())?;
    }
    if let Some(w) = width {
        conn.execute("UPDATE fences SET width = ?1 WHERE id = ?2", (w, id))
            .map_err(|e| e.to_string())?;
    }
    if let Some(h) = height {
        conn.execute("UPDATE fences SET height = ?1 WHERE id = ?2", (h, id))
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

pub fn delete_fence(id: &str) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM fences WHERE id = ?1", (id,))
        .map_err(|e| e.to_string())?;
    Ok(())
}

pub fn move_icon_to_fence(icon_id: &str, fence_id: &str, position: Position) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;

    conn.execute(
        "INSERT OR REPLACE INTO icon_positions (icon_id, fence_id, position_x, position_y) VALUES (?1, ?2, ?3, ?4)",
        (icon_id, fence_id, position.x, position.y),
    )
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn remove_icon_from_fence(icon_id: &str) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    conn.execute("DELETE FROM icon_positions WHERE icon_id = ?1", (icon_id,))
        .map_err(|e| e.to_string())?;
    Ok(())
}
