import React, { useContext } from "react";
import { Link, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function HomePage(props) {
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
      <nav className="nav-bar">
        {username ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "20px",
            }}
          >
            <Link to="profile" className="profile-link">
              <h1>{userInfo?.username ? userInfo?.username : username}</h1>
            </Link>
            <Link to="/" className="profile-page homepage">
              <h1>Home</h1>
            </Link>
            <Link to="/chatrooms" className="profile-page chatrooms">
              <h1>Chatrooms</h1>
            </Link>
            <Link to="/viewusers" className="profile-page viewusers">
              <h1>View Users</h1>
            </Link>
          </div>
        ) : (
          <Link to="login" className="navbar-link">
            <button>Login</button>
          </Link>
        )}

        {username && (
          <form onSubmit={handleLogout}>
            <button className="logout-button">Logout</button>
          </form>
        )}
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
