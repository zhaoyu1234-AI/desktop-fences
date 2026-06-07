use serde::{Deserialize, Serialize};
use std::fs;
use tauri::Manager;

mod auto_classifier;
mod db;
mod desktop_features;
mod desktop_scanner;
mod disk_mapper;
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

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct DiskMapping {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon: String,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct RecentDocument {
    pub id: String,
    pub name: String,
    pub path: String,
    pub opened_at: String,
    pub file_type: String,
}

// ==================== 桌面图标命令 ====================

#[tauri::command]
fn scan_desktop_icons() -> Result<Vec<DesktopIcon>, String> {
    desktop_scanner::scan_desktop()
}

#[tauri::command]
fn get_icon_base64(path: String) -> Result<String, String> {
    desktop_scanner::get_icon_base64(&path)
}

// ==================== 分区管理命令 ====================

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

// ==================== 启动命令 ====================

#[tauri::command]
fn launch_icon(path: String) -> Result<(), String> {
    open::that(&path).map_err(|e| e.to_string())
}

// ==================== 窗口控制命令 ====================

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

// ==================== 自动分类命令 ====================

#[tauri::command]
fn auto_classify_icons(icons: Vec<DesktopIcon>) -> std::collections::HashMap<String, Vec<String>> {
    auto_classifier::auto_classify(&icons)
}

#[tauri::command]
fn get_category_info(category: String) -> (String, String) {
    auto_classifier::get_category_info(&category)
}

#[tauri::command]
fn get_recent_files(icons: Vec<DesktopIcon>, limit: usize) -> Vec<String> {
    auto_classifier::get_recent_files(&icons, limit)
}

// ==================== 磁盘映射命令 ====================

#[tauri::command]
fn get_system_drives() -> Vec<DiskMapping> {
    disk_mapper::get_system_drives()
}

#[tauri::command]
fn get_common_directories() -> Vec<DiskMapping> {
    disk_mapper::get_common_directories()
}

#[tauri::command]
fn list_directory(path: String) -> Result<Vec<DesktopIcon>, String> {
    disk_mapper::list_directory(&path)
}

// ==================== 最近文档命令 ====================

#[tauri::command]
fn get_recent_documents() -> Vec<RecentDocument> {
    // 从数据库获取最近文档
    Vec::new()
}

#[tauri::command]
fn add_recent_document(path: String) -> Result<(), String> {
    // 添加到数据库
    Ok(())
}

#[tauri::command]
fn clear_recent_documents() -> Result<(), String> {
    // 清空数据库
    Ok(())
}

// ==================== 一键整理命令 ====================

#[tauri::command]
fn auto_organize_desktop() -> Result<Vec<Fence>, String> {
    let icons = desktop_scanner::scan_desktop()?;
    let categories = auto_classifier::auto_classify(&icons);

    let mut fences = Vec::new();

    for (category, icon_ids) in categories {
        if icon_ids.is_empty() {
            continue;
        }

        let (icon, color) = auto_classifier::get_category_info(&category);

        let fence = fence_manager::create_fence(
            category,
            100.0,
            100.0,
            300.0,
            400.0,
        )?;

        // 移动图标到分区
        for icon_id in icon_ids {
            let _ = fence_manager::move_icon_to_fence(&icon_id, &fence.id, Position { x: 0.0, y: 0.0 });
        }

        fences.push(fence);
    }

    Ok(fences)
}

// ==================== 窗口样式 ====================

fn apply_window_style(window: &tauri::WebviewWindow) {
    #[cfg(target_os = "windows")]
    {
        use window_vibrancy::apply_acrylic;
        let _ = apply_acrylic(window, Some((20, 20, 30, 180)));
    }
}

// ==================== 应用入口 ====================

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

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            scan_desktop_icons,
            get_icon_base64,
            get_fences,
            create_fence,
            update_fence,
            delete_fence,
            move_icon_to_fence,
            remove_icon_from_fence,
            launch_icon,
            toggle_window,
            auto_classify_icons,
            get_category_info,
            get_recent_files,
            get_system_drives,
            get_common_directories,
            list_directory,
            get_recent_documents,
            add_recent_document,
            clear_recent_documents,
            auto_organize_desktop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
