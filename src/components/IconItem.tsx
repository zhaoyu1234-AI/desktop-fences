import { useDraggable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { File, Folder, FileText, Image, Video, Music, Code, Archive, AppWindow } from "lucide-react";
import { useStore } from "../store";
import type { DesktopIcon } from "../types";

interface IconItemProps {
  icon: DesktopIcon;
}

function getIconComponent(icon: DesktopIcon) {
  if (icon.is_shortcut) {
    return <AppWindow className="w-12 h-12 text-blue-400" />;
  }

  const ext = icon.path.split(".").pop()?.toLowerCase() || "";

  if (["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp"].includes(ext)) {
    return <Image className="w-12 h-12 text-pink-400" />;
  }
  if (["mp4", "avi", "mov", "mkv", "wmv"].includes(ext)) {
    return <Video className="w-12 h-12 text-purple-400" />;
  }
  if (["mp3", "wav", "flac", "aac", "ogg"].includes(ext)) {
    return <Music className="w-12 h-12 text-green-400" />;
  }
  if (["js", "ts", "py", "java", "cpp", "rs", "go", "html", "css"].includes(ext)) {
    return <Code className="w-12 h-12 text-cyan-400" />;
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return <Archive className="w-12 h-12 text-orange-400" />;
  }
  if (["pdf", "doc", "docx", "txt", "md", "rtf"].includes(ext)) {
    return <FileText className="w-12 h-12 text-emerald-400" />;
  }

  return <File className="w-12 h-12 text-gray-400" />;
}

export function IconItem({ icon }: IconItemProps) {
  const { launchIcon, removeIconFromFence, setContextMenu } = useStore();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: icon.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleDoubleClick = () => {
    const pathToLaunch = icon.target_path || icon.path;
    launchIcon(pathToLaunch);
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, iconId: icon.id });
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`icon-item ${isDragging ? "dragging" : ""}`}
      onDoubleClick={handleDoubleClick}
      onContextMenu={handleContextMenu}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {icon.icon_base64 ? (
        <img
          src={`data:image/png;base64,${icon.icon_base64}`}
          alt={icon.name}
          className="icon-image"
          draggable={false}
        />
      ) : (
        <div className="w-12 h-12 flex items-center justify-center">
          {getIconComponent(icon)}
        </div>
      )}
      <span className="icon-name" title={icon.name}>
        {icon.name}
      </span>
    </motion.div>
  );
}
