"use client";

import { create } from "zustand";

export const useShellStore = create((set) => ({
  sidebarOpen: false,
  profileMenuOpen: false,
  activeSidebarPanel: "",
  headerHidden: false,

  toggleSidebar() {
    set((current) => ({
      sidebarOpen: !current.sidebarOpen,
      profileMenuOpen: false,
    }));
  },

  toggleProfileMenu() {
    set((current) => ({
      profileMenuOpen: !current.profileMenuOpen,
      sidebarOpen: false,
      activeSidebarPanel: "",
    }));
  },

  toggleSidebarPanel(panelId) {
    set((current) => ({
      activeSidebarPanel: current.activeSidebarPanel === panelId ? "" : panelId,
    }));
  },

  closePanels() {
    set({
      sidebarOpen: false,
      profileMenuOpen: false,
      activeSidebarPanel: "",
    });
  },

  setHeaderHidden(hidden) {
    set({ headerHidden: hidden });
  },
}));
