import React, { useState, useEffect } from "react";
import { FiSettings, FiChevronLeft, FiMessageCircle, FiZap, FiLogOut, FiUsers, FiChevronRight } from "react-icons/fi";
import { VscAccount } from "react-icons/vsc";
import { useNavigate, Link, useLocation } from "react-router-dom";
import "./css/sidebar.css";
import logo from "./assets/logo.gif";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeLink, setActiveLink] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const {
    mail,
    userInfo,
    setUsername,
    setUserId,
    usersChatRoomsLatestMessages,
    userRequests,
    loadUser,
    fetchUserInfo,
    fetchRooms,
  } = useAuth();

  useEffect(() => {
    if (location.pathname === "/chatrooms") {
      setActiveLink("#messages");
    } else if (
      location.pathname === "/social/viewusers" ||
      location.pathname === "/social/friends" ||
      location.pathname === "/social/requests"
    ) {
      setActiveLink("#social");
    } else if (location.pathname === "/communities") {
      setActiveLink("#communities");
    } else if (location.pathname === "/profile") {
      setActiveLink("#dashboard");
    }
    fetchUserInfo();
    fetchRooms();
  }, [location.pathname]);

  async function handleLogout(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error("Something went wrong " + res.statusText);
    }
    localStorage.clear();
    setUsername();
    setUserId();
    await loadUser();
    navigate("/");
  }

  const handleExpandClick = () => {
    setCollapsed(!collapsed);
  };

  const handleLinkClick = (href) => {
    setActiveLink(href);
  };

  return (
    <nav className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      <div className="sidebar-top-wrapper">
        <div className="sidebar-top">
          <a href="/" className="logo__wrapper">
            <img src={logo} alt="Logo" className="logo-small" />
            <span className="hide">Yappington</span>
          </a>
        </div>
        <div className="expand-btn" onClick={handleExpandClick}>
          {collapsed ? <FiChevronRight /> : <FiChevronLeft />}
        </div>
      </div>
      <div className="sidebar-links">
        <h2>Main</h2>
        <ul>
          <li>
            <Link
              to="/profile"
              title="Dashboard"
              className={`tooltip ${activeLink === "#dashboard" ? "active" : ""}`}
              onClick={() => handleLinkClick("#dashboard")}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="icon icon-tabler icon-tabler-layout-dashboard"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" d="M0 0h24v24H0z" fill="none" />
                <path d="M4 4h6v8h-6z" />
                <path d="M4 16h6v4h-6z" />
                <path d="M14 12h6v8h-6z" />
                <path d="M14 4h6v4h-6z" />
              </svg>
              <span className="link hide">Dashboard</span>
              <span className="tooltip__content">Dashboard</span>
            </Link>
          </li>

          <li>
            <Link
              to="/chatrooms"
              title="Messages"
              className={`tooltip ${activeLink === "#messages" ? "active" : ""}`}
              onClick={() => handleLinkClick("#messages")}
            >
              <FiMessageCircle />
              <span className="link hide">Messages</span>
              <span className="tooltip__content">Messages</span>
              {usersChatRoomsLatestMessages?.filter((item) => item?.messages?.find((message) => !message?.seenByUser))
                ?.length > 0 && <div className="glowing-circle-messages"></div>}
            </Link>
          </li>

          <li>
            <Link
              to="/social/viewusers"
              title="Social"
              className={`tooltip ${activeLink === "#social" ? "active" : ""}`}
              onClick={() => handleLinkClick("#friends")}
            >
              <FiUsers />
              <span className="link hide">Social</span>
              <span className="tooltip__content">Social</span>
              {userRequests?.length > 0 && <div className="glowing-circle"></div>}
            </Link>
          </li>

          <li>
            <Link
              to="/communities"
              title="Communities"
              className={`tooltip ${activeLink === "#communities" ? "active" : ""}`}
              onClick={() => handleLinkClick("#communities")}
            >
              <FiZap />
              <span className="link hide">Communities</span>
              <span className="tooltip__content">Communities</span>
            </Link>
          </li>
        </ul>
      </div>
      <div className="sidebar-links bottom-links">
        <h2>Settings</h2>
        <ul>
          <li>
            <a
              href="/settings"
              title="Settings"
              className={`tooltip ${activeLink === "#settings" ? "active" : ""}`}
              onClick={() => handleLinkClick("#settings")}
            >
              <FiSettings />
              <span className="link hide">Settings</span>
              <span className="tooltip__content">Settings</span>
            </a>
          </li>
        </ul>
      </div>
      <div className="divider"></div>
      <div className="sidebar__profile">
        <div className="avatar__wrapper">
          <VscAccount style={{ scale: "2" }} />
          <div className="online__status"></div>
        </div>
        <section className="avatar__name hide">
          <div className="user-name">{userInfo?.username}</div>
          <div className="email">{mail}</div>
        </section>
        <button onClick={(e) => handleLogout(e)} className="logout">
          {!collapsed && <FiLogOut />}
        </button>
      </div>
    </nav>
  );
};

export default Sidebar;
