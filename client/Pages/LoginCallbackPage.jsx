import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./css/loadingAndFiller.css";
import { useWebSocket } from "../context/WebSocketContext";

export default function LoginCallbackPage(props) {
  const [debug, setDebug] = React.useState();
  const [error, setError] = React.useState();
  const navigate = useNavigate();
  const [webSocket, setWebSocket] = useWebSocket();
  const { loadUser, microsoft_client_id, google_client_id, microsoft_openid_config, google_openid_config } = useAuth();

  async function handleCallback() {
    const hashObject = Object.fromEntries(new URLSearchParams(window.location.hash.substring(1)));
    setDebug(hashObject.access_token);
    let { access_token, state, code, error, error_description } = hashObject;
    const { token_endpoint } = await fetchJSON(microsoft_openid_config);
    const code_verifier = window.sessionStorage.getItem("code_verifier");

    if (code) {
      const res = await fetch(token_endpoint, {
        method: "POST",
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: microsoft_client_id,
          redirect_uri: window.location.origin + "/login/callback",
          code_verifier,
        }),
      });
      const json = await res.json();
      access_token = json.access_token;
    }

    const res = await fetch(`/api/auth/login/accessToken`, {
      method: "POST",
      body: JSON.stringify({ access_token }),
      headers: {
        "content-type": "application/json",
      },
    });

    if (!res.ok) {
      throw new Error("Something went wrong in callback " + res.statusText);
    }
    const loadedUserId = await loadUser();
    const ws = new WebSocket(window.location.origin.replace(/^http/, "ws") + `?userid=${loadedUserId}`);

    setWebSocket(ws);
    navigate("/profile");
  }

  async function fetchJSON(path) {
    const res = await fetch(path);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${path}: ${res.statusText}`);
    }
    return await res.json();
  }

  React.useEffect(() => {
    handleCallback();
  }, [window.location.hash]);
  return (
    <div style={{ marginTop: "100px" }}>
      <div className="loading-results-layout-div">
        <h1> Loading profile... </h1>
      </div>
      <div>{error}</div>
    </div>
  );
}
