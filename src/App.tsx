import { useEffect, useState } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { invoke } from "@tauri-apps/api/core";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Cloud, MessageSquare, Plus, FolderOpen, FileText, Image, Video, Archive, Music, File, AppWindow } from "lucide-react";
import { FenceBox } from "./components/FenceBox";
import { ContextMenu } from "./components/ContextMenu";
import type { DesktopIcon, Fence } from "./types";

function App() {
  const [icons, setIcons] = useState<DesktopIcon[]>([]);
  const [fences, setFences] = useState<Fence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; fenceId?: string } | null>(null);
  const [activeIcon, setActiveIcon] = useState<DesktopIcon | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  useEffect(() => {
    loadData();
    // 将窗口嵌入桌面
    invoke("set_window_as_desktop").catch(console.error);
  }, []);

  async function loadData() {
    try {
      const [desktopIcons, desktopFences] = await Promise.all([
        invoke<DesktopIcon[]>("scan_desktop_icons"),
        invoke<Fence[]>("get_fences"),
      ]);
      setIcons(desktopIcons);

      // 如果没有分区，创建默认分区
      if (desktopFences.length === 0) {
        await createDefaultFences();
      } else {
        setFences(desktopFences);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  async function createDefaultFences() {
    try {
      const [fence1, fence2, fence3] = await Promise.all([
        invoke<Fence>("create_fence", { name: "最近文档", x: 220, y: 20, width: 350, height: 400 }),
        invoke<Fence>("create_fence", { name: "文件夹", x: 590, y: 20, width: 350, height: 400 }),
        invoke<Fence>("create_fence", { name: "文件", x: 220, y: 440, width: 350, height: 400 }),
      ]);
      setFences([fence1, fence2, fence3]);
    } catch (error) {
      console.error("Failed to create default fences:", error);
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
        <div className="text-white/50">加载中...</div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex" onContextMenu={handleContextMenu} onClick={() => setContextMenu(null)}>
        {/* 左侧常用软件栏 */}
        <div className="sidebar">
          <div className="sidebar-title">常用软件</div>
          <div className="sidebar-icons">
            {icons.slice(0, 20).map((icon) => (
              <motion.div
                key={icon.id}
                className="icon-item"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onDoubleClick={() => handleLaunchIcon(icon.target_path || icon.path)}
              >
                {icon.is_shortcut ? (
                  <AppWindow className="w-10 h-10 text-blue-400" />
                ) : (
                  <File className="w-10 h-10 text-gray-400" />
                )}
                <span className="icon-name">{icon.name}</span>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 主内容区 */}
        <div className="main-content">
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
          >
            <div className="flex flex-col items-center gap-2 text-white/50">
              <Plus className="w-8 h-8" />
              <span className="text-sm">新建分区</span>
            </div>
          </motion.button>
        </div>

        {/* 右上角功能区 */}
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
