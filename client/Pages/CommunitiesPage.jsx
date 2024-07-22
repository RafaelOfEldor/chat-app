import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./css/communitiesPage.css";
import "./css/loadingAndFiller.css";
import ChatRoomInfoPopup from "../components/ChatRoomInfoPopup";
import { FiSearch } from "react-icons/fi";

export default function CommunitiesPage() {
  const { username, userId } = useAuth();

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
  const [searchQuery, setSearchQuery] = useState("");
  const [newSendMessage, setNewSendMessage] = useState();
  const { userId, userInfo, webSocket, allUsers, chatRooms, setChatRooms, fetchUserInfo } = useAuth();

  const [isPopupVisible, setIsPopupVisible] = useState(false);
  const [popupInfo, setPopupInfo] = useState("");

  async function fetchRooms() {
    fetch(`/api/chats/rooms`).then((response) =>
      response.json().then((data) => {
        setChatRooms(data);
      }),
    );
  }

  useEffect(() => {
    fetchRooms();
    fetchUserInfo();
  }, []);

  async function handleChat(e) {
    e.preventDefault();
    try {
      setLogsRendered(false);
      await fetch(`api/users/${e.target.addMessage.value.toLowerCase()}`).then((res) => {
        if (!res.ok) {
          setErrorMessage("User was not found :/");
        } else if (res.ok) {
          setErrorMessage();
          res.json().then((data) => {
            setReceivingUser(data);
          }),
            setInitiateChat(true);
        }
      });
    } catch (error) {
      console.error(error);
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

  function handleLeave(e) {
    e.preventDefault();
    setReceivingUser([]);
    setInitiateChat(false);
    setLogsRendered(false);
  }

  const handleSearch = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredChatRooms = chatRooms.filter(
    (item) =>
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.created_by.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const chatRoomsElement = filteredChatRooms.map((item, index) => {
    if (item?.type === "dm") return;
    if (item?.isPublic) {
      return (
        <div key={index} className="chat-room-card full-element">
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

  return chatRoomsElement.length > 0 ? (
    <div className="community-rooms-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <h1 style={{ marginLeft: "5vw" }}>Public chatrooms:</h1>
        <div className="search-wrapper" style={{ paddingRight: "20px" }}>
          <FiSearch style={{ translate: "0% -30%" }} />
          <input
            type="text"
            placeholder="Search by title or creator"
            value={searchQuery}
            onChange={handleSearch}
            style={{
              marginBottom: "10px",
              paddingLeft: "30px",
              width: "90%",
              marginRight: "10vw",
              paddingRight: "20px",
            }}
          />
        </div>
      </div>
      <div className="community-rooms-list" style={{ paddingTop: "5vh", paddingLeft: "5vw" }}>
        {chatRoomsElement}
      </div>
      <Link to="/newroom" className="new-room-button-communities">
        <h3>Create new room +</h3>
      </Link>
      {isPopupVisible && <ChatRoomInfoPopup info={popupInfo} allUsers={allUsers} onClose={handleClosePopup} />}
    </div>
  ) : searchQuery !== "" && chatRooms ? (
    <div className="community-rooms-page">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
        <h1 style={{ marginLeft: "5vw" }}>Public chatrooms:</h1>
        <div className="search-wrapper" style={{ paddingRight: "20px" }}>
          <FiSearch style={{ translate: "0% -30%" }} />
          <input
            type="text"
            placeholder="Search by title or creator"
            value={searchQuery}
            onChange={handleSearch}
            style={{
              marginBottom: "10px",
              paddingLeft: "30px",
              width: "90%",
              marginRight: "10vw",
              paddingRight: "20px",
            }}
          />
        </div>
      </div>
      <div
        className="community-rooms-list"
        style={{
          fontSize: "2rem",
          marginTop: "30vh",
          marginLeft: "47vw",
          display: "flex",
          alignItems: "center",
          transform: "translate(-50%, -50%)",
        }}
      >
        <i>Couldn't find any matching chatrooms...</i>
      </div>
      <Link to="/newroom" className="new-room-button-communities">
        <h3>Create new room +</h3>
      </Link>
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
