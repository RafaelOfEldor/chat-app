import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { useSearchParams, useParams, useNavigate } from "react-router-dom";
import { FiEdit3, FiTrash2, FiXCircle } from "react-icons/fi";
import "./css/chatpage.css";

export default function DirectMessagesRoom() {
  const { username } = useAuth();

  return username ? <Chat /> : <h1>Please log in</h1>;
}

export function Chat() {
  const { receivinguser } = useParams();
  const [messages, setMessages] = useState([]);
  const [receivingUser, setReceivingUser] = React.useState([]);
  const [initiateChat, setInitiateChat] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [chatLoaded, setChatLoaded] = useState(false);
  const [newSendMessage, setNewSendMessage] = useState();
  const { userInfo, username, userId, setWebSocket, webSocket, fetchUserInfo } = useAuth();
  const [chatRoom, setChatRoom] = useState();
  const [logsRendered, setLogsRendered] = useState(false);
  const [showEditMessage, setShowEditMessage] = useState();
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const today = new Date().toLocaleDateString();
  const chatroomRef = useRef(null);

  async function fetchRoom() {
    const res = await fetch(`/api/chats/log/${userId}/${receivinguser}/1`);
    console.log(res);
    if (res.status === 200) {
      setChatLoaded(true)
      const data = await res.json();
      setChatRoom(data[0]);
      console.log(data);
    } else if (res.status === 204) {
      console.log("No messages in this chat yet");
      setChatLoaded(true);
    } else {

    }
  }

  async function handleChat(e) {
    e.preventDefault();
    try {
      setLogsRendered(false);
      setMessages([]);
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

  async function fetchLog() {
    console.log(receivingUser)
    if (messages?.length < 0) {
      setChatLoaded(false)
    }
    const res = await fetch(`/api/chats/log/${userId}/${receivinguser}/${1}`);
    if (res.status === 204) {
      setMessages([]);
      setChatLoaded(true)
    } else {
      const data = await res.json();
      console.log(data)
      setMessages(data);
      setChatLoaded(true)
    }
  }

  async function fetchReceivingUser() {
    console.log("receiving user:", receivinguser);
    const res = await fetch(`/api/users/byid/${receivinguser}`)
    console.log(res);
    if (res.ok) {
      const data = await res.json();
      console.log(data);
      setReceivingUser(data);
      setChatLoaded(true)
    } else {
      console.log(res);
      setMessages([]);
      setChatLoaded(true)
    }
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
    fetchReceivingUser();
    console.log("stuff");
    console.log("receiving user:", receivingUser);
    console.log("chatLoaded", chatLoaded);
  }, []);

  useEffect(() => {
    if (showEditMessage?.show) {
      inputRef.current?.focus();
    }
  }, [showEditMessage]);

  useEffect(() => {
    const webSocket = new WebSocket(
      window.location.origin.replace(/^http/, "ws") +
      `?receivinguser=${receivinguser}&&userid=${userId}`,
    );

    webSocket.addEventListener("open", () => {
      const joinEventData = { type: "join", sending_user: userId, receiving_user: receivinguser };
      webSocket.send(JSON.stringify(joinEventData));
    });
    // webSocket.onmessage = (event) => {
    //   const data = JSON.parse(event.data);
    //   console.log(data[data.length]);
    //   console.log(data[data.length - 1]);
    //   setMessages((prev) => [...prev, data[data.length - 1]]);
    // };

    webSocket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data?.type === "edited" || data?.type === "deleted") {
        fetchLog();
      } else if (data.type === "new-message") {
        if (data.messages[data.messages.length - 1].sending_user_id === userId || data.messages[data.messages.length - 1].sending_user_id === receivinguser ) {
          setMessages((prev) => [...prev, data.messages[data.messages.length - 1]]);
        } 
      }
    };
    setWebSocket(webSocket);
  }, []);

  useEffect(() => {
    if (!logsRendered) {
      fetchLog();
      setLogsRendered(true);
    }
  }, [logsRendered]);

  useEffect(() => {
    console.log("bruh")
    if (newSendMessage?.sending_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  function handleSubmit(e) {
    e.preventDefault();
    setNewSendMessage({
      sending_user: username,
      receiving_user: receivingUser.username,
      sending_user_id: userId,
      receiving_user_id: receivingUser.id,
      edited: false,
      deleted: false,
      chat_id: 1,
      message_id: messages.length + 1,
      message: newMessage,
      date: new Date().toString(),
    });
    setInitiateChat(true);
    setNewMessage("");
    console.log(newSendMessage);
  }

  useEffect(() => {
    console.log(newSendMessage);
  }, [newSendMessage])

  function handleEditMessage(e, messageId) {
    e.preventDefault();
    setShowEditMessage();
    setNewSendMessage({
      sending_user: username,
      receiving_user: receivingUser.username,
      sending_user_id: userId,
      receiving_user_id: receivingUser.id,
      chat_id: 1,
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
      sending_user: username,
      receiving_user: receivingUser.username,
      sending_user_id: userId,
      receiving_user_id: receivingUser.id,
      chat_id: 1,
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

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
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
    const [day, month, year] = dateString.split('.').map(Number);
  
    // Create a new Date object
    const date = new Date(year, month - 1, day); // Note: month is zero-based
  
    // Array of month names
    const monthNames = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
  
    // Format the result as "Month Day, Year"
    return `${monthNames[month - 1]} ${day}, ${year}`;
  }

  let displayedDates = new Set();

  const messageElements = messages?.map((item, index) => {
    const messageDate = new Date(item?.date).toLocaleDateString();
        const isFirstMessageOfDate = !displayedDates.has(messageDate);
        if (isFirstMessageOfDate) {
          displayedDates.add(messageDate);
        }

    return (
      <div key={index}>
        {isFirstMessageOfDate && (
        <div style={{paddingTop: "25px", paddingBottom: "25px"}}>
          <h2 style={{}}>
              {messageDate === today?
              "Today" : `${formatDateString(String(new Date(item?.date).toLocaleString().split(',')[0]))}`
            }
          </h2>
        </div>
        )
        }
        <div key={index} className="chat-message">
          
          {userId === item?.sending_user_id ?
          
          <div className="message self">
              <div style={{display: "flex", textAlign: "center", alignItems: "center", gap: "15px", transform: "translate(-30px, 0)"}}>
                <h3 style={{fontWeight: "100"}}>{item?.sending_user},</h3>
                <h4 style={{fontWeight: "100", marginTop: "1px"}}>
                  {new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[0]}:
                  {new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[1]}
                  <t style={{fontWeight: "100", marginLeft: "5px", marginTop: "1px"}}>
                {Number(new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[0]) <= 12 ?
                  "AM" : "PM"}
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
                <h4 style={{fontWeight: "100", whiteSpace: "pre-wrap"}}>
                  {!item?.deleted ? item?.message : <i style={{ color: "red" }}>message was deleted by user</i>}
                </h4>
              )}
              
              </div>
              
              
            </div>
            {!item?.deleted && item?.edited ? <i style={{ fontWeight: "100", marginRight: "auto" }}> edited</i> : null}
            {userId === item?.sending_user_id && (
              
                <div style={{marginLeft: "auto", display: "flex", gap: "20px", marginTop: "10px"}}>
                  
                  {showEditMessage?.show && showEditMessage?.id === item?.message_id ? 
                  <FiXCircle onClick={() => setShowEditMessage((prev) => ({ show: !prev?.show, id: item?.message_id }))}
                  className="edit-button"/>
                  :
                  <FiEdit3 onClick={() => setShowEditMessage((prev) => ({ show: !prev?.show, id: item?.message_id }))}
                    className="edit-button"/>
                  }
                  <FiTrash2 onClick={(e) => handleDeleteMessage(e, item?.message_id)}
                    className="delete-button"/>
                </div>
                )}
          </div> 
        :
        <div className="message other">
          <div style={{display: "flex", textAlign: "center", alignItems: "center", gap: "15px"}}>
                <h3 style={{fontWeight: "100"}}>{item?.sending_user},</h3>
                {/* <h4 style={{fontWeight: "100", marginTop: "1px"}}>
                  {new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[0]}:
                  {new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[1]}
                  <t style={{fontWeight: "100", marginLeft: "5px", marginTop: "1px"}}>
                {Number(new Date(item?.date).toLocaleString().split(',').map(part => part.trim())[1].split(':').map(part => part.trim())[0]) <= 12 ?
                  "AM" : "PM"}
                </t>
                </h4> */}
                
              </div>
          <div  className="message content other"> 
            <div style={{ display: "flex", gap: "20px" }}>
              {showEditMessage?.show && showEditMessage?.id === item?.message_id ? (
                <form onSubmit={(e) => handleEditMessage(e, item?.message_id)}>
                  <input name="updatedMessage" />
                  <button>submit</button>
                </form>
              ) : (
                <h4 style={{fontWeight: "100"}}>
                  {!item?.deleted ? item?.message : <i style={{ color: "red" }}>message was deleted by user</i>}
                </h4>
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
          {!item?.deleted && item?.edited ? <i style={{ fontWeight: "100", marginLeft: "20px" }}> edited</i> : null}
          
        </div>
        }
        
        </div>
    </div>
    )
  });

  return chatLoaded ? 
      (
    <div className="chat-page" style={{textAlign: "center"}}>
      <div style={{textAlign: "start", backgroundColor: "grey"}}>
        <div style={{display: "flex", alignItems: "center"}}>
          <h1 style={{marginRight: "auto", marginLeft: "50px", marginTop: "20px"}}>{chatRoom?.title}</h1>
          <button className="leave-chat-button" onClick={(e) => handleLeave(e)} style={{marginTop: "20px", marginRight: "50px"}}>Leave chat</button>
        </div>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "auto", gap: "20px", marginTop: "20px", borderStyle: "solid", borderRadius: "10px",
          borderWidth: "1px", color: "rgba(176, 176, 176, 0.84)"}}
          >

        </div>
      </div>
      <div className="chatroom-list" ref={chatroomRef}>{messageElements?.length > 0 ? messageElements : <i>New chat</i>}</div>
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
          <button style={{color: "white"}}  disabled={newMessage.trim() === ""} >
            Send message {"->"}
          </button>
        </form>
      </div>
    </div>
  ) :
  (
    <div>
      <h1 style={{marginTop: "50vh", marginLeft: "45vw", transform: "translate(-50%, -50%)", color: "white"}}>Loading chat...</h1>
    </div>
  )
}