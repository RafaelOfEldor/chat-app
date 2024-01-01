import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function ChatRoomsPage() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } =
    useAuth();

  return username ? <ChatRooms /> : <h1>Please log in</h1>;
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
    return (
      <div key={index} className="chat-room-card div">
        <Link to={`/chatrooms/room/${item.id}`} className="chat-room-card link">
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "20px 20px",
            }}
          >
            <h2 style={{ color: "blue" }}>{item.title}</h2>
            <h4 style={{ color: "black" }}>{item.description}</h4>
            <h4 style={{ color: "red", marginBottom: "10px" }}>
              Created by: {item.created_by}
              {userId === item.created_by_id &&
                item.created_by !== userInfo?.username && (
                  <p style={{ color: "indigo" }}> {`(old username)`}</p>
                )}
              {userId === item.created_by_id && (
                <p style={{ color: "blue", fontWeight: "bold" }}> {`(You)`}</p>
              )}
            </h4>
          </div>
        </Link>
        {userId === item.created_by_id && (
          <Link
            to={`/newroom/editroom?roomid=${item.id}`}
            className="chat-room-card editlink"
          >
            Edit
          </Link>
        )}
      </div>
    );
  });

  return chatRoomsElement.length > 0 ? (
    <div className="chat-rooms-page">
      <h1 style={{ marginLeft: "45vw" }}>Chat rooms:</h1>
      <div className="chat-rooms-list">{chatRoomsElement}</div>
      <Link to="/newroom" className="new-room-button">
        <h3>Create new room +</h3>
      </Link>
    </div>
  ) : chatRooms ? (
    <div className="lodaing-results-layout-div">
      <h1> Loading chatrooms... </h1>
    </div>
  ) : (
    <div className="lodaing-results-layout-div">
      <h1> There are currently no opne chat rooms. </h1>
    </div>
  );
}
