use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

mod db;
mod desktop_scanner;
mod fence_manager;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DesktopIcon {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon_path: Option<String>,
    pub icon_base64: Option<String>,
    pub is_shortcut: bool,
    pub target_path: Option<String>,
    pub working_dir: Option<String>,
    pub fence_id: Option<String>,
    pub position: Option<Position>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Position {
    pub x: f64,
    pub y: f64,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Fence {
    pub id: String,
    pub name: String,
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
    pub color: String,
    pub opacity: f64,
    pub icon_size: i32,
    pub columns: i32,
}

#[tauri::command]
fn scan_desktop_icons() -> Result<Vec<DesktopIcon>, String> {
    desktop_scanner::scan_desktop()
}

#[tauri::command]
fn get_fences() -> Result<Vec<Fence>, String> {
    fence_manager::get_all_fences()
}

#[tauri::command]
fn create_fence(name: String, x: f64, y: f64, width: f64, height: f64) -> Result<Fence, String> {
    fence_manager::create_fence(name, x, y, width, height)
}

#[tauri::command]
fn update_fence(id: String, name: Option<String>, x: Option<f64>, y: Option<f64>, width: Option<f64>, height: Option<f64>) -> Result<(), String> {
    fence_manager::update_fence(&id, name, x, y, width, height)
}

#[tauri::command]
fn delete_fence(id: String) -> Result<(), String> {
    fence_manager::delete_fence(&id)
}

#[tauri::command]
fn move_icon_to_fence(icon_id: String, fence_id: String, position: Position) -> Result<(), String> {
    fence_manager::move_icon_to_fence(&icon_id, &fence_id, position)
}

#[tauri::command]
fn remove_icon_from_fence(icon_id: String) -> Result<(), String> {
    fence_manager::remove_icon_from_fence(&icon_id)
}

#[tauri::command]
fn launch_icon(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_icon_base64(path: String) -> Result<String, String> {
    desktop_scanner::get_icon_base64(&path)
}

#[tauri::command]
fn toggle_window(app: tauri::AppHandle) {
    if let Some(window) = app.get_webview_window("main") {
        if window.is_visible().unwrap_or(false) {
            let _ = window.hide();
        } else {
            let _ = window.show();
            let _ = window.set_focus();
        }
    }
}

fn apply_window_style(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use window_vibrancy::apply_acrylic;

        // 应用 Acrylic 毛玻璃效果
        let _ = apply_acrylic(window, Some((20, 20, 30, 180)));
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app dir");
            fs::create_dir_all(&app_dir).ok();
            db::init_db(&app_dir).expect("failed to init database");

            // 应用窗口样式
            if let Some(window) = app.get_webview_window("main") {
                apply_window_style(&window);
            }

            // 注册全局快捷键 Ctrl+Space
            let app_handle = app.handle().clone();
            app.plugin(tauri_plugin_global_shortcut::Builder::new().build())?;

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_desktop_icons,
            get_fences,
            create_fence,
            update_fence,
            delete_fence,
            move_icon_to_fence,
            remove_icon_from_fence,
            launch_icon,
            get_icon_base64,
            toggle_window
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
