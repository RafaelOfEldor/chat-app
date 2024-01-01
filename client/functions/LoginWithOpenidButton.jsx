import React from "react";
import dotenv from "dotenv";
import { useAuth } from "../context/AuthContext";
dotenv.config({ path: `${__dirname}/../.env` });

const discoveryUrl = process.env.OPENID_GOOGLE_URL;

export default function LoginWithOpenidButton() {
  const [authorizationUrl, setAuthorizationUrl] = React.useState();
  const { google_client_id } = useAuth();

  async function loadAuthorizationUrl() {
    const state = randomString(50);
    window.sessionStorage.setItem("state", state);

    const res = await fetch(discoveryUrl);
    const discoveryDoc = await res.json();
    const params = {
      response_mode: "fragment",
      response_type: "token",
      client_id: google_client_id,
      redirect_uri: window.location.origin + "/login/callback",
      scope: "profile email",
      prompt: "consent",
      state,
    };
    setAuthorizationUrl(
      discoveryDoc.authorization_endpoint + "?" + new URLSearchParams(params),
    );
  }
  React.useEffect(() => {
    loadAuthorizationUrl();
  }, []);

  return (
    <div>
      <a href={authorizationUrl} className="login-button-link google">
        Login with google
      </a>
    </div>
  );
}

function randomString(length) {
  let result = "";
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}
