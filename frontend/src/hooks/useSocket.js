import { createContext, createElement, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { API_SERVER_URL } from "../api/apiClient";
import { useAuth } from "../contexts/AuthContext";

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const { user } = useAuth();
  const userId = user?.id;
  const userRole = user?.role;

  useEffect(() => {
    if (!userId) {
      setSocket(null);
      return undefined;
    }

    const nextSocket = io(API_SERVER_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
    });
    setSocket(nextSocket);

    return () => {
      nextSocket.disconnect();
    };
  }, [userId, userRole]);

  return createElement(SocketContext.Provider, { value: socket }, children);
}

export default function useSocket(eventName, callback) {
  const socket = useContext(SocketContext);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!socket || !eventName) return undefined;

    const handler = (payload) => {
      callbackRef.current?.(payload);
    };

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [socket, eventName]);

  return socket;
}
