import React, { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import "./css/HomePage.css";

export default function HomePage(props) {
  const { username, fetchUserInfo, loadUser } = useAuth();

  useEffect(() => {
    loadUser();
    fetchUserInfo();
  }, []);

  return (
    <div>
      <main>
        <div style={{ display: "flex", flexDirection: "row" }}>
          {username ? window.location.pathname !== "/" ? <Sidebar /> : <div></div> : <div></div>}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
