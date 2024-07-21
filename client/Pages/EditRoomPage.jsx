import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./css/newRoomPage.css";
import { useWebSocket } from "../context/WebSocketContext";

export default function ChatRoomsPage() {
  const { username } = useAuth();
  const navigate = useNavigate();

  return username ? (
    <ChatRooms />
  ) : (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
        color: "white",
      }}
    >
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}

export function ChatRooms() {
  const [isPublic, setIsPublic] = useState(true);
  const { userId, userInfo, userFriends, chatRooms, fetchUserInfo, fetchRooms } = useAuth();
  const [errorMessage, setErrorMessage] = useState();
  const [searchResults, setSearchResults] = useState([
    "Item 1",
    "Item 2",
    "Item 3",
    "Item 4",
    "Item 5",
    "Item 6",
    "Item 7",
    "Item 8",
  ]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [webSocket] = useWebSocket();
  const searchContainerRef = useRef(null);
  const roomId = searchParams.get("roomid");
  const navigate = useNavigate();

  useEffect(() => {
    fetchRooms();
    fetchUserInfo();
    setSearchResults(userFriends);
  }, []);

  useEffect(() => {
    fetchThisRoom();
  }, [userInfo]);

  async function fetchThisRoom() {
    const roomRes = await fetch(`/api/chats/room/${roomId}`);
    const room = await roomRes.json();
    setSelectedItems(userFriends.filter((user) => room[0]?.users?.includes(user.id)));
    setIsPublic(room[0].isPublic);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    let updatedUsers = [];

    for (const user of selectedItems) {
      updatedUsers.push(user.id);
    }
    updatedUsers.push(userId);

    const data = {
      room_id: roomId,
      new_title: e.target.title.value,
      new_description: e.target.description.value,
      created_by_id: userId,
      users: isPublic ? [userId] : updatedUsers,
      isPublic: isPublic,
    };

    const roomRes = await fetch(`/api/chats/room/${roomId}`);
    const room = await roomRes.json();

    const res = await fetch("/api/chats/rooms/newroom", {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!res.ok) {
      if (res.status === 406) {
        setErrorMessage("A room with that name already exists!");
      } else if (res.status === 401) {
        setErrorMessage("You are unauthorized to edit this room.");
      }
    } else {
      const webSocketMessage = {
        type: "CHAT_ROOMS_UPDATE",
        user_id: userId,
        roomid: roomId,
        old_users: room[0]?.users,
      };
      if (webSocket) {
        webSocket.send(JSON.stringify(webSocketMessage));
      }
      navigate("/chatrooms");
    }
  }

  const handleSelectionChange = (event) => {
    setIsPublic(event.target.value === "public");
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setShowResults(true);
    if (event.target.value === "") {
      setShowResults(false);
    } else {
      const results = userFriends.filter(
        (item) =>
          item.username.toLowerCase().includes(event.target.value.toLowerCase()) ||
          item.email.toLowerCase().includes(event.target.value.toLowerCase()),
      );
      setSearchResults(results);
    }
  };

  const handleItemClick = (item) => {
    if (!selectedItems.includes(item)) {
      setSelectedItems([...selectedItems, item]);
      setSearchQuery("");
      setShowResults(false);
    }
  };

  const handleRemoveItem = (item) => {
    setSelectedItems(selectedItems.filter((i) => i !== item));
  };

  const handleFocus = () => {
    setShowResults(true);
  };

  const handleBlur = (e) => {
    setTimeout(() => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(document.activeElement)) {
        setShowResults(false);
      }
    }, 100);
  };

  return (
    <div className="create-new-room-page">
      <form className="create-new-room-form" onSubmit={handleSubmit}>
        <div style={{ textAlign: "start", width: "100%" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <input name="title" placeholder="Enter title" required />
            <select onChange={handleSelectionChange} value={isPublic ? "public" : "private"}>
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div style={{ textAlign: "start" }}>
          <textarea name="description" placeholder="Write a description for the room" required />
        </div>
        {!isPublic && <h2 style={{ marginRight: "auto" }}>Invite or remove friends from room</h2>}
        <div className={`submit-form-bottom-section-${isPublic ? "is-public" : "not-public"}`}>
          {!isPublic && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div
                  className="search-container"
                  ref={searchContainerRef}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={{ display: "flex", flexDirection: "column", alignItems: "start" }}
                >
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={handleSearchChange}
                    placeholder="Invite friends..."
                  />
                  {showResults && searchResults.length > 0 && (
                    <ul className="search-results">
                      {searchResults.map((result) => (
                        <li
                          key={result.id}
                          onClick={() => handleItemClick(result)}
                          style={{ display: "flex", gap: "20px" }}
                        >
                          <h4>{result.username}</h4> <i>{`(${result.email})`}</i>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="selected-items">
                    {selectedItems?.map((item, index) => (
                      <div key={index} className="selected-item">
                        {item.username}
                        <span onClick={() => handleRemoveItem(item)}>x</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          <button type="submit">Update room</button>
        </div>
        {errorMessage && <h1 style={{ color: "red" }}>{errorMessage}</h1>}
      </form>
    </div>
  );
}
