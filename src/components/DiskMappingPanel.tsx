import { motion } from "framer-motion";
import { HardDrive, FolderOpen, Home, Download, Image, Music, Video, X } from "lucide-react";
import type { DiskMapping } from "../types";

interface DiskMappingPanelProps {
  drives: DiskMapping[];
  commonDirs: DiskMapping[];
  onClose: () => void;
  onNavigate: (path: string) => void;
}

export function DiskMappingPanel({ drives, commonDirs, onClose, onNavigate }: DiskMappingPanelProps) {
  return (
    <motion.div
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed right-0 top-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-xl border-l border-white/10 z-50 flex flex-col"
    >
      {/* 标题栏 */}
      <div className="flex items-center justify-between p-4 border-b border-white/10">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-blue-400" />
          <span className="text-white font-medium">磁盘映射</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
          <X className="w-4 h-4 text-white/50" />
        </button>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* 常用目录 */}
        <div>
          <h3 className="text-white/50 text-xs font-medium mb-3 uppercase">常用目录</h3>
          <div className="space-y-1">
            {commonDirs.map((dir) => (
              <button
                key={dir.id}
                onClick={() => onNavigate(dir.path)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
              >
                <span className="text-lg">{dir.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white text-sm">{dir.name}</div>
                  <div className="text-white/30 text-xs truncate">{dir.path}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* 磁盘驱动器 */}
        <div>
          <h3 className="text-white/50 text-xs font-medium mb-3 uppercase">磁盘驱动器</h3>
          <div className="space-y-1">
            {drives.map((drive) => (
              <button
                key={drive.id}
                onClick={() => onNavigate(drive.path)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
              >
                <span className="text-lg">{drive.icon}</span>
                <div className="flex-1 text-left">
                  <div className="text-white text-sm">{drive.name}</div>
                  <div className="text-white/30 text-xs">{drive.path}</div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">
          点击目录可直接打开资源管理器
        </p>
      </div>
    </motion.div>
  );
}
