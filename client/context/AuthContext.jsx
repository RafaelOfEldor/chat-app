import React, { useContext, useEffect, useState } from "react";
import { useWebSocket } from "./WebSocketContext";
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
  usersChatRooms: undefined,
  usersChatRoomsLatestMessages: undefined,
  allUsers: undefined,
  userInfo: undefined,
  chatRooms: undefined,
  google_client_id: undefined,
  microsoft_client_id: undefined,
  microsoft_openid_config: undefined,
  google_openid_config: undefined,
  loadUser: async () => {},
  fetchRooms: async () => {},
  fetchUserInfo: async () => {},
  updateChatRooms: async () => {},
  updateChatRooms: async () => {},
  fetchAllFriends: async () => {},
  fetchAllRequests: async () => {},
  fetchAllUsers: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [chatRooms, setChatRooms] = useState([]);
  const [usersChatRooms, setUsersChatRooms] = useState([]);
  const [usersChatRoomsLatestMessages, setUsersChatRoomsLatestMessages] = useState([]);
  const [username, setUsername] = useState();
  const [fullName, setFullName] = useState();
  const [userId, setUserId] = useState();
  const [mail, setMail] = useState();
  const [userBio, setUserBio] = useState();
  const [userInfo, setUserInfo] = useState();
  const [userFriends, setUserFriends] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [webSocket, setWebSocket] = useWebSocket();

  async function loadUser() {
    const res = await fetch(`/api/auth/login`);
    if (res.ok) {
      const user = await res.json();

      setUsername(user.username);
      setFullName(user.fullName);
      setUserId(user.sub);
      setMail(user.mail);
      setUserBio(user.bio);

      localStorage.setItem("userId", user.sub);

      fetchUserInfo();
      return user.sub;
    } else {
      localStorage.clear();
      if (webSocket) {
        webSocket.close();
      }
    }
  }

  async function fetchUserInfo() {
    const response = await fetch(`/api/users/byid/${localStorage.getItem("userId")}`);
    const data = await response.json();
    setUserInfo(data);
  }

  async function fetchRooms() {
    fetch(`/api/chats/rooms`).then((response) =>
      response.json().then((data) => {
        setChatRooms(data);
        setUsersChatRooms(data.filter((room) => room.users.includes(localStorage.getItem("userId"))));
      }),
    );
  }

  async function updateChatRooms(data) {
    const dataElement = {
      user_id: localStorage.getItem("userId"),
      rooms: usersChatRooms,
    };

    const res = await fetch("/api/chats/checkview", {
      method: "POST",
      body: JSON.stringify(dataElement),
      headers: {
        "content-type": "application/json",
      },
    });
    if (res.status === 204) {
      setUsersChatRoomsLatestMessages([]);
    } else {
      const returnData = await res.json();
      setUsersChatRoomsLatestMessages(returnData);
    }
  }

  useEffect(() => {
    if (usersChatRooms.length > 0) {
      updateChatRooms();
    } else setUsersChatRoomsLatestMessages([]);
  }, [usersChatRooms]);

  async function fetchAllUsers() {
    await fetch(`/api/users/get/allusers`).then((response) =>
      response.json().then((data) => {
        setAllUsers(data);
      }),
    );
  }

  async function handleDevelopConnection() {
    if (webSocket) {
      const message = {
        type: "UPDATE_USERID",
        user_id: localStorage.getItem("userID"),
      };
      webSocket.send(JSON.stringify(message));
    }
  }

  useEffect(() => {
    if (webSocket) {
      handleDevelopConnection();
    }
  }, []);

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

  useEffect(() => {
    if (userInfo) {
      if (userInfo.friends && userInfo.friends.length > 0) {
        fetchAllFriends(userInfo.friends);
      } else {
        setUserFriends([]);
      }
      if (userInfo.requests && userInfo.requests.length > 0) {
        fetchAllRequests(userInfo.requests);
      } else setUserRequests([]);
      fetchAllUsers();
    }
  }, [userInfo]);

  useEffect(() => {
    if (webSocket) {
      webSocket.onopen = () => {
        // console.log("WebSocket connection established");
        // console.log(webSocket);
      };

      webSocket.onmessage = (message) => {
        const data = JSON.parse(message.data);
        // console.log(data);
        switch (data.type) {
          case "FRIEND_UPDATE":
            fetchUserInfo();
            fetchAllUsers();
            break;
          case "USER_INFO_UPDATE":
            fetchUserInfo();
            break;
          case "REQUEST_UPDATE":
            if (data.targetUser.id === localStorage.getItem("userId")) {
              setUserRequests(data.targetUser.requests);
              fetchUserInfo();
            }
            break;
          case "ALL_USERS_UPDATE":
            setAllUsers(data.allUsers);
            break;
          case "CHAT_ROOMS_UPDATE":
            fetchRooms();
            break;
          case "UPDATE_ROOM":
            if (localStorage.getItem("userId") === data.message.id) {
              updateChatRooms(data);
            }
            break;
          case "new-message":
            fetchRooms();
            break;
          case "deleted":
            fetchRooms();
            break;
          case "edited":
            fetchRooms();
            break;
          default:
          // console.log("Unknown message type:", data.type);
        }
      };

      webSocket.onclose = () => {
        // console.log("WebSocket connection closed");
      };

      webSocket.onerror = (error) => {
        // console.error("WebSocket error:", error);
      };
    }
  }, [webSocket]);

  return (
    <AuthContext.Provider
      value={{
        username,
        fullName,
        userId,
        userInfo,
        mail,
        chatRooms,
        usersChatRooms,
        usersChatRoomsLatestMessages,
        userBio,
        userFriends,
        userRequests,
        usersChatRooms,
        allUsers,
        setUsername,
        setAllUsers,
        setUserId,
        setUserFriends,
        setChatRooms,
        setUsersChatRooms,
        setUsersChatRoomsLatestMessages,
        setUserRequests,
        fetchAllUsers,
        fetchUserInfo,
        fetchRooms,
        loadUser,
        updateChatRooms,
        updateChatRooms,
        fetchAllFriends,
        fetchAllRequests,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
