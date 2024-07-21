import React from "react";

export default function LoginWithActiveDirectoryButton() {
  const [authorizationUrl, setAuthorizationUrl] = React.useState();

  async function loadAuthorizationUrl() {
    const credentialsRes = await fetch("/api/auth/login/credentials");
    const credentials = await credentialsRes.json();
    const { google_openid_config, microsoft_openid_config, google_client_id, microsoft_client_id } = credentials;

    const code_verifier = randomString(50);
    window.sessionStorage.setItem("code_verifier", code_verifier);
    const code_challenge = await sha256(code_verifier);
    const state = randomString(50);
    window.sessionStorage.setItem("state", state);

    const res = await fetch(microsoft_openid_config);
    const discoveryDoc = await res.json();
    const params = {
      response_mode: "fragment",
      response_type: "code",
      client_id: microsoft_client_id,
      redirect_uri: window.location.origin + "/login/callback",
      scope: "openid profile",
      code_challenge,
      code_challenge_method: "S256",
      state,
      // domain_hint: "egms.no",
    };
    setAuthorizationUrl(discoveryDoc.authorization_endpoint + "?" + new URLSearchParams(params));
  }
  React.useEffect(() => {
    loadAuthorizationUrl();
  }, []);

  return (
    <div>
      <a className="login-button-link microsoft" href={authorizationUrl}>
        Login with microsoft
      </a>
    </div>
  );
}

function randomString(length) {
  let result = "";
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

export async function sha256(string) {
  const binaryHash = await crypto.subtle.digest("SHA-256", new TextEncoder("utf-8").encode(string));
  return btoa(String.fromCharCode.apply(null, new Uint8Array(binaryHash)))
    .split("=")[0]
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}
