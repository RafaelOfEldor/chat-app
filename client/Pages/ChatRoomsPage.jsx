import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { VscAccount } from "react-icons/vsc";
import "./css/chatRoomsPage.css";
import "./css/loadingAndFiller.css";
import { useWebSocket } from "../context/WebSocketContext";
import ChatRoomInfoPopup from "../components/ChatRoomInfoPopup";

export default function ChatRoomsPage() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return username ? (
    <ChatRooms />
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}

export function ChatRooms() {
  const [newMessage, setNewMessage] = useState("");
  const [newSendMessage, setNewSendMessage] = useState();
  const {
    username,
    setUsername,
    userId,
    userInfo,
    chatRooms,
    allUsers,
    userFriends,
    usersChatRoomsLatestMessages,
    setChatRooms,
    fetchUserInfo,
    fetchRooms,
    fetchAllUsers,
    setUsersChatrooms,
    loadUser,
  } = useAuth();
  const [receivingUser, setReceivingUser] = useState([]);
  const [initiateChat, setInitiateChat] = useState(false);
  const [logsRendered, setLogsRendered] = useState(false);
  const [errorMessage, setErrorMessage] = useState();
  const navigate = useNavigate();
  const [webSocket] = useWebSocket();

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupInfo, setPopupInfo] = useState("");

  useEffect(() => {
    fetchAllUsers();
    fetchUserInfo();
    fetchRooms();
  }, []);

  useEffect(() => {
    if (newSendMessage?.receiving_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  useEffect(() => {}, [chatRooms]);

  async function handleDeleteRoom(id) {
    if (webSocket) {
      try {
        const message = {
          type: "DELETE_ROOM",
          room_id: id,
        };

        webSocket.send(JSON.stringify(message));
      } catch (error) {
        console.error(error);
      }
    }
  }

  const handleInfoClick = (info) => {
    setPopupInfo(info);
    setIsPopupVisible(true);
  };

  const handleClosePopup = () => {
    setIsPopupVisible(false);
    setPopupInfo("");
  };

  const chatRoomsElement = chatRooms.map((item, index) => {
    const roomMessages = usersChatRoomsLatestMessages.find((chat) => chat.id === item?.id);
    let amountOfMessages = null;
    if (roomMessages) {
      amountOfMessages = roomMessages?.messages?.filter((message) => !message?.seenByUser).length;
    }
    if (item?.type === "dm") return;
    if (item?.isPublic || item?.users.find((a) => a === userId)) {
      return (
        <div key={index} className="chat-room-card full-element">
          {amountOfMessages !== null && amountOfMessages > 0 && (
            <div className="glowing-circle-room-messages">
              <h3>{amountOfMessages > 9 ? "9+" : amountOfMessages}</h3>
            </div>
          )}
          <div className="chatroom-info-circle" onClick={() => handleInfoClick(item)}>
            <h3>i</h3>
          </div>
          <div className="chat-room-card div">
            <Link
              to={`/chatrooms/room/${item.id}`}
              state={{ prevUrl: location.pathname }}
              className="chat-room-card link"
            >
              <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                <h2 className="chatroom-card-title">{item.title}</h2>
                <h4 style={{ minHeight: "20px" }}>
                  {item.description !== "" ? (
                    <i>
                      {item.description.slice(0, 21)}
                      <br />
                      {item.description.slice(21, 40)}
                      {item.description.length > 40 && "..."}
                    </i>
                  ) : (
                    <i style={{ fontWeight: "100" }}>no description</i>
                  )}
                </h4>
                <h4 className="red" style={{ fontWeight: "100", letterSpacing: "1" }}>
                  Created by:
                  {userId === item.created_by_id ? (
                    <i style={{ color: "cyan" }}> You</i>
                  ) : (
                    <t style={{ color: "white" }}> {item.created_by}</t>
                  )}
                </h4>
              </div>
            </Link>
          </div>
          {userId === item.created_by_id && (
            <div
              style={{
                display: "flex",
                width: "100%",
                height: "auto",
                justifyContent: "center",
              }}
            >
              <Link to={`/newroom/editroom?roomid=${item.id}`} className="chat-room-card-editlink">
                Edit
              </Link>
              <button
                style={{ width: "50%" }}
                className="chat-room-card-delete-button"
                onClick={() => handleDeleteRoom(item.id)}
              >
                Delete
              </button>
            </div>
          )}
        </div>
      );
    }
  });

  const userMap = React.useMemo(() => {
    const map = {};
    allUsers.forEach((user) => {
      map[user.id] = user;
    });
    return map;
  }, [allUsers]);

  const directMessagesElement = chatRooms.map((item, index) => {
    if (item?.type !== "dm") return null;
    if (item?.users?.length !== 2) return null;
    if (item?.users?.includes(userId)) {
      const otherDmUser = item?.users?.find((user) => user !== userId);
      const user = userMap[otherDmUser];
      const roomMessages = usersChatRoomsLatestMessages.find((chat) => chat.id === item?.id);
      let amountOfMessages = null;
      if (roomMessages) {
        amountOfMessages = roomMessages?.messages?.filter((message) => !message?.seenByUser).length;
      }

      if (user) {
        return (
          <Link
            key={index}
            to={`/chatrooms/room/${item.id}`}
            state={{ prevUrl: location.pathname }}
            className="chat-room-dm-link"
          >
            <div className="chat-room-dm-link-content">
              <VscAccount style={{ scale: "2" }} />
              <div>
                <h4>{user?.username}</h4>
                <i>{user?.email}</i>
              </div>
              {amountOfMessages !== null && amountOfMessages > 0 && (
                <div className="glowing-circle-direct-messages">
                  <h3>{amountOfMessages > 9 ? "9+" : amountOfMessages}</h3>
                </div>
              )}
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                width: "99%",
                gap: "20px",
                borderStyle: "solid",
                borderRadius: "10px",
                borderWidth: "1px",
                color: "rgba(69, 218, 190, 0.3)",
              }}
            ></div>
          </Link>
        );
      }
    }
    return null;
  });
  return chatRoomsElement.length > 0 ? (
    <div className="chat-rooms-page">
      <div style={{ display: "flex", gap: "0", height: "100%" }}>
        <div className="chat-rooms-list-container">
          <h1 style={{ marginLeft: "2vw" }}>Chat rooms</h1>
          <div className="chat-rooms-list">{chatRoomsElement}</div>
          <div className="new-room-button-div">
            <Link to="/newroom" className="new-room-button">
              <h3>Create new room +</h3>
            </Link>
          </div>
        </div>
        <div className="direct-messages-sidebar">
          <h2
            style={{
              marginBottom: "10px",
              position: "sticky",
              top: "0",
              backgroundColor: "rgba(68, 72, 119, 1)",
              marginLeft: "auto",
              width: "100%",
              zIndex: "100",
              color: "#009bcb",
              borderBottom: "solid 1px #151A1E",
              boxShadow: "0 4px 2px -2px rgba(0, 0, 0, 0.4)",
            }}
          >
            Direct messages
          </h2>
          {directMessagesElement?.length > 0 ? (
            directMessagesElement
          ) : (
            <i style={{ marginTop: "10px" }}>You currently have no direct messages.</i>
          )}
        </div>
      </div>
      {isPopupVisible && <ChatRoomInfoPopup info={popupInfo} allUsers={allUsers} onClose={handleClosePopup} />}
    </div>
  ) : chatRooms ? (
    <div className="loading-results-layout-div">
      <h1> Loading chatrooms... </h1>
    </div>
  ) : (
    <div className="loading-results-layout-div">
      <h1> There are currently no open chat rooms. </h1>
    </div>
  );
}
