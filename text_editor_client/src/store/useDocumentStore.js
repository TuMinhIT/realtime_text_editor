import { create } from "zustand";

export const useDocumentStore = create((set, get) => ({
  // Document data
  document: {
    id: "",
    title: "",
    content: "",
    sections: [],
    createdAt: null,
    updatedAt: null,
  },

  // Current user
  currentUser: {
    id: "",
    name: "",
    email: "",
  },

  // Active section
  activeSection: null,

  // Actions
  setDocument: (doc) => set({ document: doc }),

  updateDocumentTitle: (title) =>
    set((state) => ({
      document: { ...state.document, title, updatedAt: new Date().toISOString() },
    })),

  setCurrentUser: (user) => set({ currentUser: user }),

  setActiveSection: (sectionId) => set({ activeSection: sectionId }),

  addSection: (section) =>
    set((state) => ({
      document: {
        ...state.document,
        sections: [...state.document.sections, section],
      },
    })),

  updateSectionContent: (sectionId, content) =>
    set((state) => ({
      document: {
        ...state.document,
        updatedAt: new Date().toISOString(),
        sections: state.document.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                content,
                updatedAt: new Date().toISOString(),
              }
            : s,
        ),
      },
    })),

  updateSectionTitle: (sectionId, title) =>
    set((state) => ({
      document: {
        ...state.document,
        sections: state.document.sections.map((s) =>
          s.id === sectionId ? { ...s, title } : s,
        ),
      },
    })),

  assignUserToSection: (sectionId, userId, userEmail) =>
    set((state) => ({
      document: {
        ...state.document,
        sections: state.document.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                assignedUsers: [
                  ...(s.assignedUsers || []),
                  { id: userId, email: userEmail },
                ],
              }
            : s,
        ),
      },
    })),

  removeUserFromSection: (sectionId, userId) =>
    set((state) => ({
      document: {
        ...state.document,
        sections: state.document.sections.map((s) =>
          s.id === sectionId
            ? {
                ...s,
                assignedUsers: s.assignedUsers.filter((u) => u.id !== userId),
              }
            : s,
        ),
      },
    })),

  getDocument: () => get().document,
  getCurrentUser: () => get().currentUser,
  getActiveSection: () => {
    const state = get();
    return state.document.sections.find((s) => s.id === state.activeSection);
  },

  canEditSection: (sectionId) => {
    const state = get();
    const section = state.document.sections.find((s) => s.id === sectionId);
    if (!section) return false;

    if (!state.currentUser.id) {
      return true;
    }

    if (!section.assignedUsers || section.assignedUsers.length === 0) {
      return true;
    }

    const isAssigned = section.assignedUsers?.some(
      (u) => u.id === state.currentUser.id,
    );
    return isAssigned || section.isPublic;
  },
}));
