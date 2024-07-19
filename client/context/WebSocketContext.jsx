import React, { createContext, useContext, useEffect, useState } from "react";

const WebSocketContext = createContext(null);

export const WebSocketProvider = ({ children }) => {
  const [webSocket, setWebSocket] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(
      window.location.origin.replace(/^http/, "ws") +
        `?userid=${localStorage.getItem("userId")}`,
    );
    setWebSocket(ws);

    ws.onopen = () => {
      console.log("WebSocket connection established");
    };

    ws.onclose = () => {
      console.log("WebSocket connection closed");
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    return () => {
      ws.close();
    };
  }, []);

  return (
    <WebSocketContext.Provider value={[webSocket, setWebSocket]}>
      {children}
    </WebSocketContext.Provider>
  );
};

export const useWebSocket = () => {
  return useContext(WebSocketContext);
};
