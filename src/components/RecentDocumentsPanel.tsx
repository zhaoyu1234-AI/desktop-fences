import { motion } from "framer-motion";
import { Clock, FileText, Image, Video, Music, File, X, Trash2 } from "lucide-react";
import type { RecentDocument } from "../types";

interface RecentDocumentsPanelProps {
  documents: RecentDocument[];
  onClose: () => void;
  onOpen: (path: string) => void;
}

function getFileIcon(fileType: string) {
  switch (fileType) {
    case "Word 文档":
      return <FileText className="w-4 h-4 text-blue-400" />;
    case "Excel 表格":
      return <FileText className="w-4 h-4 text-green-400" />;
    case "PPT 演示":
      return <FileText className="w-4 h-4 text-orange-400" />;
    case "PDF 文档":
      return <FileText className="w-4 h-4 text-red-400" />;
    case "图片":
      return <Image className="w-4 h-4 text-pink-400" />;
    case "视频":
      return <Video className="w-4 h-4 text-purple-400" />;
    case "音频":
      return <Music className="w-4 h-4 text-cyan-400" />;
    default:
      return <File className="w-4 h-4 text-gray-400" />;
  }
}

export function RecentDocumentsPanel({ documents, onClose, onOpen }: RecentDocumentsPanelProps) {
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
          <Clock className="w-5 h-5 text-green-400" />
          <span className="text-white font-medium">最近文档</span>
          <span className="text-white/30 text-xs">({documents.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              // TODO: 清空最近文档
            }}
            className="p-1 hover:bg-white/10 rounded"
            title="清空"
          >
            <Trash2 className="w-4 h-4 text-white/50" />
          </button>
          <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
            <X className="w-4 h-4 text-white/50" />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto p-4">
        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-white/30">
            <Clock className="w-12 h-12 mb-4" />
            <p className="text-sm">暂无最近文档</p>
            <p className="text-xs mt-1">打开文件后会自动记录</p>
          </div>
        ) : (
          <div className="space-y-1">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => onOpen(doc.path)}
                className="w-full flex items-center gap-3 p-2 rounded hover:bg-white/10 transition-colors"
              >
                {getFileIcon(doc.file_type)}
                <div className="flex-1 text-left">
                  <div className="text-white text-sm truncate">{doc.name}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-white/30">{doc.file_type}</span>
                    <span className="text-white/20">·</span>
                    <span className="text-white/30">{doc.opened_at}</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 底部提示 */}
      <div className="p-4 border-t border-white/10">
        <p className="text-white/30 text-xs text-center">
          双击打开文件 · 最多保留 20 个
        </p>
      </div>
    </motion.div>
  );
}
