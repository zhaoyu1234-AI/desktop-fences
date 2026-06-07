import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { ChevronDown, ChevronUp, Filter, MoreHorizontal, X, AppWindow, File } from "lucide-react";
import type { DesktopIcon, Fence } from "../types";

interface FenceBoxProps {
  fence: Fence;
  icons: DesktopIcon[];
  onUpdate: (id: string, updates: Partial<Fence>) => void;
  onDelete: (id: string) => void;
  onLaunch: (path: string) => void;
}

export function FenceBox({ fence, icons, onUpdate, onDelete, onLaunch }: FenceBoxProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(fence.name);
  const [isDragging, setIsDragging] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const dragRef = useRef<{ startX: number; startY: number; startFenceX: number; startFenceY: number } | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `fence-${fence.id}`,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0 || isEditing) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startFenceX: fence.x,
      startFenceY: fence.y,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        onUpdate(fence.id, {
          x: dragRef.current.startFenceX + dx,
          y: dragRef.current.startFenceY + dy,
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      dragRef.current = null;
    };

    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, fence.id]);

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (editName !== fence.name) {
      onUpdate(fence.id, { name: editName });
    }
  };

  return (
    <motion.div
      ref={setNodeRef}
      className={`fence-box ${isOver ? "drag-over" : ""} ${isDragging ? "dragging" : ""}`}
      style={{ position: "absolute", left: fence.x, top: fence.y, width: fence.width }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
    >
      {/* 标题栏 */}
      <div className="fence-titlebar" onMouseDown={handleMouseDown}>
        {isEditing ? (
          <input
            type="text"
            className="fence-title-input"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            onBlur={handleNameSubmit}
            onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
            autoFocus
          />
        ) : (
          <span className="fence-title" onDoubleClick={() => setIsEditing(true)}>
            {fence.name}
          </span>
        )}

        <div className="fence-actions">
          <button
            className="fence-action-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            title={isCollapsed ? "展开" : "收起"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
          <button className="fence-action-btn" title="筛选">
            <Filter className="w-4 h-4" />
          </button>
          <div className="relative">
            <button
              className="fence-action-btn"
              onClick={() => setShowMenu(!showMenu)}
              title="更多"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
            {showMenu && (
              <div className="context-menu" style={{ position: "absolute", right: 0, top: "100%" }}>
                <div className="context-menu-item" onClick={() => { setIsEditing(true); setShowMenu(false); }}>
                  重命名格子
                </div>
                <div className="context-menu-item" onClick={() => { onDelete(fence.id); setShowMenu(false); }}>
                  解散格子
                </div>
                <div className="context-menu-divider" />
                <div className="context-menu-item" onClick={() => setShowMenu(false)}>
                  设置格子透明
                </div>
                <div className="context-menu-item" onClick={() => setShowMenu(false)}>
                  自动排序
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 内容区 */}
      <div className={`fence-content ${isCollapsed ? "collapsed" : ""}`}>
        {icons.length === 0 ? (
          <div className="col-span-4 flex items-center justify-center h-24 text-white/30 text-sm">
            拖拽文件到此处
          </div>
        ) : (
          icons.map((icon) => (
            <motion.div
              key={icon.id}
              className="icon-item"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onDoubleClick={() => onLaunch(icon.target_path || icon.path)}
            >
              {icon.is_shortcut ? (
                <AppWindow className="w-10 h-10 text-blue-400" />
              ) : (
                <File className="w-10 h-10 text-gray-400" />
              )}
              <span className="icon-name">{icon.name}</span>
            </motion.div>
          ))
        )}
      </div>
    </motion.div>
  );
}
