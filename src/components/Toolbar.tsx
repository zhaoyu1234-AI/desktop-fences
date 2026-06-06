import { motion } from "framer-motion";
import { Plus, LayoutGrid, Settings, Minimize2 } from "lucide-react";

interface ToolbarProps {
  onCreateFence: () => void;
}

export function Toolbar({ onCreateFence }: ToolbarProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 pointer-events-auto"
    >
      <div className="fence-box flex items-center gap-2 px-4 py-2">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onCreateFence}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg transition-colors"
          title="新建分区"
        >
          <Plus className="w-4 h-4 text-blue-400" />
          <span className="text-sm text-white/80">新建分区</span>
        </motion.button>

        <div className="w-px h-6 bg-white/10" />

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="整理图标"
        >
          <LayoutGrid className="w-4 h-4 text-white/60" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="设置"
        >
          <Settings className="w-4 h-4 text-white/60" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          title="最小化"
        >
          <Minimize2 className="w-4 h-4 text-white/60" />
        </motion.button>
      </div>
    </motion.div>
  );
}
