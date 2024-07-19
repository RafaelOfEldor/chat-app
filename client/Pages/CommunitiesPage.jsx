import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import "./css/communitiesPage.css";
import "./css/loadingAndFiller.css";

export default function CommunitiesPage() {
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
  // return username ? <ChatApplication /> : <h1>Please log in</h1>;
  const [chatRooms, setChatRooms] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSendMessage, setNewSendMessage] = useState();
  const {
    username,
    setUsername,
    userId,
    userInfo,
    setWebSocket,
    webSocket,
    fetchUserInfo,
    loadUser,
  } = useAuth();
  const [receivingUser, setReceivingUser] = React.useState([]);
  const [initiateChat, setInitiateChat] = React.useState(false);
  const [logsRendered, setLogsRendered] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState();
  const navigate = useNavigate();

  async function fetchRooms() {
    fetch(`/api/chats/rooms`).then((response) =>
      response.json().then((data) => {
        setChatRooms(data);
      }),
    );
  }

  React.useEffect(() => {
    if (newSendMessage?.receiving_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  React.useEffect(() => {
    fetchRooms();
    fetchUserInfo();
  }, []);

  async function handleChat(e) {
    e.preventDefault();
    try {
      setLogsRendered(false);
      await fetch(`api/users/${e.target.addMessage.value.toLowerCase()}`).then(
        (res) => {
          if (!res.ok) {
            console.log("error");
            setErrorMessage("User was not found :/");
          } else if (res.ok) {
            setErrorMessage();
            console.log("success");
            res.json().then((data) => {
              setReceivingUser(data);
            }),
              setInitiateChat(true);
          }
        },
      );
    } catch (error) {
      console.error(error);
    }
  }

  function handleLeave(e) {
    e.preventDefault();
    setReceivingUser([]);
    setInitiateChat(false);
    setLogsRendered(false);
  }

  const chatRoomsElement = chatRooms.map((item, index) => {
    if (item?.type === "dm") return;
    if (item?.isPublic || item?.users.find((a) => a === userId)) {
      return (
        <div key={index} className="community-room-card full-element">
          <div className="community-room-card div">
            <Link
              to={`/chatrooms/room/${item.id}`}
              className="community-room-card link"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <h2 className="chatroom-card-title">{item.title}</h2>
                <h4 style={{ minHeight: "20px" }}>
                  {item.description !== "" ? (
                    <i>{item.description}</i>
                  ) : (
                    <i>no description...</i>
                  )}
                </h4>
                <h4
                  className="red"
                  style={{ fontWeight: "100", letterSpacing: "1" }}
                >
                  Created by: {item.created_by}
                  {userId === item.created_by_id &&
                    item.created_by !== userInfo?.username && (
                      <p style={{ color: "indigo" }}> (old username)</p>
                    )}
                  {userId === item.created_by_id && (
                    <p style={{ color: "orange", fontWeight: "bold" }}>
                      {" "}
                      (You)
                    </p>
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
              <Link
                to={`/newroom/editroom?roomid=${item.id}`}
                className="community-room-card-editlink"
              >
                Edit
              </Link>
              <button
                style={{ width: "50%" }}
                className="community-room-card-delete-button"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      );
    }
  });

  return chatRoomsElement.length > 0 ? (
    <div className="community-rooms-page">
      <h1 style={{ left: "50vw" }}>Chat rooms:</h1>
      <div className="community-rooms-list">{chatRoomsElement}</div>
      <Link to="/newroom" className="new-room-button-communities">
        <h3>Create new room +</h3>
      </Link>
    </div>
  ) : chatRooms ? (
    <div className="loading-results-layout-div">
      <h1> Loading chatrooms... </h1>
    </div>
  ) : (
    <div className="loading-results-layout-div">
      <h1> There are currently no opne chat rooms. </h1>
    </div>
  );
}
