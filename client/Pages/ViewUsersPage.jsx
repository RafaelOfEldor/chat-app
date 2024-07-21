import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useLocation } from "react-router-dom";
import { FiUserPlus, FiUserMinus, FiUserX, FiUserCheck, FiSearch } from "react-icons/fi";
import { VscAccount, VscSend } from "react-icons/vsc";
import "./css/viewUsersPage.css";
import "./css/loadingAndFiller.css";
import { useWebSocket } from "../context/WebSocketContext.jsx";

export default function ViewUsersPage() {
  const { username, userInfo, allUsers, userId, loadUser, fetchUserInfo, fetchAllUsers } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [actionEvent, setActionEvent] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const [webSocket] = useWebSocket();

  useEffect(() => {
    fetchUserInfo();
    fetchAllUsers();
    loadUser();
  }, []);

  useEffect(() => {
    if (actionEvent) {
      const timer = setTimeout(() => {
        setActionEvent(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [actionEvent]);

  useEffect(() => {}, [allUsers]);

  async function sendFriendRequest(receivingUserId) {
    if (webSocket) {
      const message = {
        type: "SEND_REQUEST_UPDATE",
        user_id: userId,
        receiving_user_id: receivingUserId,
      };
      webSocket.send(JSON.stringify(message));
    }

    setActionEvent({
      type: "success",
      message: "Friend request sent!",
    });
    await fetchUserInfo(userId);
    await fetchAllUsers();
  }

  async function removeFriend(receivingUserId) {
    if (webSocket) {
      const message = {
        type: "REMOVE_FRIEND_UPDATE",
        user_id: userId,
        receiving_user_id: receivingUserId,
      };
      webSocket.send(JSON.stringify(message));
    }

    setActionEvent({
      type: "error",
      message: "Friend successfully removed!",
    });
    await fetchUserInfo();
    await fetchAllUsers();
  }

  async function acceptFriendRequest(receivingUserId) {
    if (webSocket) {
      const message = {
        type: "ACCEPT_FRIEND_UPDATE",
        user_id: userId,
        receiving_user_id: receivingUserId,
      };
      webSocket.send(JSON.stringify(message));
    }

    setActionEvent({
      type: "success",
      message: "Friend request accepted!",
    });
    await fetchUserInfo();
    await fetchAllUsers();
  }

  async function removeFriendRequest(receivingUserId) {
    if (webSocket) {
      const message = {
        type: "REMOVE_REQUEST_UPDATE",
        user_id: userId,
        receiving_user_id: receivingUserId,
      };
      webSocket.send(JSON.stringify(message));
    }

    setActionEvent({
      type: "error",
      message: "Friend request removed!",
    });

    await fetchUserInfo();
    await fetchAllUsers();
  }

  async function handleDirectMessageChat(receivingUserId, receivingUserUsername) {
    const res = await fetch(`/api/chats/rooms`);

    if (res.ok) {
      const data = await res.json();
      let roomId;
      const isDm = data.find((room) => {
        if (room.users.length === 2) {
          if (room.users.includes(userId) && room.users.includes(receivingUserId)) {
            roomId = room.id;
            return true;
          }
        }
      });
      if (isDm) {
        navigate(`/chatrooms/room/${roomId}`, {
          state: { prevUrl: location.pathname },
        });
      } else {
        const newRoom = {
          title: receivingUserUsername,
          description: "",
          id: data?.length + 1,
          type: "dm",
          isPublic: false,
          users: [userId, receivingUserId],
          created_by: username,
          created_by_id: userId,
        };
        const res = await fetch("/api/chats/rooms/newroom", {
          method: "POST",
          body: JSON.stringify(newRoom),
          headers: {
            "content-type": "application/json",
          },
        });
        if (!res.ok) {
          setErrorMessage("A room with that name already exists!");
        } else if (res.ok) {
          navigate(`/chatrooms/room/${newRoom.id}`, {
            state: { prevUrl: location.pathname },
          });
        }
      }
    } else {
      console.error("Couldn't fetch rooms");
    }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const userProfileElement = allUsers.map((item, index) => {
    return (
      <div style={{ height: "60px", marginTop: "3px" }} key={index}>
        {index === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "auto",
              gap: "20px",
              borderStyle: "solid",
              borderRadius: "10px",
              borderWidth: "1px",
              color: "rgba(176, 176, 176, 0.5)",
            }}
          ></div>
        )}
        <div className="select-user-profile-card nohover">
          {item?.id === userId ? (
            <div className="user-element">
              <VscAccount style={{ scale: "1.5", marginLeft: "10px" }} />
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>{item.username}</h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>{item.email}</i>
              <button
                className="view-profile-button"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() =>
                  navigate(`/profile`, {
                    state: { prevUrl: location.pathname },
                  })
                }
              >
                Go to profile
              </button>
            </div>
          ) : (
            <div className="user-element">
              <VscAccount style={{ scale: "1.5", marginLeft: "10px" }} />
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>{item.username}</h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>{item.email}</i>
              {userInfo?.friends?.find((a) => a === item?.id) && (
                <i
                  style={{
                    fontSize: "0.9rem",
                    fontWeight: "300",
                    color: "#6EE7B7",
                  }}
                >
                  friend
                </i>
              )}
              <button
                className="view-profile-button"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() =>
                  navigate(`/social/viewusers/user?userid=${item.id}`, {
                    state: { prevUrl: location.pathname },
                  })
                }
              >
                View profile
              </button>
              <button
                className="send-message-button"
                onClick={() => handleDirectMessageChat(item?.id, item?.username)}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                Message
                <VscSend />
              </button>
              {userInfo?.requests?.find((a) => a === item?.id) ||
              userInfo?.friends?.find((a) => a === item?.id) ||
              item?.requests?.find((a) => a === userId) ||
              item?.friends?.find((a) => a === userId) ? (
                userInfo?.friends?.find((a) => a === item?.id) ? (
                  <FiUserMinus style={{ color: "red" }} className="add-user" onClick={() => removeFriend(item?.id)} />
                ) : userInfo?.requests?.find((a) => a === item?.id) ? (
                  <FiUserCheck
                    className="add-user"
                    style={{ color: "green" }}
                    onClick={() => acceptFriendRequest(item?.id)}
                  />
                ) : (
                  <FiUserX
                    className="add-user"
                    style={{ color: "red" }}
                    onClick={() => removeFriendRequest(item?.id)}
                  />
                )
              ) : (
                <FiUserPlus className="add-user" onClick={() => sendFriendRequest(item?.id)} />
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "auto",
            gap: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.5)",
          }}
        ></div>
      </div>
    );
  });

  const searchedUserProfileElement = allUsers
    .filter(
      (a) =>
        a.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.email.toLowerCase().includes(searchQuery.toLowerCase()),
    )
    .map((item, index) => (
      <div key={item.id} style={{ height: "60px", marginTop: "3px" }}>
        {index === 0 && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "auto",
              gap: "20px",
              borderStyle: "solid",
              borderRadius: "10px",
              borderWidth: "1px",
              color: "rgba(176, 176, 176, 0.5)",
            }}
          ></div>
        )}
        <div className="select-user-profile-card nohover">
          {item?.id === userId ? (
            <div className="user-element">
              <VscAccount style={{ scale: "1.5", marginLeft: "10px" }} />
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>{item.username}</h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>{item.email}</i>
              <button
                className="view-profile-button"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() => navigate(`/profile`)}
              >
                Go to profile
              </button>
            </div>
          ) : (
            <div className="user-element">
              <VscAccount style={{ scale: "1.5", marginLeft: "10px" }} />
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>{item.username}</h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>{item.email}</i>
              <button
                className="view-profile-button"
                style={{
                  marginLeft: "auto",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                }}
                onClick={() =>
                  navigate(`/social/viewusers/user?userid=${item.id}`, {
                    state: { prevUrl: location.pathname },
                  })
                }
              >
                View profile
              </button>
              <button
                className="send-message-button"
                onClick={() => handleDirectMessageChat(item?.id, item?.username)}
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                Message
                <VscSend />
              </button>
              {userInfo?.requests?.find((a) => a === item?.id) ||
              userInfo?.friends?.find((a) => a === item?.id) ||
              item?.requests?.find((a) => a === userId) ||
              item?.friends?.find((a) => a === userId) ? (
                userInfo?.friends?.find((a) => a === item?.id) ? (
                  <FiUserMinus style={{ color: "red" }} className="add-user" onClick={() => removeFriend(item?.id)} />
                ) : userInfo?.requests?.find((a) => a === item?.id) ? (
                  <FiUserCheck
                    className="add-user"
                    style={{ color: "green" }}
                    onClick={() => acceptFriendRequest(item?.id)}
                  />
                ) : (
                  <FiUserX
                    className="add-user"
                    style={{ color: "red" }}
                    onClick={() => removeFriendRequest(item?.id)}
                  />
                )
              ) : (
                <FiUserPlus className="add-user" onClick={() => sendFriendRequest(item?.id)} />
              )}
            </div>
          )}
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "auto",
            gap: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.5)",
          }}
        ></div>
      </div>
    ));

  return username ? (
    userProfileElement?.length > 0 ? (
      <div className="view-users-page">
        <div className="header-section">
          <h4>View all users</h4>
          <div className="header-section-bar">
            <h1>Users</h1>
            <div className="search-wrapper">
              <FiSearch />
              <input type="search" placeholder="Search users..." value={searchQuery} onChange={handleSearchChange} />
            </div>
          </div>
        </div>
        <div className="select-user-profiles-list">
          {searchQuery === "" ? userProfileElement : searchedUserProfileElement}
        </div>
        {actionEvent && <div className={`popup-notification ${actionEvent.type}`}>{actionEvent.message}</div>}
      </div>
    ) : (
      <div className="loading-results-layout-div">
        <h1> Loading users... </h1>
      </div>
    )
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}
