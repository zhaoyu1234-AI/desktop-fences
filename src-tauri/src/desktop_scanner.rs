use crate::DesktopIcon;
use std::path::PathBuf;
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

        let target_path = if is_shortcut {
            resolve_shortcut(path.to_str().unwrap_or_default())
        } else {
            None
        };

        icons.push(DesktopIcon {
            id: Uuid::new_v4().to_string(),
            name,
            path: path.to_string_lossy().to_string(),
            icon_path: None,
            icon_base64: None,
            is_shortcut,
            target_path,
            working_dir: None,
            fence_id: None,
            position: None,
        });
    }

    Ok(icons)
}

fn resolve_shortcut(path: &str) -> Option<String> {
    // On Windows, use COM to resolve .lnk files
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::Win32::System::Com::{CoInitializeEx, CoCreateInstance, COINIT_APARTMENTTHREADED};
        use windows::Win32::UI::Shell::{IShellLinkW, IPersistFile};

        unsafe {
            let _ = CoInitializeEx(None, COINIT_APARTMENTTHREADED);

            let shell_link: Result<IShellLinkW, _> = CoCreateInstance(
                &windows::Win32::UI::Shell::ShellLink as *const _,
                None,
                windows::Win32::System::Com::CLSCTX_INPROC_SERVER,
            );

            if let Ok(link) = shell_link {
                let persist_file: Result<IPersistFile, _> = link.cast();

                if let Ok(pf) = persist_file {
                    let wide_path: Vec<u16> = OsStr::new(path)
                        .encode_wide()
                        .chain(Some(0))
                        .collect();

                    if pf.Load(wide_path.as_ptr(), 0).is_ok() {
                        let mut target = [0u16; 260];
                        if link.GetPath(&mut target, None, 0).is_ok() {
                            let len = target.iter().position(|&c| c == 0).unwrap_or(0);
                            let target_str = String::from_utf16_lossy(&target[..len]);
                            if !target_str.is_empty() {
                                return Some(target_str);
                            }
                        }
                    }
                }
            }
        }
    }

    None
}

pub fn get_icon_base64(path: &str) -> Result<String, String> {
    // Extract icon from executable
    #[cfg(target_os = "windows")]
    {
        use std::ffi::OsStr;
        use std::os::windows::ffi::OsStrExt;
        use windows::Win32::UI::WindowsAndMessaging::{ExtractIconW, HICON};

        unsafe {
            let wide_path: Vec<u16> = OsStr::new(path)
                .encode_wide()
                .chain(Some(0))
                .collect();

            let hicon = ExtractIconW(None, wide_path.as_ptr(), 0);

            if !hicon.is_invalid() {
                // Convert HICON to base64 PNG
                // This is simplified - in production, use proper icon extraction
                return Ok(String::new());
            }
        }
    }

    Ok(String::new())
}
