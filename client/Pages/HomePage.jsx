import React, { useContext } from "react";
import { Link, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import "./css/HomePage.css";

export default function HomePage(props) {
  const { username, userInfo, setUsername, setUserId, setWebSocket, fetchUserInfo, loadUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadUser();
    fetchUserInfo();
    console.log(window.location.pathname);
  }, []);

  async function handleLogout(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Something went wrong " + res.statusText);
    }
    setUsername();
    setUserId();
    await loadUser();
    navigate("/");
  }

  return (
    <div>
      <main>
        <div style={{ display: "flex", flexDirection: "row" }}>
          {username ? (
            window.location.pathname !== "/" ? (
              <Sidebar />
            ) : (
              <div></div>
            )
          ) : (
            <div>
              {/* <Link to="login" className="navbar-link">
                    <button>Login</button>
                  </Link>
                  {username && (
                  <form onSubmit={handleLogout}>
                    <button className="logout-button">Logout</button>
                  </form>
                  )} */}
            </div>
          )}
          <Outlet />
        </div>
      </main>
    </div>
  );
}
