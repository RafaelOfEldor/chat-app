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
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "100vh", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}

export function ChatRooms() {
  const [isPublic, setIsPublic] = useState(true);
  const { userId, userInfo, userFriends, chatRooms,  fetchUserInfo, fetchRooms } = useAuth();
  const [errorMessage, setErrorMessage] = useState();
  const [searchResults, setSearchResults] = useState(["Item 1", "Item 2", "Item 3", "Item 4", "Item 5", "Item 6", "Item 7", "Item 8"]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const searchContainerRef = useRef(null);
  const [webSocket] = useWebSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams()
  const roomId = searchParams.get("roomid");

  useEffect(() => {
    fetchRooms();
    fetch
    fetchUserInfo();
    setSearchResults(userFriends);
  }, []);

  useEffect(() => {
    setSearchResults(userFriends);
  }, [userInfo]);

  async function handleSubmit(e) {
    e.preventDefault();

    let usersToInvite = [];
    for (user of selectedItems) {
      usersToInvite.push(user.id);
    }
    usersToInvite.push(userId)
    console.log(usersToInvite);
    const data = {
      title: e.target.title.value,
      description: e.target.description.value,
      id: chatRooms.length + 1,
      type: "general",
      seenBy: [],
      isPublic: isPublic,
      users: isPublic ? [userId] : usersToInvite,
      created_by: userInfo.username,
      created_by_id: userId,
      prevMessages: [],
    };
    const res = await fetch("/api/chats/rooms/newroom", {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "content-type": "application/json" },
    });
    if (!res.ok) {
      setErrorMessage("A room with that name already exists!");
    } else {

      const webSocketMessage = {
        type = "UPDATE_ROOM",
        user_id: userId,
        room_id: roomId
      }
      if (webSocket) {
        webSocket.send(JSON.stringify())
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
      const results = userFriends.filter((item) =>
        item.username.toLowerCase().includes(event.target.value.toLowerCase())
       || item.email.toLowerCase().includes(event.target.value.toLowerCase())
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
    setSelectedItems(selectedItems.filter(i => i !== item));
  };

  const handleFocus = () => {
    setShowResults(true);
  };

  const handleBlur = (e) => {
    // Add a delay to allow item click before hiding the results
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
            <select onChange={handleSelectionChange} defaultValue="public">
              <option value="public">Public</option>
              <option value="private">Private</option>
            </select>
          </div>
        </div>
        <div style={{ textAlign: "start" }}>
          <textarea name="description" placeholder="Write a description for the room" required />
        </div>
        <div className={`submit-form-bottom-section-${isPublic ?  "is-public" : "not-public"}`}>
          {!isPublic && (
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
                <div
                  className="search-container"
                  ref={searchContainerRef}
                  onFocus={handleFocus}
                  onBlur={handleBlur}
                  style={{display: "flex", flexDirection: "column", alignItems: "start"}}
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
                        <li key={result.id} onClick={() => handleItemClick(result)} style={{display: "flex", gap: "20px"}}>
                          <h4>{result.username}</h4> <i>{`(${result.email})`}</i>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="selected-items">
                    {selectedItems.map((item, index) => (
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
            <button type="submit" >Create room</button>
        </div>
        {errorMessage && <h1 style={{ color: "red" }}>{errorMessage}</h1>}
      </form>
    </div>
  );
}
