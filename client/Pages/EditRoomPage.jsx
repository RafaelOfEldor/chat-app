import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ExpressChatroomPost } from "../functions/ExpressFunctions.jsx";
import "./css/newRoomPage.css";

export default function ChatRoomsPage() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } =
    useAuth();

  return username ? (
    <ChatRooms />
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

export function ChatRooms() {
  const [chatRooms, setChatRooms] = useState([]);
  const [isPublic, setIsPublic] = useState([]);
  const {
    username,
    setUsername,
    userId,
    userInfo,
    setWebSocket,
    webSocket,
    loadUser,
  } = useAuth();
  const [errorMessage, setErrorMessage] = React.useState();
  const [searchParams, setSearchParams] = useSearchParams();
  const roomId = searchParams.get("roomid");
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
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    const data = {
      room_id: roomId,
      new_title: e.target.title.value,
      new_description: e.target.description.value,
      created_by_id: userId,
    };
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
    } else if (res.ok) {
      navigate("/chatrooms");
    }
  }

  const handleSelectionChange = (event) => {
    setIsPublic(event.target.value === "public");
  };

  return (
    <div className="create-new-room-page">
      <form className="create-new-room-form" onSubmit={handleSubmit}>
        <div>
          <h2>Enter new title:</h2>
          <input name="title" />
        </div>
        <div>
          <h2>Enter new description:</h2>
          <textarea name="description" />
        </div>
        <div
          style={{
            display: "flex",
            width: "100%",
            justifyContent: "space-between",
          }}
        >
          <select
            onChange={handleSelectionChange}
            defaultValue="public"
            style={{
              display: "flex",
              alignItems: "center",
              textAlign: "start",
              justifyContent: "center",
              marginLeft: "40px",
            }}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
          <button style={{ marginRight: "40px" }}>Create room</button>
        </div>
        {errorMessage && <h1 style={{ color: "red" }}>{errorMessage}</h1>}
      </form>
    </div>
  );
}
