import { useEffect, useState } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Cloud, MessageSquare, Plus, FolderOpen, FileText, Image, Video,
  Archive, Music, File, AppWindow, HardDrive, Clock, Wand2, Monitor,
  ChevronDown, ChevronRight
} from "lucide-react";
import { FenceBox } from "./components/FenceBox";
import { ContextMenu } from "./components/ContextMenu";
import { DiskMappingPanel } from "./components/DiskMappingPanel";
import { RecentDocumentsPanel } from "./components/RecentDocumentsPanel";
import type { DesktopIcon, Fence, DiskMapping, RecentDocument } from "./types";

function App() {
  const [icons, setIcons] = useState<DesktopIcon[]>([]);
  const [fences, setFences] = useState<Fence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fenceId?: string } | null>(null);
  const [activeIcon, setActiveIcon] = useState<DesktopIcon | null>(null);
  const [showDiskMapping, setShowDiskMapping] = useState(false);
  const [showRecentDocs, setShowRecentDocs] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // 磁盘和常用目录
  const [drives, setDrives] = useState<DiskMapping[]>([]);
  const [commonDirs, setCommonDirs] = useState<DiskMapping[]>([]);
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [desktopIcons, desktopFences, systemDrives, commonDirectories] = await Promise.all([
        invoke<DesktopIcon[]>("scan_desktop_icons"),
        invoke<Fence[]>("get_fences"),
        invoke<DiskMapping[]>("get_system_drives"),
        invoke<DiskMapping[]>("get_common_directories"),
      ]);

      setIcons(desktopIcons);
      setDrives(systemDrives);
      setCommonDirs(commonDirectories);

      // 如果没有分区，自动分类整理
      if (desktopFences.length === 0) {
        await autoOrganize();
      } else {
        setFences(desktopFences);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function autoOrganize() {
    try {
      const organizedFences = await invoke<Fence[]>("auto_organize_desktop");
      setFences(organizedFences);
    } catch (error) {
      console.error("Failed to auto organize:", error);
    }
  }

  const handleDragStart = (event: any) => {
    const icon = icons.find((i) => i.id === event.active.id);
    setActiveIcon(icon || null);
  };

  const handleDragEnd = async (event: any) => {
    const { active, over } = event;
    setActiveIcon(null);

    if (over && over.id.startsWith("fence-")) {
      const fenceId = over.id.replace("fence-", "");
      try {
        await invoke("move_icon_to_fence", {
          iconId: active.id,
          fenceId,
          position: { x: 0, y: 0 },
        });
        setIcons((prev) =>
          prev.map((i) => (i.id === active.id ? { ...i, fence_id: fenceId } : i))
        );
      } catch (error) {
        console.error("Failed to move icon:", error);
      }
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFence = async () => {
    try {
      const fence = await invoke<Fence>("create_fence", {
        name: "新分区",
        x: 100,
        y: 100,
        width: 350,
        height: 400,
      });
      setFences((prev) => [...prev, fence]);
    } catch (error) {
      console.error("Failed to create fence:", error);
    }
  };

  const handleDeleteFence = async (id: string) => {
    try {
      await invoke("delete_fence", { id });
      setFences((prev) => prev.filter((f) => f.id !== id));
      setIcons((prev) => prev.map((i) => (i.fence_id === id ? { ...i, fence_id: null } : i)));
    } catch (error) {
      console.error("Failed to delete fence:", error);
    }
  };

  const handleUpdateFence = async (id: string, updates: Partial<Fence>) => {
    try {
      await invoke("update_fence", {
        id,
        name: updates.name,
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
      });
      setFences((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)));
    } catch (error) {
      console.error("Failed to update fence:", error);
    }
  };

  const handleLaunchIcon = async (path: string) => {
    try {
      await invoke("launch_icon", { path });
    } catch (error) {
      console.error("Failed to launch icon:", error);
    }
  };

  const filteredIcons = searchQuery
    ? icons.filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #2d1b69 0%, #1e1e26 50%, #0f3460 100%)" }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-white/20 border-t-white/80 rounded-full"
        />
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex h-screen" onContextMenu={handleContextMenu} onClick={() => setContextMenu(null)}>
        {/* 左侧边栏 */}
        <motion.div
          className="sidebar flex flex-col"
          animate={{ width: sidebarCollapsed ? 60 : 200 }}
          transition={{ duration: 0.2 }}
        >
          {/* 标题栏 */}
          <div className="sidebar-title flex items-center justify-between">
            {!sidebarCollapsed && <span>桌面整理</span>}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-1 hover:bg-white/10 rounded"
            >
              {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* 常用软件 */}
          <div className="flex-1 overflow-y-auto">
            {!sidebarCollapsed && (
              <div className="sidebar-icons">
                {icons.slice(0, 16).map((icon) => (
                  <motion.div
                    key={icon.id}
                    className="icon-item"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onDoubleClick={() => handleLaunchIcon(icon.target_path || icon.path)}
                    title={icon.name}
                  >
                    {icon.is_shortcut ? (
                      <AppWindow className="w-8 h-8 text-blue-400" />
                    ) : (
                      <File className="w-8 h-8 text-gray-400" />
                    )}
                    <span className="icon-name">{icon.name}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 底部功能按钮 */}
          <div className="p-2 space-y-1">
            <button
              onClick={() => setShowDiskMapping(!showDiskMapping)}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10 text-white/70 text-sm"
              title="磁盘映射"
            >
              <HardDrive className="w-4 h-4" />
              {!sidebarCollapsed && <span>磁盘映射</span>}
            </button>
            <button
              onClick={() => setShowRecentDocs(!showRecentDocs)}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10 text-white/70 text-sm"
              title="最近文档"
            >
              <Clock className="w-4 h-4" />
              {!sidebarCollapsed && <span>最近文档</span>}
            </button>
            <button
              onClick={autoOrganize}
              className="w-full flex items-center gap-2 p-2 rounded hover:bg-white/10 text-white/70 text-sm"
              title="一键整理"
            >
              <Wand2 className="w-4 h-4" />
              {!sidebarCollapsed && <span>一键整理</span>}
            </button>
          </div>
        </motion.div>

        {/* 主内容区 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 顶部工具栏 */}
          <div className="top-right-bar">
            <button className="top-right-btn" onClick={() => setShowSearch(true)}>
              <Search className="w-5 h-5" />
            </button>
            <button className="top-right-btn">
              <Cloud className="w-5 h-5" />
            </button>
            <button className="top-right-btn">
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>

          {/* 分区内容区 */}
          <div className="flex-1 p-6 overflow-auto">
            <div className="flex flex-wrap gap-4">
              {fences.map((fence) => (
                <FenceBox
                  key={fence.id}
                  fence={fence}
                  icons={icons.filter((i) => i.fence_id === fence.id)}
                  onUpdate={handleUpdateFence}
                  onDelete={handleDeleteFence}
                  onLaunch={handleLaunchIcon}
                />
              ))}

              {/* 新建分区按钮 */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleCreateFence}
                className="fence-box flex items-center justify-center min-h-[200px] cursor-pointer border-dashed opacity-50 hover:opacity-100 transition-opacity"
                style={{ minWidth: 280 }}
              >
                <div className="flex flex-col items-center gap-2 text-white/50">
                  <Plus className="w-8 h-8" />
                  <span className="text-sm">新建分区</span>
                </div>
              </motion.button>
            </div>
          </div>
        </div>

        {/* 磁盘映射面板 */}
        <AnimatePresence>
          {showDiskMapping && (
            <DiskMappingPanel
              drives={drives}
              commonDirs={commonDirs}
              onClose={() => setShowDiskMapping(false)}
              onNavigate={handleLaunchIcon}
            />
          )}
        </AnimatePresence>

        {/* 最近文档面板 */}
        <AnimatePresence>
          {showRecentDocs && (
            <RecentDocumentsPanel
              documents={recentDocs}
              onClose={() => setShowRecentDocs(false)}
              onOpen={handleLaunchIcon}
            />
          )}
        </AnimatePresence>

        {/* 搜索框 */}
        <AnimatePresence>
          {showSearch && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="search-overlay"
              onClick={() => setShowSearch(false)}
            >
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="search-box"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="search-input-wrapper">
                  <Search className="w-5 h-5 text-white/50" />
                  <input
                    type="text"
                    className="search-input"
                    placeholder="搜索本地文件/程序"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    autoFocus
                  />
                </div>
                {searchQuery && (
                  <div className="search-results">
                    {filteredIcons.slice(0, 10).map((icon) => (
                      <div
                        key={icon.id}
                        className="search-result-item"
                        onClick={() => {
                          handleLaunchIcon(icon.target_path || icon.path);
                          setShowSearch(false);
                        }}
                      >
                        {icon.is_shortcut ? (
                          <AppWindow className="search-result-icon text-blue-400" />
                        ) : (
                          <File className="search-result-icon text-gray-400" />
                        )}
                        <div className="search-result-info">
                          <div className="search-result-name">{icon.name}</div>
                          <div className="search-result-path">{icon.path}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 右键菜单 */}
        <AnimatePresence>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              fenceId={contextMenu.fenceId}
              onCreateFence={handleCreateFence}
              onDeleteFence={handleDeleteFence}
              onAutoOrganize={autoOrganize}
            />
          )}
        </AnimatePresence>

        {/* 拖拽预览 */}
        <DragOverlay>
          {activeIcon && (
            <div className="fence-box p-4 opacity-80">
              <div className="icon-item">
                {activeIcon.is_shortcut ? (
                  <AppWindow className="w-12 h-12 text-blue-400" />
                ) : (
                  <File className="w-12 h-12 text-gray-400" />
                )}
                <span className="icon-name">{activeIcon.name}</span>
              </div>
            </div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
