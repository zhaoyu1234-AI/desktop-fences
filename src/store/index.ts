import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import type { DesktopIcon, Fence, Position } from "../types";

interface AppState {
  icons: DesktopIcon[];
  fences: Fence[];
  isLoading: boolean;
  contextMenu: { x: number; y: number; iconId?: string; fenceId?: string } | null;

  // Actions
  loadIcons: () => Promise<void>;
  loadFences: () => Promise<void>;
  createFence: (name: string, x: number, y: number, width: number, height: number) => Promise<void>;
  updateFence: (id: string, updates: Partial<Fence>) => Promise<void>;
  deleteFence: (id: string) => Promise<void>;
  moveIconToFence: (iconId: string, fenceId: string, position: Position) => Promise<void>;
  removeIconFromFence: (iconId: string) => Promise<void>;
  launchIcon: (path: string) => Promise<void>;
  setContextMenu: (menu: { x: number; y: number; iconId?: string; fenceId?: string } | null) => void;
}

export const useStore = create<AppState>((set, get) => ({
  icons: [],
  fences: [],
  isLoading: true,
  contextMenu: null,

  loadIcons: async () => {
    try {
      const icons = await invoke<DesktopIcon[]>("scan_desktop_icons");
      set({ icons });
    } catch (error) {
      console.error("Failed to load icons:", error);
    }
  },

  loadFences: async () => {
    try {
      const fences = await invoke<Fence[]>("get_fences");
      set({ fences, isLoading: false });
    } catch (error) {
      console.error("Failed to load fences:", error);
      set({ isLoading: false });
    }
  },

  createFence: async (name, x, y, width, height) => {
    try {
      const fence = await invoke<Fence>("create_fence", { name, x, y, width, height });
      set((state) => ({ fences: [...state.fences, fence] }));
    } catch (error) {
      console.error("Failed to create fence:", error);
    }
  },

  updateFence: async (id, updates) => {
    try {
      await invoke("update_fence", {
        id,
        name: updates.name,
        x: updates.x,
        y: updates.y,
        width: updates.width,
        height: updates.height,
      });
      set((state) => ({
        fences: state.fences.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      }));
    } catch (error) {
      console.error("Failed to update fence:", error);
    }
  },

  deleteFence: async (id) => {
    try {
      await invoke("delete_fence", { id });
      set((state) => ({
        fences: state.fences.filter((f) => f.id !== id),
        icons: state.icons.map((i) => (i.fence_id === id ? { ...i, fence_id: null } : i)),
      }));
    } catch (error) {
      console.error("Failed to delete fence:", error);
    }
  },

  moveIconToFence: async (iconId, fenceId, position) => {
    try {
      await invoke("move_icon_to_fence", { iconId, fenceId, position });
      set((state) => ({
        icons: state.icons.map((i) =>
          i.id === iconId ? { ...i, fence_id: fenceId, position } : i
        ),
      }));
    } catch (error) {
      console.error("Failed to move icon:", error);
    }
  },

  removeIconFromFence: async (iconId) => {
    try {
      await invoke("remove_icon_from_fence", { iconId });
      set((state) => ({
        icons: state.icons.map((i) =>
          i.id === iconId ? { ...i, fence_id: null, position: null } : i
        ),
      }));
    } catch (error) {
      console.error("Failed to remove icon:", error);
    }
  },

  launchIcon: async (path) => {
    try {
      await invoke("launch_icon", { path });
    } catch (error) {
      console.error("Failed to launch icon:", error);
    }
  },

  setContextMenu: (menu) => set({ contextMenu: menu }),
}));
