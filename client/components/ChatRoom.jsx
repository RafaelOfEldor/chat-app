import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useParams, useNavigate, useLocation } from "react-router-dom";
import { FiEdit3, FiTrash2, FiXCircle } from "react-icons/fi";
import "./css/chatpage.css";
import { useWebSocket } from "../context/WebSocketContext";

export default function ChatRoom() {
  const { username } = useAuth();

  const navigate = useNavigate();

  return username ? (
    <Chat />
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}

export function Chat() {
  const { roomid } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatLoaded, setChatLoaded] = useState(false);
  const [newSendMessage, setNewSendMessage] = useState();
  const { userInfo, userId, allUsers, fetchAllUsers, updateChatRooms, fetchUserInfo } = useAuth();
  const [chatRoom, setChatRoom] = useState(null);
  const [dmTitle, setDmTitle] = useState("");
  const [logsRendered, setLogsRendered] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState();
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const today = new Date().toLocaleDateString();
  const chatroomRef = useRef(null);
  const [webSocket, setWebSocket] = useWebSocket();

  async function fetchRoom() {
    const response = await fetch(`/api/chats/room/${roomid}`);
    const data = await response.json();

    if (!data[0].isPublic && !data[0].users.includes(localStorage.getItem("userId"))) {
      navigate("/chatrooms");
      return;
    }

    setChatRoom(data[0]);

    if (data[0].type === "dm") {
      const receivingUser = data[0].users?.find((user) => user !== userId);
      await fetch(`/api/users/byid/${receivingUser}`).then((response) =>
        response.json().then((data) => {
          setDmTitle(data?.username);
        }),
      );
    }
  }

  async function fetchLog() {
    if (messages?.length < 0) {
      setChatLoaded(false);
    }
    const res = await fetch(`/api/chats/log/${roomid}`);
    if (res.status === 204) {
      setMessages([]);
      setChatLoaded(true);
    } else {
      const data = await res.json();
      setMessages(data);
      setChatLoaded(true);
    }

    const message = {
      type: "UPDATE_ROOM",
      user_id: userId,
      roomid: roomid,
    };
    webSocket.send(JSON.stringify(message));
  }

  useEffect(() => {
    // Scroll to the bottom of the chatroom
    if (chatroomRef.current) {
      chatroomRef.current.scrollTop = chatroomRef.current.scrollHeight;
    }
  }, [messages]); // Run this effect when messages change

  useEffect(() => {
    fetchRoom();
    fetchUserInfo();
    fetchAllUsers();
  }, []);

  useEffect(() => {}, [chatRoom]);

  useEffect(() => {
    if (showEditMessage?.show) {
      inputRef.current?.focus();
    }
  }, [showEditMessage]);

  useEffect(() => {
    // const webSocket = new WebSocket(
    //   window.location.origin.replace(/^http/, "ws") +
    //     `?roomid=${roomid}&userid=${userId}`
    // );
    if (webSocket) {
      const handleOpen = () => {
        const joinEventData = {
          type: "SEND_MESSAGE",
          subtype: "join",
          chat_room: roomid,
          joining_user: localStorage.getItem("userId"),
        };
        webSocket.send(JSON.stringify(joinEventData));
      };

      const handleMessage = (event) => {
        const data = JSON.parse(event.data);
        if (["new-message", "deleted", "edited"].includes(data.type)) {
          handleReceiveMessage(data);
        } else if (data.type === "UPDATE_ROOM") {
          if (localStorage.getItem("userId") === data.message.id) {
            updateChatRooms(data);
          }
        }
      };

      webSocket.addEventListener("open", handleOpen);
      webSocket.addEventListener("message", handleMessage);

      return () => {
        webSocket.removeEventListener("open", handleOpen);
        webSocket.removeEventListener("message", handleMessage);
      };

      // setWebSocket(webSocket);
    }
  }, [roomid, userId, webSocket]);

  async function handleReceiveMessage(data) {
    if (data?.type === "edited" || data?.type === "deleted") {
      fetchLog();
    } else if (data.type === "new-message") {
      if (data?.messages[data?.messages?.length - 1]?.chat_room === parseInt(roomid)) {
        setMessages((prev) => [...prev, data.messages[data.messages.length - 1]]);
      }
    }
    const updateElement = {
      joining_user: localStorage.getItem("userId"),
      room_id: roomid,
    };
    const res = await fetch("/api/chats/updateview", {
      method: "PUT",
      body: JSON.stringify(updateElement),
      headers: {
        "content-type": "application/json",
      },
    });
    if (logsRendered) {
      fetchLog();
    }
  }

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

    if (webSocket) {
      const dataElement = {
        sending_user: userInfo?.username,
        sending_user_id: userId,
        chat_room: parseInt(roomid),
        edited: false,
        deleted: false,
        seenBy: [userId],
        message_id: messages.length + 1,
        message: newMessage,
        date: new Date().toString(),
      };
      const message = {
        type: "SEND_MESSAGE",
        user_id: userId,
        messageElement: dataElement,
        roomid: roomid,
      };
      webSocket.send(JSON.stringify(message));
      setNewMessage("");
    }
  }

  function handleEditMessage(e, messageId) {
    e.preventDefault();
    setShowEditMessage();
    const dataElement = {
      sending_user: userInfo?.username,
      sending_user_id: userId,
      chat_room: parseInt(roomid),
      edited: true,
      deleted: false,
      seenBy: [userId],
      message_id: messageId,
      message: e.target.updatedMessage.value,
      date: new Date().toString(),
    };
    const message = {
      type: "SEND_MESSAGE",
      user_id: userId,
      messageElement: dataElement,
      roomid: roomid,
    };
    webSocket.send(JSON.stringify(message));
  }

  function handleDeleteMessage(e, messageId) {
    e.preventDefault();

    setShowEditMessage();
    const dataElement = {
      sending_user: userInfo?.username,
      sending_user_id: userId,
      chat_room: parseInt(roomid),
      edited: true,
      deleted: true,
      seenBy: [userId],
      message_id: messageId,
      message: "",
      date: new Date().toString(),
    };
    const message = {
      type: "SEND_MESSAGE",
      user_id: userId,
      messageElement: dataElement,
      roomid: roomid,
    };
    webSocket.send(JSON.stringify(message));
  }

  function handleLeave(e) {
    e.preventDefault();
    setMessages([]);
    setLogsRendered(false);
    navigate(location.state.prevUrl);
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      if (e.shiftKey) {
        return; // Allow newline with Shift + Enter
      } else {
        e.preventDefault(); // Prevent default new line
        if (newMessage.trim() !== "") {
          handleSubmit(e);
          setNewMessage(""); // Reset textarea after submission
        } else {
          setNewMessage(""); // Reset textarea if only whitespace
        }
      }
    }
  };

  function formatDateString(dateString) {
    // Trim the input date string to remove any leading or trailing whitespace
    dateString = dateString.trim();

    // Split the input date string into day, month, and year
    const [day, month, year] = dateString.split(".").map(Number);

    // Create a new Date object
    const date = new Date(year, month - 1, day); // Note: month is zero-based

    // Array of month names
    const monthNames = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Format the result as "Month Day, Year"
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }

  let displayedDates = new Set();

  const messageElements = messages.map((item, index) => {
    const messageDate = new Date(item.date).toLocaleDateString();
    const isFirstMessageOfDate = !displayedDates.has(messageDate);
    if (isFirstMessageOfDate) {
      displayedDates.add(messageDate);
    }

    return (
      <div key={index}>
        {isFirstMessageOfDate && (
          <div style={{ paddingTop: "25px", paddingBottom: "25px" }}>
            <h2 style={{}}>
              {messageDate === today
                ? "Today"
                : `${formatDateString(String(new Date(item?.date).toLocaleString().split(",")[0]))}`}
            </h2>
          </div>
        )}
        <div key={index} className="chat-message">
          {userId === item?.sending_user_id ? (
            <div className="message self">
              <div
                style={{
                  display: "flex",
                  textAlign: "center",
                  alignItems: "center",
                  gap: "15px",
                  transform: "translate(-30px, 0)",
                }}
              >
                <h3 style={{ fontWeight: "100" }}>{item?.sending_user},</h3>
                <h4 style={{ fontWeight: "100", marginTop: "1px" }}>
                  {
                    new Date(item?.date)
                      .toLocaleString()
                      .split(",")
                      .map((part) => part.trim())[1]
                      .split(":")
                      .map((part) => part.trim())[0]
                  }
                  :
                  {
                    new Date(item?.date)
                      .toLocaleString()
                      .split(",")
                      .map((part) => part.trim())[1]
                      .split(":")
                      .map((part) => part.trim())[1]
                  }
                  <t
                    style={{
                      fontWeight: "100",
                      marginLeft: "5px",
                      marginTop: "1px",
                    }}
                  >
                    {Number(
                      new Date(item?.date)
                        .toLocaleString()
                        .split(",")
                        .map((part) => part.trim())[1]
                        .split(":")
                        .map((part) => part.trim())[0],
                    ) <= 12
                      ? "AM"
                      : "PM"}
                  </t>
                </h4>
              </div>
              <div className="message content self">
                <div style={{ display: "flex", gap: "20px" }}>
                  {showEditMessage?.show && showEditMessage?.id === item?.message_id ? (
                    <form onSubmit={(e) => handleEditMessage(e, item?.message_id)}>
                      <input name="updatedMessage" className="edit-message-input" ref={inputRef} />
                      <button>submit</button>
                    </form>
                  ) : (
                    <h4 style={{ fontWeight: "100", whiteSpace: "pre-wrap" }}>
                      {!item?.deleted ? item?.message : <i style={{ color: "red" }}>message was deleted by user</i>}
                    </h4>
                  )}
                </div>
              </div>
              {!item?.deleted && item?.edited ? (
                <i style={{ fontWeight: "100", marginRight: "auto" }}> edited</i>
              ) : null}
              {userId === item?.sending_user_id && (
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    gap: "20px",
                    marginTop: "10px",
                  }}
                >
                  {showEditMessage?.show && showEditMessage?.id === item?.message_id ? (
                    <FiXCircle
                      onClick={() =>
                        setShowEditMessage((prev) => ({
                          show: !prev?.show,
                          id: item?.message_id,
                        }))
                      }
                      className="edit-button"
                    />
                  ) : (
                    <FiEdit3
                      onClick={() =>
                        setShowEditMessage((prev) => ({
                          show: !prev?.show,
                          id: item?.message_id,
                        }))
                      }
                      className="edit-button"
                    />
                  )}
                  <FiTrash2 onClick={(e) => handleDeleteMessage(e, item?.message_id)} className="delete-button" />
                </div>
              )}
            </div>
          ) : (
            <div className="message other">
              <div
                style={{
                  display: "flex",
                  textAlign: "center",
                  alignItems: "center",
                  gap: "15px",
                }}
              >
                <h3 style={{ fontWeight: "100" }}>{item?.sending_user},</h3>
                <h4 style={{ fontWeight: "100", marginTop: "1px" }}>
                  {
                    new Date(item?.date)
                      .toLocaleString()
                      .split(",")
                      .map((part) => part.trim())[1]
                      .split(":")
                      .map((part) => part.trim())[0]
                  }
                  :
                  {
                    new Date(item?.date)
                      .toLocaleString()
                      .split(",")
                      .map((part) => part.trim())[1]
                      .split(":")
                      .map((part) => part.trim())[1]
                  }
                  <t
                    style={{
                      fontWeight: "100",
                      marginLeft: "5px",
                      marginTop: "1px",
                    }}
                  >
                    {Number(
                      new Date(item?.date)
                        .toLocaleString()
                        .split(",")
                        .map((part) => part.trim())[1]
                        .split(":")
                        .map((part) => part.trim())[0],
                    ) <= 12
                      ? "AM"
                      : "PM"}
                  </t>
                </h4>
              </div>
              <div className="message content other">
                <div style={{ display: "flex", gap: "20px" }}>
                  {showEditMessage?.show && showEditMessage?.id === item?.message_id ? (
                    <form onSubmit={(e) => handleEditMessage(e, item?.message_id)}>
                      <input name="updatedMessage" />
                      <button>submit</button>
                    </form>
                  ) : (
                    <h4 style={{ fontWeight: "100" }}>
                      {!item?.deleted ? item?.message : <i style={{ color: "red" }}>message was deleted by user</i>}
                    </h4>
                  )}

                  {userId === item?.sending_user_id && (
                    <div>
                      <button
                        onClick={() =>
                          setShowEditMessage((prev) => ({
                            show: !prev?.show,
                            id: item?.message_id,
                          }))
                        }
                      >
                        Edit message
                      </button>
                      <button onClick={(e) => handleDeleteMessage(e, item?.message_id)}>Delete message</button>
                    </div>
                  )}
                </div>
              </div>
              {!item?.deleted && item?.edited ? <i style={{ fontWeight: "100", marginLeft: "20px" }}> edited</i> : null}
            </div>
          )}
        </div>
      </div>
    );
  });

  return chatLoaded && chatRoom ? (
    <div className="chat-page" style={{ textAlign: "center" }}>
      <div style={{ textAlign: "start", backgroundColor: "grey" }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <h1
            style={{
              marginRight: "auto",
              marginLeft: "50px",
              marginTop: "20px",
            }}
          >
            {chatRoom?.type === "dm" ? dmTitle : chatRoom?.title}
          </h1>
          <button
            className="leave-chat-button"
            onClick={(e) => handleLeave(e)}
            style={{ marginTop: "20px", marginRight: "50px" }}
          >
            Leave chat
          </button>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "auto",
            gap: "20px",
            marginTop: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.84)",
          }}
        ></div>
      </div>
      <div className="chatroom-list" ref={chatroomRef}>
        {messageElements?.length > 0 ? messageElements : <i>New chat</i>}
      </div>
      <div className="title-div chat">
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Send a message"
            name="addMessage"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            className="send-message-input"
          />
          <button style={{ color: "white" }} disabled={newMessage.trim() === ""}>
            Send message {"->"}
          </button>
        </form>
      </div>
    </div>
  ) : (
    <div>
      <h1
        style={{
          marginTop: "50vh",
          marginLeft: "45vw",
          transform: "translate(-50%, -50%)",
          color: "white",
        }}
      >
        Loading chat...
      </h1>
    </div>
  );
}
