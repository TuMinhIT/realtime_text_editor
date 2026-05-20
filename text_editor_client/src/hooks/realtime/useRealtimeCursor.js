import { useState, useCallback } from "react";
import { sessionService } from "../../services/sessionService";

export default function useRealtimeCursor() {
  const [remoteCursors, setRemoteCursors] = useState({});

  const onCursor = useCallback((data) => {
    const currentUserId =
      sessionService.getCurrentUser()?.id;

    // bỏ qua cursor của chính mình
    if (data.userId === currentUserId) {
      return;
    }

    setRemoteCursors((prev) => ({
      ...prev,
      [data.userId]: data,
    }));
  }, []);

  const clearRemoteCursors = useCallback(() => {
    setRemoteCursors({});
  }, []);

  return {
    remoteCursors,
    onCursor,
    clearRemoteCursors,
  };
}