// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
// --- FIXED: Use the new named export for the URL constant ---
import { API_BASE_URL } from "../api/apiClient";

export default function useSocket(eventName, callback) {
  const socketRef = useRef(null);

  useEffect(() => {
    // Correctly remove the trailing '/api' to connect to the server root
    const socketURL = API_BASE_URL.replace(/(\/api)?$/, "");
    socketRef.current = io(socketURL);

    // Register event listener
    if (eventName && callback) {
      socketRef.current.on(eventName, callback);
    }

    // Cleanup
    return () => {
      if (socketRef.current) {
        socketRef.current.off(eventName, callback);
        socketRef.current.disconnect();
      }
    };
  }, [eventName, callback]);

  return socketRef.current;
}