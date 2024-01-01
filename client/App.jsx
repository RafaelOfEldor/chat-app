import React, { useEffect } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AuthProvider from "./context/AuthContext";
import { AuthProvider } from "./context/AuthContext";
import RoutesLayout from "./RoutesLayout.jsx";

const root = ReactDOM.createRoot(document.getElementById("root"));

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <RoutesLayout />
      </BrowserRouter>
    </AuthProvider>
  );
}

root.render(<App />);
