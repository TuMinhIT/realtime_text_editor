// hooks/useEditor.js
import { useState, useEffect, useCallback, useRef } from "react";
import signalrService from "../services/signalrService";
import { documentAPI } from "../services/api";

export const useEditor = (sectionId, userId, token) => {
  const [content, setContent] = useState("");
  const [version, setVersion] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const contentRef = useRef(content);

  // Update ref when content changes
  useEffect(() => {
    contentRef.current = content;
  }, [content]);

  // Connect to SignalR and join section
  useEffect(() => {
    const initialize = async () => {
      try {
        setIsLoading(true);

        // Connect to SignalR
        const connected = await signalrService.connect(token);
        if (!connected) {
          setError("Failed to connect to server");
          return;
        }

        setIsConnected(true);

        // Join section
        await signalrService.joinSection(sectionId, userId);

        // Load initial content
        await loadSection();

        // Setup event listeners
        signalrService.onLoadSection((data) => {
          setContent(data.content);
          setVersion(data.version);
        });

        signalrService.onReceiveChange((change) => {
          applyRemoteChange(change);
        });

        signalrService.onUserJoined((data) => {
          setActiveUsers((prev) => [...new Set([...prev, data.userId])]);
        });

        signalrService.onUserLeft((data) => {
          setActiveUsers((prev) => prev.filter((id) => id !== data.userId));
        });

        signalrService.onError((message) => {
          setError(message);
        });
      } catch (err) {
        console.error("Error initializing editor:", err);
        setError("Failed to initialize editor");
      } finally {
        setIsLoading(false);
      }
    };

    if (sectionId && userId && token) {
      initialize();
    }

    return () => {
      if (isConnected) {
        signalrService.leaveSection(sectionId, userId);
        signalrService.offLoadSection();
        signalrService.offReceiveChange();
        signalrService.offUserJoined();
        signalrService.offUserLeft();
        signalrService.offError();
      }
    };
  }, [sectionId, userId, token]);

  const loadSection = useCallback(async () => {
    try {
      const response = await documentAPI.getSection(sectionId);
      setContent(response.data.content);
      setVersion(response.data.version);
      setError(null);
    } catch (err) {
      console.error("Error loading section:", err);
      setError("Failed to load section");
    }
  }, [sectionId]);

  const applyRemoteChange = useCallback((change) => {
    setContent((prevContent) => {
      let newContent = prevContent;

      switch (change.operationType) {
        case "insert":
          newContent =
            prevContent.slice(0, change.position) +
            change.text +
            prevContent.slice(change.position);
          break;

        case "delete":
          newContent =
            prevContent.slice(0, change.position) +
            prevContent.slice(change.position + change.length);
          break;

        case "replace":
          newContent =
            prevContent.slice(0, change.position) +
            change.text +
            prevContent.slice(change.position + change.length);
          break;

        default:
          return prevContent;
      }

      setVersion(change.version);
      return newContent;
    });
  }, []);

  const sendChange = useCallback(
    async (operationType, text, position, length) => {
      try {
        await signalrService.sendChange(
          sectionId,
          userId,
          operationType,
          text,
          position,
          length,
          version,
        );
        setError(null);
      } catch (err) {
        console.error("Error sending change:", err);
        setError("Failed to send change");
      }
    },
    [sectionId, userId, version],
  );

  const handleTextChange = useCallback(
    (newContent, changes) => {
      // Process changes from editor and send to server
      // This depends on which editor library you use (TipTap, Slate, etc.)

      if (!changes || changes.length === 0) return;

      changes.forEach((change) => {
        sendChange(
          change.type, // 'insert' or 'delete'
          change.text || "",
          change.position,
          change.length || 0,
        );
      });

      setContent(newContent);
    },
    [sendChange],
  );

  return {
    content,
    setContent,
    version,
    isConnected,
    isLoading,
    error,
    activeUsers,
    sendChange,
    handleTextChange,
    loadSection,
  };
};
