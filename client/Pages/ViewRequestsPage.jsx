import React, { useContext, useEffect, useState, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { Link, useNavigate, NavLink, useLocation } from "react-router-dom";
import { ExpressUsersPut } from "../functions/ExpressFunctions.jsx";
import {
  FiUser,
  FiUserPlus,
  FiSearch,
  FiUserCheck,
  FiUserX,
  FiSend,
} from "react-icons/fi";
import { VscAccount, VscSend } from "react-icons/vsc";
import "./css/viewUsersPage.css";
import "./css/loadingAndFiller.css";
import { useWebSocket } from "../context/WebSocketContext.jsx";

export default function ViewRequestsPage() {
  const {
    username,
    fullName,
    userBio,
    userId,
    userRequests,
    userInfo,
    mail,
    loadUser,
    fetchUserInfo,
    setUserRequests,
    fetchAllRequests,
    setUsername,
  } = useAuth();
  const [showEdit, setShowEdit] = useState(false);
  const [updatedBio, setUpdatedBio] = useState("");
  const [allUsers, setAllUsers] = useState([]);
  const [isHovering, setIsHovering] = useState();
  const [actionEvent, setActionEvent] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();
  const [webSocket] = useWebSocket();

  useEffect(() => {
    fetchUserInfo();
    loadUser();
    console.log(userRequests);
    console.log(userInfo);
  }, []);

  useEffect(() => {
    if (actionEvent) {
      const timer = setTimeout(() => {
        setActionEvent(null);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [actionEvent]);

  useEffect(() => {}, [userInfo]);

  useEffect(() => {
    //  console.log(allUsers)
  }, [allUsers]);

  async function handleDirectMessageChat(
    receivingUserId,
    receivingUserUsername,
  ) {
    const res = await fetch(`/api/chats/rooms`);

    if (res.ok) {
      const data = await res.json();
      let roomId;
      const isDm = data.find((room) => {
        if (room.users.length === 2) {
          if (
            room.users.includes(userId) &&
            room.users.includes(receivingUserId)
          ) {
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

  async function acceptFriendRequest(receivingUserId) {
    if (webSocket) {
      console.log(webSocket);
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

    // const data = {
    //   receiving_user_id: receivingUserId,
    //   user_id: userId
    // }

    // const res = await fetch(`/api/users/accept/request`, {
    //   method: "POST",
    //   body: JSON.stringify(data),
    //   headers: {
    //   "content-type": "application/json",
    // },
    // })

    // if (res.status === 204) {
    //   setActionEvent({
    //     type: "success",
    //     message: "Friend request accepted!"
    //   })
    //   setUserRequests((prevRequests) =>
    //     prevRequests.filter((request) => request.id !== receivingUserId)
    //   );
    //   await fetchUserInfo();
    // } else {
    //   console.log("Error accepting friend request.")
    // }
  }

  async function removeFriendRequest(receivingUserId) {
    if (webSocket) {
      console.log(webSocket);
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

    // const data = {
    //   receiving_user_id: userId,
    //   user_id: receivingUserId
    // }
    // const res = await fetch(`/api/users/remove/request`, {
    //   method: "DELETE",
    //   body: JSON.stringify(data),
    //   headers: {
    //   "content-type": "application/json",
    // },
    // })

    // if (res.status === 204) {
    //   setActionEvent({
    //     type: "success",
    //     message: "Friend request removed!"
    //   })
    //   setUserRequests((prevRequests) =>
    //     prevRequests.filter((request) => request.id !== receivingUserId)
    //   );
    // } else {
    //   console.log("Error removing friend request.")
    // }
  }

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const requestsElement = userRequests?.map((item, index) => {
    return (
      <div style={{ height: "60px", marginTop: "3px" }}>
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
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>
                {item.username}
              </h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>
                {item.email}
              </i>
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
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>
                {item.username}
              </h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>
                {item.email}
              </i>
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
                onClick={() =>
                  handleDirectMessageChat(item?.id, item?.username)
                }
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                Message
                <VscSend />
              </button>
              <FiUserCheck
                className="add-user"
                style={{ color: "cyan", marginRight: "10px" }}
                onClick={() => acceptFriendRequest(item?.id)}
              />
              <FiUserX
                className="add-user"
                style={{ color: "red" }}
                onClick={() => removeFriendRequest(item?.id)}
              />
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

  const searchedRequestsElements = userRequests
    ?.filter(
      (a) =>
        a?.username?.toLowerCase().includes(searchQuery?.toLowerCase()) ||
        a?.email?.toLowerCase().includes(searchQuery?.toLowerCase()),
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
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>
                {item.username}
              </h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>
                {item.email}
              </i>
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
              <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>
                {item.username}
              </h4>
              <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>
                {item.email}
              </i>
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
                onClick={() =>
                  handleDirectMessageChat(item?.id, item?.username)
                }
                style={{ display: "flex", alignItems: "center", gap: "5px" }}
              >
                Message
                <VscSend />
              </button>
              <FiUserCheck
                className="add-user"
                style={{ color: "green" }}
                onClick={() => acceptFriendRequest(item?.id)}
              />
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
    <div className="view-users-page">
      <div className="header-section">
        <h4>view your incoming friend requests</h4>
        <div className="header-section-bar">
          <h1>Requests</h1>
          <div className="search-wrapper">
            <FiSearch />
            <input
              type="search"
              placeholder="Search users..."
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
        </div>
      </div>
      <div className="select-user-profiles-list">
        {requestsElement?.length > 0 ? (
          searchQuery === "" ? (
            requestsElement
          ) : (
            searchedRequestsElements
          )
        ) : (
          <i>You currently don't have any incoming friend requests...</i>
        )}
      </div>
      {/* <Link to="/profile" className="exit-profile-select-button">
          <h2>Back to my profile</h2>
        </Link> */}
    </div>
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button
        onClick={() => navigate("/login")}
        style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}
      >
        Login
      </button>
    </div>
  );
}
