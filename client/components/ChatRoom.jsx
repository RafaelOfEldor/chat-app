import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import "./chatpage.css";

export default function ChatRoom() {
  const { username } = useAuth();

  return username ? <Chat /> : <h1>Please log in</h1>;
}

export function Chat() {
  const { roomid } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSendMessage, setNewSendMessage] = useState();
  const { userInfo, userId, setWebSocket, webSocket, fetchUserInfo } = useAuth();
  const [chatRoom, setChatRoom] = useState();
  const [logsRendered, setLogsRendered] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState();
  const navigate = useNavigate();

  async function fetchRoom() {
    const response = await fetch(`/api/chats/room/${roomid}`);
    const data = await response.json();
    setChatRoom(data[0]);
  }

  async function fetchLog() {
    const res = await fetch(`/api/chats/log/${userId}/${roomid}`);
    if (res.status === 204) {
      setMessages([]);
    } else {
      const data = await res.json();
      setMessages(data);
    }
  }

  useEffect(() => {
    fetchRoom();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const webSocket = new WebSocket(
      window.location.origin.replace(/^http/, "ws") +
        `?roomid=${roomid}&userid=${userId}`
    );

    webSocket.addEventListener("open", () => {
      const joinEventData = { type: "join", chat_room: roomid };
      webSocket.send(JSON.stringify(joinEventData));
    });

    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "edited" || data?.type === "deleted") {
        fetchLog();
      } else if (data.type === "new-message") {
        if (data.messages[data.messages.length - 1].chat_room === parseInt(roomid)) {
          setMessages((prev) => [...prev, data.messages[data.messages.length - 1]]);
        }
      }
    };

    setWebSocket(webSocket);

    return () => {
      webSocket.close();
    };
  }, [roomid, userId]);

  useEffect(() => {
    if (!logsRendered) {
      fetchLog();
      setLogsRendered(true);
    }
  }, [logsRendered]);

  useEffect(() => {
    if (newSendMessage?.sending_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  function handleSubmit(e) {
    e.preventDefault();
    setNewSendMessage({
      sending_user: userInfo?.username,
      sending_user_id: userId,
      chat_room: parseInt(roomid),
      edited: false,
      deleted: false,
      message_id: messages.length + 1,
      message: newMessage,
      date: new Date().toString(),
    });
    setNewMessage("");
  }

  function handleEditMessage(e, messageId) {
    e.preventDefault();
    setShowEditMessage();
    setNewSendMessage({
      sending_user: userInfo?.username,
      sending_user_id: userId,
      chat_room: parseInt(roomid),
      edited: true,
      deleted: false,
      message_id: messageId,
      message: e.target.updatedMessage.value,
      date: new Date().toString(),
    });
  }

  function handleDeleteMessage(e, messageId) {
    e.preventDefault();
    setShowEditMessage();
    setNewSendMessage({
      sending_user: userInfo?.username,
      sending_user_id: userId,
      chat_room: parseInt(roomid),
      edited: true,
      deleted: true,
      message_id: messageId,
      message: "",
      date: new Date().toString(),
    });
  }

  function handleLeave(e) {
    e.preventDefault();
    setMessages([]);
    setLogsRendered(false);
    navigate("/chatrooms");
  }

  const messageElements = messages.map((item, index) => (
    <div key={index} className="chat-message">
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "left" }}>
        <h5>{new Date(item?.date).toLocaleString()}</h5>
        <h2>{item?.sending_user}: </h2>
      </div>
      <div style={{ display: "flex", gap: "20px" }}>
        {showEditMessage?.show && showEditMessage?.id === item?.message_id ? (
          <form onSubmit={(e) => handleEditMessage(e, item?.message_id)}>
            <input name="updatedMessage" />
            <button>submit</button>
          </form>
        ) : (
          <h3>
            {!item?.deleted ? item?.message : <i style={{ color: "red" }}>message was deleted by user</i>}
            {!item?.deleted && item?.edited ? <i style={{ fontWeight: "bold" }}> (edited)</i> : null}
          </h3>
        )}
        {userId === item?.sending_user_id && (
          <div>
            <button onClick={() => setShowEditMessage((prev) => ({ show: !prev?.show, id: item?.message_id }))}>
              Edit message
            </button>
            <button onClick={(e) => handleDeleteMessage(e, item?.message_id)}>Delete message</button>
          </div>
        )}
      </div>
    </div>
  ));

  return chatRoom?.title ? (
    <div className="chat-page">
      <h1>{chatRoom?.title}</h1>
      <div className="chatroom-list">{messageElements}</div>
      <div className="title-div chat">
        <form onSubmit={handleSubmit}>
          <input
            placeholder="Send a message"
            name="addMessage"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ width: "200px", height: "40px" }}
          />
          <button disabled={newMessage === ""} style={{ height: "40px", width: "100px" }}>
            Send message
          </button>
        </form>
        <button onClick={handleLeave} style={{ height: "40px", width: "100px", marginTop: "40px", color: "red" }}>
          Leave chat
        </button>
      </div>
    </div>
  ) : (
    <div className="loading-results-layout-div">
      <h1>Loading chat...</h1>
    </div>
  );
}
