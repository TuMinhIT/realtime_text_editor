import { create } from "zustand";

export const useCollaborationStore = create((set, get) => ({
  // Active users in document
  activeUsers: [], // { id, name, email, lastSeen, editingSection }

  // Sync status
  syncStatus: "connected", // 'connected', 'syncing', 'error', 'disconnected'

  // Pending changes
  pendingChanges: [],

  // Real-time cursors
  remoteCursors: {}, // { userId: { sectionId, position, name } }

  // Actions
  addActiveUser: (user) =>
    set((state) => ({
      activeUsers: state.activeUsers.some((u) => u.id === user.id)
        ? state.activeUsers.map((u) => (u.id === user.id ? user : u))
        : [...state.activeUsers, user],
    })),

  removeActiveUser: (userId) =>
    set((state) => ({
      activeUsers: state.activeUsers.filter((u) => u.id !== userId),
    })),

  updateUserEditingSection: (userId, sectionId) =>
    set((state) => ({
      activeUsers: state.activeUsers.map((u) =>
        u.id === userId ? { ...u, editingSection: sectionId } : u,
      ),
    })),

  setSyncStatus: (status) => set({ syncStatus: status }),

  addPendingChange: (change) =>
    set((state) => ({
      pendingChanges: [...state.pendingChanges, change],
    })),

  clearPendingChanges: () => set({ pendingChanges: [] }),

  updateRemoteCursor: (userId, cursor) =>
    set((state) => ({
      remoteCursors: {
        ...state.remoteCursors,
        [userId]: cursor,
      },
    })),

  removeRemoteCursor: (userId) =>
    set((state) => {
      const { [userId]: _, ...rest } = state.remoteCursors;
      return { remoteCursors: rest };
    }),

  getActiveUsersInSection: (sectionId) => {
    const state = get();
    return state.activeUsers.filter((u) => u.editingSection === sectionId);
  },

  getSyncStatus: () => get().syncStatus,
}));
