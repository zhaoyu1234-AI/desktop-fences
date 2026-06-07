import { motion } from "framer-motion";
import { Plus, FolderOpen, FileText, Wand2, Image, Settings, LogOut, Search, Clock, Lock } from "lucide-react";

interface ContextMenuProps {
  x: number;
  y: number;
  fenceId?: string;
  onCreateFence: () => void;
  onDeleteFence: (id: string) => void;
}

export function ContextMenu({ x, y, fenceId, onCreateFence, onDeleteFence }: ContextMenuProps) {
  const menuStyle = {
    left: Math.min(x, window.innerWidth - 240),
    top: Math.min(y, window.innerHeight - 400),
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="context-menu"
      style={menuStyle}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="context-menu-item" onClick={onCreateFence}>
        <Plus className="context-menu-icon" />
        新建格子
      </div>
      <div className="context-menu-item">
        <FolderOpen className="context-menu-icon" />
        新建文件夹映射格子
      </div>
      <div className="context-menu-item">
        <Clock className="context-menu-icon" />
        开启最近文档
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item">
        <Wand2 className="context-menu-icon" />
        一键整理桌面
      </div>
      <div className="context-menu-item">
        <Image className="context-menu-icon" />
        壁纸中心
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item">
        <Search className="context-menu-icon" />
        显示搜索按钮
      </div>
      <div className="context-menu-item">
        <Lock className="context-menu-icon" />
        锁定格子位置
      </div>
      <div className="context-menu-divider" />
      <div className="context-menu-item">
        <Settings className="context-menu-icon" />
        桌面设置
      </div>
      <div className="context-menu-item" onClick={() => window.close()}>
        <LogOut className="context-menu-icon" />
        退出桌面整理
      </div>
    </motion.div>
  );
}
