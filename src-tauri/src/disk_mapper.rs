use serde::{Deserialize, Serialize};
use std::path::PathBuf;

/// 磁盘映射配置
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DiskMapping {
    pub id: String,
    pub name: String,
    pub path: String,
    pub icon: String,
}

/// 获取系统盘符
pub fn get_system_drives() -> Vec<DiskMapping> {
    let mut drives = Vec::new();

    for letter in 'A'..='Z' {
        let path = format!("{}:\\", letter);
        if std::path::Path::new(&path).exists() {
            let name = get_drive_name(&path);
            let icon = get_drive_icon(&path);

            drives.push(DiskMapping {
                id: format!("drive-{}", letter),
                name,
                path,
                icon,
            });
        }
    }

    drives
}

/// 获取磁盘名称
fn get_drive_name(path: &str) -> String {
    // 尝试获取卷标
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;

        let wide_path: Vec<u16> = std::path::Path::new(path)
            .as_os_str()
            .encode_wide()
            .chain(Some(0))
            .collect();

        let mut volume_name = [0u16; 256];
        let mut file_system = [0u16; 256];

        unsafe {
            let result = windows::Win32::Storage::FileSystem::GetVolumeInformationW(
                Some(windows::core::PCWSTR(wide_path.as_ptr())),
                Some(&mut volume_name),
                None,
                None,
                None,
                Some(&mut file_system),
            );

            if result.is_ok() {
                let len = volume_name.iter().position(|&c| c == 0).unwrap_or(0);
                if len > 0 {
                    return String::from_utf16_lossy(&volume_name[..len]);
                }
            }
        }
    }

    // 默认名称
    let letter = path.chars().next().unwrap_or('?');
    format!("本地磁盘 ({})", letter)
}

/// 获取磁盘图标
fn get_drive_icon(path: &str) -> String {
    let letter = path.chars().next().unwrap_or('?').to_uppercase().next().unwrap();

    match letter {
        'C' => "💿".to_string(),  // 系统盘
        'D' => "📀".to_string(),
        _ => "💾".to_string(),
    }
}

/// 获取常用目录
pub fn get_common_directories() -> Vec<DiskMapping> {
    let mut dirs = Vec::new();

    // 用户目录
    if let Some(home) = dirs::home_dir() {
        dirs.push(DiskMapping {
            id: "home".to_string(),
            name: "用户目录".to_string(),
            path: home.to_string_lossy().to_string(),
            icon: "🏠".to_string(),
        });
    }

    // 桌面
    if let Some(desktop) = dirs::desktop_dir() {
        dirs.push(DiskMapping {
            id: "desktop".to_string(),
            name: "桌面".to_string(),
            path: desktop.to_string_lossy().to_string(),
            icon: "🖥️".to_string(),
        });
    }

    // 文档
    if let Some(documents) = dirs::document_dir() {
        dirs.push(DiskMapping {
            id: "documents".to_string(),
            name: "文档".to_string(),
            path: documents.to_string_lossy().to_string(),
            icon: "📁".to_string(),
        });
    }

    // 下载
    if let Some(download) = dirs::download_dir() {
        dirs.push(DiskMapping {
            id: "downloads".to_string(),
            name: "下载".to_string(),
            path: download.to_string_lossy().to_string(),
            icon: "⬇️".to_string(),
        });
    }

    // 图片
    if let Some(picture) = dirs::picture_dir() {
        dirs.push(DiskMapping {
            id: "pictures".to_string(),
            name: "图片".to_string(),
            path: picture.to_string_lossy().to_string(),
            icon: "🖼️".to_string(),
        });
    }

    // 音乐
    if let Some(music) = dirs::audio_dir() {
        dirs.push(DiskMapping {
            id: "music".to_string(),
            name: "音乐".to_string(),
            path: music.to_string_lossy().to_string(),
            icon: "🎵".to_string(),
        });
    }

    // 视频
    if let Some(video) = dirs::video_dir() {
        dirs.push(DiskMapping {
            id: "videos".to_string(),
            name: "视频".to_string(),
            path: video.to_string_lossy().to_string(),
            icon: "🎬".to_string(),
        });
    }

    dirs
}

/// 列出目录内容
pub fn list_directory(path: &str) -> Result<Vec<crate::DesktopIcon>, String> {
    let dir_path = std::path::Path::new(path);

    if !dir_path.exists() {
        return Err(format!("Directory not found: {}", path));
    }

    if !dir_path.is_dir() {
        return Err(format!("Not a directory: {}", path));
    }

    let mut items = Vec::new();

    for entry in std::fs::read_dir(dir_path).map_err(|e| e.to_string())? {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        let metadata = entry.metadata().map_err(|e| e.to_string())?;

        let name = path
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        items.push(crate::DesktopIcon {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            path: path.to_string_lossy().to_string(),
            icon_path: None,
            icon_base64: None,
            is_shortcut: path.extension().map(|e| e == "lnk").unwrap_or(false),
            target_path: None,
            working_dir: None,
            fence_id: None,
            position: None,
        });
    }

    Ok(items)
}
