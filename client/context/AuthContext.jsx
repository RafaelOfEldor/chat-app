import React, { useContext, useEffect, useState } from "react";
import dotenv from "dotenv";
dotenv.config({ path: `${__dirname}/../.env` });

const AuthContext = React.createContext({
  username: undefined,
  mail: undefined,
  webSocket: undefined,
  fullName: undefined,
  userBio: undefined,
  userFriends: undefined,
  userRequests: undefined,
  allUsers: undefined,
  userInfo: undefined,
  google_client_id: undefined,
  microsoft_client_id: undefined,
  microsoft_openid_config: undefined,
  google_openid_config: undefined,
  loadUser: async () => {},
  fetchUserInfo: async () => {},
  fetchAllFriends: async () => {},
  fetchAllRequests: async () => {},
  fetchAllUsers: async () => {},
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
  const [username, setUsername] = useState();
  const [fullName, setFullName] = useState();
  const [userId, setUserId] = useState();
  const [mail, setMail] = useState();
  const [webSocket, setWebSocket] = useState();
  const [userBio, setUserBio] = useState();
  const [userInfo, setUserInfo] = useState();
  const [userFriends, setUserFriends] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  async function loadUser() {
    const res = await fetch(`${baseUrl}/api/auth/login`);
    if (res.ok) {
      const user = await res.json();
      setUsername(user.username);
      setFullName(user.fullName);
      setUserId(user.sub);
      setMail(user.mail);
      setUserBio(user.bio);
      fetchUserInfo();
    }
  }

  async function fetchUserInfo() {
    const response = await fetch(`/api/users/byid/${userId}`);
    const data = await response.json();
    setUserInfo(data);
  }

  async function fetchAllUsers() {
    await fetch(`/api/users/get/allusers`).then((response) =>
      response.json().then((data) => {
        setAllUsers(data);
      }),
    );
  }

  async function fetchAllFriends(friends) {
    const friendArray = { user_ids: friends };
    const res = await fetch(`/api/users/allfriends`, {
      method: "POST",
      body: JSON.stringify(friendArray),
      headers: {
        "content-type": "application/json",
      },
    });

    const data = await res.json();
    setUserFriends(data);
  }

  async function fetchAllRequests(requests) {
    const requestsArray = { user_ids: requests };
    const res = await fetch(`/api/users/allrequests`, {
      method: "POST",
      body: JSON.stringify(requestsArray),
      headers: {
        "content-type": "application/json",
      },
    });

    const data = await res.json();
    setUserRequests(data);
  }

  // Fetch user info when userId is set
  useEffect(() => {
    if (userId) {
      fetchUserInfo(userId);
    }
  }, [userId]);

  // Fetch friends and requests when userInfo is set
  useEffect(() => {
    if (userInfo) {
      if (userInfo.friends && userInfo.friends.length > 0) {
        fetchAllFriends(userInfo.friends);
      } else {
        setUserFriends([])
      }
      if (userInfo.requests && userInfo.requests.length > 0) {
        fetchAllRequests(userInfo.requests);
      } else setUserRequests([])
      fetchAllUsers();
    }
  }, [userInfo]);

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
        userFriends,
        userRequests,
        allUsers,
        google_client_id: googleClientId,
        microsoft_client_id: microsoftClientId,
        microsoft_openid_config: openIdMicrosoftUrl,
        google_openid_config: openIdGoogleUrl,
        setUsername,
        setAllUsers,
        setUserId,
        setUserFriends,
        setUserRequests,
        fetchAllUsers,
        setWebSocket,
        fetchUserInfo,
        loadUser,
        fetchAllFriends,
        fetchAllRequests,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
