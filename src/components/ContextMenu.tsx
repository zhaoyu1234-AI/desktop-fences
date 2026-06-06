import { motion } from "framer-motion";
import { Trash2, FolderOpen, Copy, Scissors, RefreshCw } from "lucide-react";
import { useStore } from "../store";

interface ContextMenuProps {
  x: number;
  y: number;
  iconId?: string;
  fenceId?: string;
}

export function ContextMenu({ x, y, iconId, fenceId }: ContextMenuProps) {
  const { removeIconFromFence, deleteFence, loadIcons, setContextMenu } = useStore();

  const handleAction = (action: string) => {
    setContextMenu(null);

    switch (action) {
      case "remove-icon":
        if (iconId) removeIconFromFence(iconId);
        break;
      case "delete-fence":
        if (fenceId) deleteFence(fenceId);
        break;
      case "refresh":
        loadIcons();
        break;
    }
  };

  // 确保菜单不超出屏幕
  const menuStyle = {
    left: Math.min(x, window.innerWidth - 200),
    top: Math.min(y, window.innerHeight - 300),
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
      {iconId && (
        <>
          <div className="context-menu-item" onClick={() => handleAction("open")}>
            <FolderOpen className="w-4 h-4 inline mr-2" />
            打开
          </div>
          <div className="context-menu-item" onClick={() => handleAction("copy")}>
            <Copy className="w-4 h-4 inline mr-2" />
            复制
          </div>
          <div className="context-menu-item" onClick={() => handleAction("cut")}>
            <Scissors className="w-4 h-4 inline mr-2" />
            剪切
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleAction("remove-icon")}>
            <Trash2 className="w-4 h-4 inline mr-2" />
            从分区移除
          </div>
        </>
      )}

      {fenceId && !iconId && (
        <>
          <div className="context-menu-item" onClick={() => handleAction("rename")}>
            重命名分区
          </div>
          <div className="context-menu-item" onClick={() => handleAction("settings")}>
            分区设置
          </div>
          <div className="context-menu-divider" />
          <div className="context-menu-item" onClick={() => handleAction("delete-fence")}>
            <Trash2 className="w-4 h-4 inline mr-2" />
            删除分区
          </div>
        </>
      )}

      {!iconId && !fenceId && (
        <>
          <div className="context-menu-item" onClick={() => handleAction("refresh")}>
            <RefreshCw className="w-4 h-4 inline mr-2" />
            刷新图标
          </div>
          <div className="context-menu-item" onClick={() => handleAction("new-fence")}>
            新建分区
          </div>
        </>
      )}
    </motion.div>
  );
}
