import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import RoutesLayout from "./RoutesLayout.jsx";
import { WebSocketProvider } from "./context/WebSocketContext.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  return (
    <WebSocketProvider>
      <AuthProvider>
        <BrowserRouter>
          <RoutesLayout />
        </BrowserRouter>
      </AuthProvider>
    </WebSocketProvider>
  );
}

root.render(<App />);
