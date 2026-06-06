import { useState, useRef, useEffect } from "react";
import { useDroppable } from "@dnd-kit/core";
import { motion } from "framer-motion";
import { GripVertical, X, Settings } from "lucide-react";
import { useStore } from "../store";
import { IconItem } from "./IconItem";
import type { DesktopIcon, Fence } from "../types";

interface FenceBoxProps {
  fence: Fence;
  icons: DesktopIcon[];
}

export function FenceBox({ fence, icons }: FenceBoxProps) {
  const { updateFence, deleteFence, setContextMenu } = useStore();
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(fence.name);
  const dragRef = useRef<{ startX: number; startY: number; startFenceX: number; startFenceY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: `fence-${fence.id}`,
  });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startFenceX: fence.x,
      startFenceY: fence.y,
    };
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: fence.width,
      startHeight: fence.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const dx = e.clientX - dragRef.current.startX;
        const dy = e.clientY - dragRef.current.startY;
        updateFence(fence.id, {
          x: dragRef.current.startFenceX + dx,
          y: dragRef.current.startFenceY + dy,
        });
      }
      if (isResizing && resizeRef.current) {
        const dx = e.clientX - resizeRef.current.startX;
        const dy = e.clientY - resizeRef.current.startY;
        updateFence(fence.id, {
          width: Math.max(200, resizeRef.current.startWidth + dx),
          height: Math.max(150, resizeRef.current.startHeight + dy),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      dragRef.current = null;
      resizeRef.current = null;
    };

    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, fence.id]);

  const handleNameSubmit = () => {
    setIsEditing(false);
    if (editName !== fence.name) {
      updateFence(fence.id, { name: editName });
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY, fenceId: fence.id });
  };

  const columns = fence.columns || 4;
  const gridTemplateColumns = `repeat(${columns}, 1fr)`;

  return (
    <motion.div
      ref={setNodeRef}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className={`fence-box absolute ${isOver ? "drop-target" : ""}`}
      style={{
        left: fence.x,
        top: fence.y,
        width: fence.width,
        height: fence.height,
      }}
      onContextMenu={handleContextMenu}
    >
      {/* 标题栏 */}
      <div
        className="fence-title flex items-center justify-between cursor-move"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <GripVertical className="w-4 h-4 text-white/50" />
          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleNameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
              className="bg-transparent border-b border-white/30 text-white text-sm px-1 py-0.5 w-24 focus:outline-none"
              autoFocus
            />
          ) : (
            <span onDoubleClick={() => setIsEditing(true)}>{fence.name}</span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsEditing(true)}
            className="p-1 hover:bg-white/10 rounded"
          >
            <Settings className="w-3 h-3 text-white/50" />
          </button>
          <button
            onClick={() => deleteFence(fence.id)}
            className="p-1 hover:bg-red-500/20 rounded"
          >
            <X className="w-3 h-3 text-white/50" />
          </button>
        </div>
      </div>

      {/* 图标内容区 */}
      <div
        className="fence-content overflow-auto"
        style={{
          height: `calc(100% - 45px)`,
          gridTemplateColumns,
        }}
      >
        {icons.map((icon) => (
          <IconItem key={icon.id} icon={icon} />
        ))}

        {icons.length === 0 && (
          <div className="col-span-full flex items-center justify-center h-32 text-white/30 text-sm">
            拖拽图标到此处
          </div>
        )}
      </div>

      {/* 调整大小手柄 */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        onMouseDown={handleResizeMouseDown}
      >
        <svg
          viewBox="0 0 16 16"
          className="w-4 h-4 text-white/30"
        >
          <path
            d="M14 16L16 14M10 16L16 10M6 16L16 6"
            stroke="currentColor"
            strokeWidth="1"
          />
        </svg>
      </div>
    </motion.div>
  );
}
