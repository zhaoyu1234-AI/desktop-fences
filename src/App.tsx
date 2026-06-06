import { useEffect, useState } from "react";
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor } from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "./store";
import { FenceBox } from "./components/FenceBox";
import { IconItem } from "./components/IconItem";
import { ContextMenu } from "./components/ContextMenu";
import { Toolbar } from "./components/Toolbar";
import type { DesktopIcon } from "./types";

function App() {
  const {
    icons,
    fences,
    isLoading,
    contextMenu,
    loadIcons,
    loadFences,
    createFence,
    moveIconToFence,
    setContextMenu,
  } = useStore();

  const [activeIcon, setActiveIcon] = useState<DesktopIcon | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    loadIcons();
    loadFences();
  }, []);

  const handleDragStart = (event: any) => {
    const icon = icons.find((i) => i.id === event.active.id);
    setActiveIcon(icon || null);
  };

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    setActiveIcon(null);

    if (over && over.id.startsWith("fence-")) {
      const fenceId = over.id.replace("fence-", "");
      const rect = over.rect;
      const position = {
        x: event.activatorEvent.clientX - rect.left,
        y: event.activatorEvent.clientY - rect.top,
      };
      moveIconToFence(active.id, fenceId, position);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCreateFence = async () => {
    await createFence("新分区", 100, 100, 300, 400);
  };

  if (isLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center">
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
      <div
        className="w-screen h-screen"
        onContextMenu={handleContextMenu}
        onClick={() => setContextMenu(null)}
      >
        {/* 分区框 */}
        <AnimatePresence>
          {fences.map((fence) => (
            <FenceBox
              key={fence.id}
              fence={fence}
              icons={icons.filter((i) => i.fence_id === fence.id)}
            />
          ))}
        </AnimatePresence>

        {/* 工具栏 */}
        <Toolbar onCreateFence={handleCreateFence} />

        {/* 右键菜单 */}
        <AnimatePresence>
          {contextMenu && (
            <ContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              iconId={contextMenu.iconId}
              fenceId={contextMenu.fenceId}
            />
          )}
        </AnimatePresence>

        {/* 拖拽预览 */}
        <DragOverlay>
          {activeIcon && (
            <motion.div
              initial={{ scale: 1 }}
              animate={{ scale: 1.1, opacity: 0.8 }}
              className="fence-box p-4"
            >
              <IconItem icon={activeIcon} />
            </motion.div>
          )}
        </DragOverlay>
      </div>
    </DndContext>
  );
}

export default App;
