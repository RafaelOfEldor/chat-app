import React, { useContext } from "react";
import { Link, Routes, Route, Outlet, useNavigate, NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/socialLayout.css"

export default function SocialLayout(props) {
  const {
    username,
    userInfo,
    setUsername,
    setUserId,
    setWebSocket,
    fetchUserInfo,
    loadUser,
  } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    loadUser();
    fetchUserInfo();
    console.log(window.location.pathname)
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
    <div className="social-layout-page">
      <div className="social-layout-navbar-div">
        <NavLink to="/social/viewusers" 
        className={({isActive}) => isActive ? `active-social-layout-navbar-div-link users` :
        `social-layout-navbar-div-link users`}
        >All users</NavLink>
        <NavLink to="/social/friends" 
        className={({isActive}) => isActive ? `active-social-layout-navbar-div-link friends` :
        `social-layout-navbar-div-link friends`}>Friends</NavLink>
        <NavLink to="/social/requests" 
        className={({isActive}) => isActive ? `active-social-layout-navbar-div-link requests` :
        `social-layout-navbar-div-link requests`}>Requests</NavLink>
      </div>
      <Outlet />
    </div>
  );
}
