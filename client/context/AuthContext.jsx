import React, { useContext } from "react";
import dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../.env` });

const AuthContext = React.createContext({
  username: undefined,
  mail: undefined,
  webSocket: undefined,
  fullName: undefined,
  userBio: undefined,
  userInfo: undefined,
  google_client_id: undefined,
  microsoft_client_id: undefined,
  microsoft_openid_config: undefined,
  google_openid_config: undefined,
  loadUser: async () => {},
  fetchUserInfo: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const microsoftClientId = process.env.MICROSOFT_CLIENT_ID;
const openIdMicrosoftUrl = process.env.OPENID_MICROSOFT_URL;
const openIdGoogleUrl = process.env.OPENID_GOOGLE_URL;

export function AuthProvider({ children }) {
  const [username, setUsername] = React.useState();
  const [fullName, setFullName] = React.useState();
  const [userId, setUserId] = React.useState();
  const [mail, setMail] = React.useState();
  const [webSocket, setWebSocket] = React.useState();
  const [userBio, setUserBio] = React.useState();
  const [userInfo, setUserInfo] = React.useState();

  async function loadUser() {
    const res = await fetch(`${baseUrl}/api/auth/login`);
    if (!res.ok) {
    }
    if (res.ok) {
      const user = await res.json();
      // console.log(user.sub);
      setUsername(user.username);
      setFullName(user.fullName);
      setUserId(user.sub);
      setMail(user.mail);
      setUserBio(user.bio);
      fetchUserInfo();
    }
  }

  async function fetchUserInfo() {
    fetch(`/api/users/byid/${userId}`).then((response) =>
      response.json().then((data) => {
        setUserInfo(data);
      }),
    );
  }

  return (
    <AuthContext.Provider
      value={{
        username,
        fullName,
        userId,
        userInfo,
        mail,
        webSocket,
        userBio,
        google_client_id: googleClientId,
        microsoft_client_id: microsoftClientId,
        microsoft_openid_config: openIdMicrosoftUrl,
        google_openid_config: openIdGoogleUrl,
        setUsername,
        setUserId,
        setWebSocket,
        fetchUserInfo,
        loadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
