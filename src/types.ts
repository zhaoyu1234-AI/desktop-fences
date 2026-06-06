export interface DesktopIcon {
  id: string;
  name: string;
  path: string;
  icon_path: string | null;
  icon_base64: string | null;
  is_shortcut: boolean;
  target_path: string | null;
  working_dir: string | null;
  fence_id: string | null;
  position: Position | null;
}

export interface Position {
  x: number;
  y: number;
}

export interface Fence {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  icon_size: number;
  columns: number;
}
