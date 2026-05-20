import {useState, useCallback} from "react";
import { signalRService } from "../../services/signalRService";

export  default function useRealtimePresence() {
    const [presence, setPresence] = useState(null);
    const onPresence = useCallback((data) => {
        setPresence(data);
    }, []);

    return [presence,onPresence]
    
}