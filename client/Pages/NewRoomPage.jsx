import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { ExpressChatroomPost } from "../functions/ExpressFunctions.jsx";
import "./css/newRoomPage.css"

export default function ChatRoomsPage() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } =
    useAuth();

  return username ? <ChatRooms /> : <h1>Please log in</h1>;
}

export function ChatRooms() {
  // return username ? <ChatApplication /> : <h1>Please log in</h1>;
  const [chatRooms, setChatRooms] = useState([]);
  const [isPublic, setIsPublic ] = useState(true)
  const {
    username,
    setUsername,
    userInfo,
    userId,
    setWebSocket,
    webSocket,
    fetchUserInfo,
    loadUser,
  } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState();
  const navigate = useNavigate();

  async function fetchRooms() {
    fetch(`/api/chats/rooms`).then((response) =>
      response.json().then((data) => {
        // console.log(data);
        setChatRooms(data);
      }),
    );
  }

  React.useEffect(() => {
    fetchRooms();
    fetchUserInfo();
  }, []);

  // console.log(chatRooms);

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      title: e.target.title.value,
      description: e.target.description.value,
      id: chatRooms?.length + 1,
      type: "general",
      isPublic: true,
      users: [userId],
      created_by: userInfo?.username,
      created_by_id: userId,
    };
    const res = await fetch("/api/chats/rooms/newroom", {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "content-type": "application/json",
      },
    });
    if (!res.ok) {
      setErrorMessage("A room with that name already exists!");
    } else if (res.ok) {
      navigate("/chatrooms");
    }
  }

  const handleSelectionChange = (event) => {
    setIsPublic(event.target.value === 'public');
  };

  return (
    <div className="create-new-room-page">
      <form className="create-new-room-form" onSubmit={handleSubmit}>
        <div>
          <h2>Enter a title:</h2>
          <input name="title" />
        </div>
        <div>
          <h2>Enter a description:</h2>
          <textarea
            name="description"
          />
        </div>
        <div style={{display: "flex", width: "100%", justifyContent: "space-between"}}>
          <select onChange={handleSelectionChange} defaultValue="public" style={{display: "flex", alignItems: "center", textAlign: "start", justifyContent: "center",
          marginLeft: "40px"
          }}>
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button style={{marginRight: "40px"}}>
            Create room
          </button>
        </div>
        {errorMessage && <h1 style={{ color: "red" }}>{errorMessage}</h1>}
      </form>
    </div>
  );
}
