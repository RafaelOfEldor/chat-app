import React, { useRef } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import LoginWithOpenidButton from "../functions/LoginWithOpenidButton";
import LoginWithActiveDirectoryButton from "../functions/LoginWithActiveDirectoryButton";

export default function LoginPage(props) {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const navigate = useNavigate();

  const { loadUser } = useAuth();

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await fetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      throw new Error("Something went wrong " + res.statusText);
    }
    loadUser();
    navigate("/");
  }
  return (
    <div>
      <div onSubmit={handleSubmit} className="login-div">
        <h1 style={{ marginBottom: "40px" }}>Login:</h1>
        <LoginWithActiveDirectoryButton />
      </div>
      <div
        style={{
          marginLeft: "50vw",
          marginTop: "20px",
          transform: "translate(-50%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <LoginWithOpenidButton />
      </div>
      <Link to="/" className="back-to-home-from-login-button">
        <h1>Back to homepage</h1>
      </Link>
    </div>
  );
}
