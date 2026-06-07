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
async fn set_window_as_desktop(window: tauri::Window) -> Result<(), String> {
    #[cfg(target_os = "windows")]
    {
        use windows::Win32::UI::WindowsAndMessaging::*;
        use windows::Win32::Foundation::*;

        unsafe {
            // 获取窗口句柄
            let hwnd = window.hwnd().map_err(|e| e.to_string())?;
            let hwnd = HWND(hwnd.0);

            // 设置窗口样式
            let style = GetWindowLongW(hwnd, GWL_EXSTYLE);
            SetWindowLongW(hwnd, GWL_EXSTYLE, (style | WS_EX_TOOLWINDOW as i32) & !WS_EX_APPWINDOW as i32);

            // 设置窗口在最底层
            SetWindowPos(
                hwnd,
                HWND_BOTTOM,
                0, 0, 0, 0,
                SWP_NOMOVE | SWP_NOSIZE | SWP_NOACTIVATE,
            ).map_err(|e| e.to_string())?;

            // 找到桌面图标窗口并设置为父窗口
            let progman = FindWindowA("Progman\0", None);
            if !progman.is_invalid() {
                // 发送消息创建 WorkerW 窗口
                SendMessageA(progman, 0x052C, WPARAM(0), LPARAM(0));

                // 枚举窗口找到 WorkerW
                let mut workerw = HWND::default();
                EnumWindows(Some(enum_windows_proc), LPARAM(&mut workerw as *mut HWND as isize));

                if !workerw.is_invalid() {
                    // 将我们的窗口设置为 WorkerW 的子窗口
                    let _ = SetParent(hwnd, workerw);
                }
            }
        }
    }

    Ok(())
}

#[cfg(target_os = "windows")]
unsafe extern "system" fn enum_windows_proc(hwnd: windows::Win32::Foundation::HWND, lparam: windows::Win32::Foundation::LPARAM) -> windows::Win32::Foundation::BOOL {
    use windows::Win32::UI::WindowsAndMessaging::*;

    let workerw_ptr = lparam.0 as *mut windows::Win32::Foundation::HWND;
    let shell_dll_def_view = FindWindowExA(hwnd, None, "SHELLDLL_DefView\0", None);

    if !shell_dll_def_view.is_invalid() {
        let sibling = FindWindowExA(None, hwnd, "WorkerW\0", None);
        if !sibling.is_invalid() {
            *workerw_ptr = sibling;
            return windows::Win32::Foundation::BOOL(0);
        }
    }

    windows::Win32::Foundation::BOOL(1)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            let app_dir = app.path().app_data_dir().expect("failed to get app dir");
            fs::create_dir_all(&app_dir).ok();
            db::init_db(&app_dir).expect("failed to init database");
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
            set_window_as_desktop
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
