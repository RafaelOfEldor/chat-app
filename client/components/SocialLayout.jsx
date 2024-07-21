import React, { useContext, useEffect } from "react";
import { Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/socialLayout.css";

export default function SocialLayout(props) {
  const { username, setUsername, setUserId, userRequests, fetchUserInfo, loadUser } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadUser();
    fetchUserInfo();
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

  return username ? (
    <div className="social-layout-page">
      <div className="social-layout-navbar-div">
        <NavLink
          to="/social/viewusers"
          className={({ isActive }) =>
            isActive ? `active-social-layout-navbar-div-link users` : `social-layout-navbar-div-link users`
          }
        >
          All users
        </NavLink>
        <NavLink
          to="/social/friends"
          className={({ isActive }) =>
            isActive ? `active-social-layout-navbar-div-link friends` : `social-layout-navbar-div-link friends`
          }
        >
          Friends
        </NavLink>
        <NavLink
          to="/social/requests"
          className={({ isActive }) =>
            isActive ? `active-social-layout-navbar-div-link requests` : `social-layout-navbar-div-link requests`
          }
        >
          Requests {userRequests?.length > 0 && <div className="glowing-circle-social-layout"></div>}
        </NavLink>
      </div>
      <Outlet />
    </div>
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}
