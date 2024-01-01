import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";

export default function ChatRoom() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } =
    useAuth();

  return username ? <Chat /> : <h1>Please log in</h1>;
}

export function Chat() {
  const [searchParams, setSearchParams] = useSearchParams();
  // const chatId = searchParams.get("chatid");
  const { roomid } = useParams();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [updatedMessage, setUpdatedMessage] = useState("");
  const [chatRoom, setChatRoom] = useState();
  const [newSendMessage, setNewSendMessage] = useState();
  const {
    username,
    setUsername,
    userId,
    userInfo,
    fetchUserInfo,
    setWebSocket,
    webSocket,
    loadUser,
  } = useAuth();
  const [receivingUser, setReceivingUser] = React.useState();
  const navigate = useNavigate();
  const [initiateChat, setInitiateChat] = React.useState(false);
  const [logsRendered, setLogsRendered] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState();
  const [showEditMessage, setShowEditMessage] = React.useState();

  async function fetchRoom() {
    fetch(`/api/chats/room/${roomid}`).then((response) =>
      response.json().then((data) => {
        setChatRoom(data[0]);
      }),
    );
  }

  React.useEffect(() => {
    fetchRoom();
    fetchUserInfo();
  }, []);

  useEffect(() => {
    const webSocket = new WebSocket(
      window.location.origin.replace(/^http/, "ws") +
        `?roomid=${roomid}&userid=${userId}`,
    );

    webSocket.addEventListener("open", () => {
      const joinEventData = {
        type: "join",
        chat_room: roomid,
      };
      webSocket.send(JSON.stringify(joinEventData));
    });

    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "edited" || data?.type === "deleted") {
        fetchLog();
      } else if (data.type === "new-message") {
        // console.log(data.messages[data.messages.length - 1].chat_room);
        // console.log(roomid);
        if (
          data.messages[data.messages.length - 1].chat_room === parseInt(roomid)
        ) {
          setMessages((prev) => [
            ...prev,
            data.messages[data.messages.length - 1],
          ]);
        }
      }
    };

    setWebSocket(webSocket);

    return () => {
      webSocket.close();
    };
  }, []);

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
    setNewMessage("");
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
    setNewMessage("");
  }

  async function fetchLog() {
    const res = await fetch(`/api/chats/log/${userId}/${roomid}`);

    if (res.status === 204) {
      setInitiateChat(true);
    } else {
      const data = await res.json();
      setMessages(data);
    }
  }
  React.useEffect(() => {
    if (newSendMessage?.sending_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  React.useEffect(() => {
    if (!logsRendered) {
      fetchLog();
    }
  }, [logsRendered]);

  React.useEffect(() => {
    fetchLog();
    setLogsRendered(true);
  }, []);

  function handleLeave(e) {
    e.preventDefault();
    setMessages([]);
    setLogsRendered(false);
    navigate("/chatrooms");
  }

  const messageElements = messages.map((item, index) => {
    return (
      <div key={index} className="chat-message">
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "left",
          }}
        >
          <h5>
            {item?.date.split(" ")[0] +
              " " +
              item?.date.split(" ")[1] +
              " " +
              item?.date.split(" ")[2] +
              " " +
              item?.date.split(" ")[3] +
              " " +
              item?.date.split(" ")[4]}
            :
          </h5>
          <h2> {item?.sending_user}: </h2>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {showEditMessage?.show === true &&
          showEditMessage?.id === item?.message_id ? (
            <form onSubmit={(e) => handleEditMessage(e, item?.message_id)}>
              <input name="updatedMessage" />
              <button>submit</button>
            </form>
          ) : (
            <h3>
              {" "}
              {!item?.deleted ? (
                item?.message
              ) : (
                <i style={{ color: "red" }}>{`message was deleted by user`}</i>
              )}
              {!item?.deleted && item?.edited ? (
                <i style={{ fontWeight: "bold" }}>{` (edited)`}</i>
              ) : null}{" "}
            </h3>
          )}
          {userId === item?.sending_user_id && (
            <div>
              <button
                onClick={() =>
                  setShowEditMessage((prev) => {
                    if (!prev?.show) {
                      return { show: true, id: item?.message_id };
                    } else {
                      return { show: false, id: item?.message_id };
                    }
                  })
                }
              >
                Edit message
              </button>
              <button onClick={(e) => handleDeleteMessage(e, item?.message_id)}>
                Delete message
              </button>
            </div>
          )}
        </div>
      </div>
    );
  });

  return chatRoom?.title ? (
    <div style={{ height: "700px" }}>
      <h1
        style={{
          marginLeft: "50vw",
          transform: "translate(-50%)",
          display: "flex",
          justifyContent: "center",
        }}
      >
        {chatRoom?.title}
      </h1>
      <div className="chatroom-list">{messages && messageElements}</div>
      <div className="title-div chat">
        <form
          style={{
            display: "flex",
            maxWidth: "50vw",
            justifyContent: "center",
            alignItems: "center",
          }}
          onSubmit={handleSubmit}
        >
          <input
            placeholder="Send a message"
            name="addMessage"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            style={{ width: "200px", height: "40px", display: "flex" }}
          />
          <button
            style={{ height: "40px", width: "100px" }}
            disabled={newMessage === "" ? true : false}
          >
            Send message
          </button>
        </form>
        <button
          style={{
            height: "40px",
            width: "100px",
            marginTop: "40px",
            backgroundColor: "",
            color: "red",
            fontSize: "1rem",
          }}
          onClick={handleLeave}
        >
          Leave chat
        </button>
      </div>
    </div>
  ) : (
    <div className="lodaing-results-layout-div">
      <h1> Loading chat... </h1>
    </div>
  );
}
