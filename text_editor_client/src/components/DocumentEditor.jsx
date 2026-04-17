import React, { useEffect, useState } from "react";
import { useDocumentStore } from "../store/useDocumentStore";
import { useCollaborationStore } from "../store/useCollaborationStore";
import { realtimeSyncService } from "../services/realtimeSyncService";
import DocumentHeader from "./DocumentHeader";
import SectionPanel from "./SectionPanel";
import SectionEditor from "./SectionEditor";
import UserPresence from "./UserPresence";
import SyncStatus from "./SyncStatus";

const DocumentEditor = ({ documentId }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const {
    document,
    setDocument,
    setCurrentUser,
    activeSection,
    setActiveSection,
  } = useDocumentStore();

  const { syncStatus } = useCollaborationStore();

  // Initialize document and connection
  useEffect(() => {
    const initializeEditor = async () => {
      try {
        // Simulate loading document
        const mockDocument = {
          id: documentId,
          title: "Collaborative Document",
          content: "",
          sections: [
            {
              id: "section-1",
              title: "1. Introduction",
              number: "1",
              content: "This is the introduction section.",
              assignedUsers: [],
              isPublic: true,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "section-1.1",
              title: "1.1 Background",
              number: "1.1",
              content: "Background information goes here.",
              assignedUsers: [],
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "section-1.2",
              title: "1.2 Objectives",
              number: "1.2",
              content: "Objectives section content.",
              assignedUsers: [],
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: "section-2",
              title: "2. Main Content",
              number: "2",
              content: "Main content section.",
              assignedUsers: [],
              isPublic: false,
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Set mock current user
        const mockUser = {
          id: "user-001",
          name: "John Doe",
          email: "john@example.com",
        };

        setDocument(mockDocument);
        setCurrentUser(mockUser);

        // Connect to real-time sync
        await realtimeSyncService.connect(
          documentId,
          mockUser.id,
          "mock-token",
        );

        // Set first section as active
        if (mockDocument.sections.length > 0) {
          setActiveSection(mockDocument.sections[0].id);
        }

        setLoading(false);
      } catch (err) {
        console.error("Error initializing editor:", err);
        setError("Failed to load document");
        setLoading(false);
      }
    };

    initializeEditor();

    // Cleanup
    return () => {
      realtimeSyncService.disconnect();
    };
  }, [documentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="loading loading-spinner loading-lg"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-base-100">
        <div className="alert alert-error">
          <span>{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-base-100">
      {/* Sidebar - Section Panel */}
      <aside className="w-64 border-r border-base-300 overflow-y-auto bg-base-200">
        <SectionPanel />
      </aside>

      {/* Main Editor Area */}
      <main className="flex-1 flex flex-col">
        {/* Header */}
        <header className="border-b border-base-300 bg-base-100 shadow-sm">
          <DocumentHeader />
        </header>

        {/* Sync Status */}
        <div className="px-4 py-2 bg-base-100 border-b border-base-300">
          <SyncStatus />
        </div>

        {/* Editor Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Editor */}
          <section className="flex-1 overflow-y-auto">
            {activeSection ? (
              <SectionEditor />
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-base-content/50">Select a section to edit</p>
              </div>
            )}
          </section>

          {/* User Presence Sidebar */}
          <aside className="w-72 border-l border-base-300 bg-base-200 overflow-y-auto">
            <UserPresence />
          </aside>
        </div>
      </main>
    </div>
  );
};

export default DocumentEditor;
