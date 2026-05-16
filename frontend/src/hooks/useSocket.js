// src/hooks/useSocket.js
import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { API_SERVER_URL } from "../api/apiClient";

export default function useSocket(eventName, callback) {
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(API_SERVER_URL, { withCredentials: true });

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

  return socketRef;
}
