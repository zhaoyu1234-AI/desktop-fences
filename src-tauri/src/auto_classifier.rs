use crate::DesktopIcon;
use std::collections::HashMap;

/// 文件分类规则
pub struct ClassificationRule {
    pub category: String,
    pub extensions: Vec<String>,
    pub icon: String,
    pub color: String,
}

/// 获取分类规则
fn get_classification_rules() -> Vec<ClassificationRule> {
    vec![
        ClassificationRule {
            category: "文档".to_string(),
            extensions: vec![
                "doc", "docx", "pdf", "txt", "md", "rtf", "odt",
                "xls", "xlsx", "csv", "ppt", "pptx",
            ],
            icon: "📄".to_string(),
            color: "#4096ff".to_string(),
        },
        ClassificationRule {
            category: "图片".to_string(),
            extensions: vec![
                "jpg", "jpeg", "png", "gif", "bmp", "svg", "webp", "ico", "tiff",
            ],
            icon: "🖼️".to_string(),
            color: "#eb2f96".to_string(),
        },
        ClassificationRule {
            category: "视频".to_string(),
            extensions: vec![
                "mp4", "avi", "mov", "mkv", "wmv", "flv", "webm", "m4v",
            ],
            icon: "🎬".to_string(),
            color: "#722ed1".to_string(),
        },
        ClassificationRule {
            category: "音频".to_string(),
            extensions: vec![
                "mp3", "wav", "flac", "aac", "ogg", "wma", "m4a",
            ],
            icon: "🎵".to_string(),
            color: "#13c2c2".to_string(),
        },
        ClassificationRule {
            category: "压缩包".to_string(),
            extensions: vec![
                "zip", "rar", "7z", "tar", "gz", "bz2", "xz",
            ],
            icon: "📦".to_string(),
            color: "#fa8c16".to_string(),
        },
        ClassificationRule {
            category: "程序".to_string(),
            extensions: vec![
                "exe", "msi", "bat", "cmd", "ps1", "sh",
            ],
            icon: "⚙️".to_string(),
            color: "#52c41a".to_string(),
        },
        ClassificationRule {
            category: "代码".to_string(),
            extensions: vec![
                "js", "ts", "py", "java", "cpp", "c", "h", "rs", "go",
                "html", "css", "json", "xml", "yaml", "yml", "toml",
                "sql", "sh", "bat",
            ],
            icon: "💻".to_string(),
            color: "#2f54eb".to_string(),
        },
        ClassificationRule {
            category: "快捷方式".to_string(),
            extensions: vec!["lnk", "url"],
            icon: "🔗".to_string(),
            color: "#faad14".to_string(),
        },
    ]
}

/// 自动分类桌面图标
pub fn auto_classify(icons: &[DesktopIcon]) -> HashMap<String, Vec<String>> {
    let rules = get_classification_rules();
    let mut categories: HashMap<String, Vec<String>> = HashMap::new();

    // 初始化分类
    for rule in &rules {
        categories.insert(rule.category.clone(), Vec::new());
    }
    categories.insert("其他".to_string(), Vec::new());
    categories.insert("文件夹".to_string(), Vec::new());

    for icon in icons {
        let category = if icon.path.ends_with(".lnk") || icon.path.ends_with(".url") {
            "快捷方式".to_string()
        } else if std::path::Path::new(&icon.path).is_dir() {
            "文件夹".to_string()
        } else {
            get_file_category(&icon.path, &rules)
        };

        categories
            .entry(category)
            .or_insert_with(Vec::new)
            .push(icon.id.clone());
    }

    // 移除空分类
    categories.retain(|_, v| !v.is_empty());

    categories
}

/// 获取文件分类
fn get_file_category(path: &str, rules: &[ClassificationRule]) -> String {
    let extension = std::path::Path::new(path)
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    for rule in rules {
        if rule.extensions.contains(&extension) {
            return rule.category.clone();
        }
    }

    "其他".to_string()
}

/// 获取分类信息
pub fn get_category_info(category: &str) -> (String, String) {
    let rules = get_classification_rules();

    for rule in &rules {
        if rule.category == category {
            return (rule.icon.clone(), rule.color.clone());
        }
    }

    match category {
        "文件夹" => ("📁".to_string(), "#faad14".to_string()),
        _ => ("📁".to_string(), "#8c8c8c".to_string()),
    }
}

/// 获取最近修改的文件
pub fn get_recent_files(icons: &[DesktopIcon], limit: usize) -> Vec<String> {
    let mut files: Vec<(&DesktopIcon, std::time::SystemTime)> = icons
        .iter()
        .filter_map(|icon| {
            std::fs::metadata(&icon.path)
                .ok()
                .and_then(|m| m.modified().ok())
                .map(|t| (icon, t))
        })
        .collect();

    // 按修改时间排序（最新的在前）
    files.sort_by(|a, b| b.1.cmp(&a.1));

    files
        .iter()
        .take(limit)
        .map(|(icon, _)| icon.id.clone())
        .collect()
}
