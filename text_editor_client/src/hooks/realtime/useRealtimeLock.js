import { useState, useCallback } from "react";
import { signalRService } from "../../services/signalRService";
import { sessionService } from "../../services/sessionService";

export default function useRealtimeLock(sectionId) {
    const [lockState, setLockState] = useState(null);

    const [hasLockRequested, setHasLockRequested] = useState(false);
    //callback for lock state change
    const onLock = useCallback((data) => {
        setLockState(data);
    }, []);

    return {lockState, onLock, hasLockRequested, setHasLockRequested, setLockState};

}