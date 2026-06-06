use crate::DesktopIcon;
use uuid::Uuid;
use walkdir::WalkDir;

pub fn scan_desktop() -> Result<Vec<DesktopIcon>, String> {
    let desktop = dirs::desktop_dir().ok_or("Cannot find desktop directory")?;
    let mut icons = Vec::new();

    for entry in WalkDir::new(&desktop)
        .max_depth(1)
        .into_iter()
        .filter_map(|e| e.ok())
    {
        let path = entry.path();

        if path == desktop {
            continue;
        }

        let name = path
            .file_stem()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let is_shortcut = path
            .extension()
            .map(|e| e.to_string_lossy().to_lowercase() == "lnk")
            .unwrap_or(false);

        icons.push(DesktopIcon {
            id: Uuid::new_v4().to_string(),
            name,
            path: path.to_string_lossy().to_string(),
            icon_path: None,
            icon_base64: None,
            is_shortcut,
            target_path: None,
            working_dir: None,
            fence_id: None,
            position: None,
        });
    }

    Ok(icons)
}

pub fn get_icon_base64(_path: &str) -> Result<String, String> {
    // Icon extraction not implemented yet
    Ok(String::new())
}
