use serde::{Deserialize, Serialize};
use std::time::SystemTime;

/// 最近文档记录
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RecentDocument {
    pub id: String,
    pub name: String,
    pub path: String,
    pub opened_at: String,
    pub file_type: String,
}

/// 桌面功能管理器
pub struct DesktopFeatures {
    pub fences_visible: bool,
    pub recent_documents: Vec<RecentDocument>,
}

impl DesktopFeatures {
    pub fn new() -> Self {
        Self {
            fences_visible: true,
            recent_documents: Vec::new(),
        }
    }

    /// 切换分区显示状态
    pub fn toggle_fences(&mut self) -> bool {
        self.fences_visible = !self.fences_visible;
        self.fences_visible
    }

    /// 添加最近文档
    pub fn add_recent_document(&mut self, path: &str) {
        let path_obj = std::path::Path::new(path);

        let name = path_obj
            .file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string();

        let extension = path_obj
            .extension()
            .and_then(|e| e.to_str())
            .unwrap_or("")
            .to_lowercase();

        let file_type = get_file_type(&extension);

        let now = chrono::Local::now().format("%Y-%m-%d %H:%M:%S").to_string();

        // 检查是否已存在
        if let Some(existing) = self.recent_documents.iter_mut().find(|d| d.path == path) {
            existing.opened_at = now;
            return;
        }

        // 添加新记录
        self.recent_documents.push(RecentDocument {
            id: uuid::Uuid::new_v4().to_string(),
            name,
            path: path.to_string(),
            opened_at: now,
            file_type,
        });

        // 只保留最近 20 个
        if self.recent_documents.len() > 20 {
            self.recent_documents.remove(0);
        }
    }

    /// 获取最近文档
    pub fn get_recent_documents(&self, limit: usize) -> Vec<&RecentDocument> {
        let mut docs: Vec<&RecentDocument> = self.recent_documents.iter().collect();
        docs.sort_by(|a, b| b.opened_at.cmp(&a.opened_at));
        docs.into_iter().take(limit).collect()
    }

    /// 清空最近文档
    pub fn clear_recent_documents(&mut self) {
        self.recent_documents.clear();
    }
}

/// 获取文件类型描述
fn get_file_type(extension: &str) -> String {
    match extension {
        "doc" | "docx" => "Word 文档".to_string(),
        "xls" | "xlsx" => "Excel 表格".to_string(),
        "ppt" | "pptx" => "PPT 演示".to_string(),
        "pdf" => "PDF 文档".to_string(),
        "txt" | "md" => "文本文件".to_string(),
        "jpg" | "jpeg" | "png" | "gif" | "bmp" => "图片".to_string(),
        "mp4" | "avi" | "mov" | "mkv" => "视频".to_string(),
        "mp3" | "wav" | "flac" => "音频".to_string(),
        "zip" | "rar" | "7z" => "压缩包".to_string(),
        "exe" | "msi" => "程序".to_string(),
        "lnk" => "快捷方式".to_string(),
        _ => "文件".to_string(),
    }
}

/// 获取文件图标
pub fn get_file_icon(extension: &str) -> String {
    match extension {
        "doc" | "docx" => "📄".to_string(),
        "xls" | "xlsx" => "📊".to_string(),
        "ppt" | "pptx" => "📽️".to_string(),
        "pdf" => "📕".to_string(),
        "txt" | "md" => "📝".to_string(),
        "jpg" | "jpeg" | "png" | "gif" | "bmp" => "🖼️".to_string(),
        "mp4" | "avi" | "mov" | "mkv" => "🎬".to_string(),
        "mp3" | "wav" | "flac" => "🎵".to_string(),
        "zip" | "rar" | "7z" => "📦".to_string(),
        "exe" | "msi" => "⚙️".to_string(),
        "lnk" => "🔗".to_string(),
        "html" | "htm" => "🌐".to_string(),
        "js" | "ts" | "py" | "java" | "cpp" | "rs" => "💻".to_string(),
        _ => "📁".to_string(),
    }
}

/// 桌面壁纸信息
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WallpaperInfo {
    pub path: String,
    pub style: String,  // fill, fit, stretch, tile, center
}

/// 获取当前壁纸
pub fn get_current_wallpaper() -> Result<WallpaperInfo, String> {
    #[cfg(target_os = "windows")]
    {
        use winreg::enums::HKEY_CURRENT_USER;
        use winreg::RegKey;

        let hkcu = RegKey::predef(HKEY_CURRENT_USER);
        let desktop = hkcu
            .open_subkey("Control Panel\\Desktop")
            .map_err(|e| e.to_string())?;

        let path: String = desktop
            .get_value("WallPaper")
            .map_err(|e| e.to_string())?;

        let style_num: String = desktop
            .get_value("WallpaperStyle")
            .unwrap_or_else(|_| "2".to_string());

        let style = match style_num.as_str() {
            "0" => "tile".to_string(),
            "2" => "stretch".to_string(),
            "6" => "fit".to_string(),
            "10" => "fill".to_string(),
            "0" => "center".to_string(),
            _ => "fill".to_string(),
        };

        return Ok(WallpaperInfo { path, style });
    }

    #[cfg(not(target_os = "windows"))]
    {
        Err("Not supported on this platform".to_string())
    }
}
