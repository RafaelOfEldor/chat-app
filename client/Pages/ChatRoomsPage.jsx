import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { VscAccount, VscSend  } from "react-icons/vsc";
import "./css/chatRoomsPage.css"
import "./css/loadingAndFiller.css"

export default function ChatRoomsPage() {
  const { username, userId, setUsername, setWebSocket, webSocket, loadUser } =
    useAuth();
  const navigate = useNavigate()
  const location = useLocation()

  return username ? <ChatRooms /> : 
  <div style={{display: "flex", gap: "40px", color: "white"}}>
    <h1>Please log in</h1>
    <button onClick={() => navigate("/login")}
    style={{width: "150px", height: "50px", fontSize: "1.3rem"}}
      >Login</button>
  </div>
}

export function ChatRooms() {
  // return username ? <ChatApplication /> : <h1>Please log in</h1>;
  const [chatRooms, setChatRooms] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [newSendMessage, setNewSendMessage] = useState();
  const [allUsers, setAllUsers] = React.useState([]);
  const {
    username,
    setUsername,
    userId,
    userInfo,
    setWebSocket,
    userFriends,
    webSocket,
    fetchUserInfo,
    loadUser,
  } = useAuth();
  const [receivingUser, setReceivingUser] = React.useState([]);
  const [initiateChat, setInitiateChat] = React.useState(false);
  const [logsRendered, setLogsRendered] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState();
  const navigate = useNavigate()

  async function fetchRooms() {
    fetch(`/api/chats/rooms`).then((response) =>
      response.json().then((data) => {
        setChatRooms(data);
      }),
    );
  }

  async function fetchAllUsers() {
    fetch(`/api/users/get/allusers`).then((response) =>
      response.json().then((data) => {
        setAllUsers(data);
        console.log(data);
      }),
    );
  }

  React.useEffect(() => {
    fetchAllUsers();
    fetchUserInfo();
  }, []);

  React.useEffect(() => {
    if (newSendMessage?.receiving_user) {
      webSocket.send(JSON.stringify(newSendMessage));
    }
  }, [newSendMessage]);

  useEffect(() => {
    console.log(chatRooms);
  }, [chatRooms])

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
    if (item?.isPublic || item?.users.find(a => a === userId)) {
    return (
      <div key={index} className="chat-room-card full-element">
        <div className="chat-room-card div">
        <Link to={`/chatrooms/room/${item.id}`} state={{prevUrl: location.pathname}} className="chat-room-card link">
          <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
            <h2 className="chatroom-card-title">{item.title}</h2>
            <h4 style={{minHeight: "20px"}}>{item.description !== "" ? 
              <i>{item.description.slice(0, 21)}<br/>{item.description.slice(21, 40)}{item.description.length > 40 && "..."}</i>
              :
              <i style={{fontWeight: "100"}}>no description</i>}
            </h4>
            <h4 className="red" style={{fontWeight: "100", letterSpacing: "1"}}>
              Created by:
            {userId === item.created_by_id ? <i style={{ color: "cyan"}}> You</i>: <t style={{ color: "white"}}> {item.created_by}</t>}
              {/* Created by: {item.created_by}
              {userId === item.created_by_id && item.created_by !== userInfo?.username && (
                <p style={{ color: "indigo" }}> (old username)</p>
              )}
              {userId === item.created_by_id && (
                <p style={{ color: "orange", fontWeight: "bold" }}> (You)</p>
              )} */}
            </h4>
          </div>
        </Link>
        </div>
          {userId === item.created_by_id && (
            <div style={{display: "flex", width: "100%", height: "auto", justifyContent: "center"}}>
              <Link to={`/newroom/editroom?roomid=${item.id}`} className="chat-room-card-editlink">
                Edit
              </Link>
              <button style={{width: "50%"}} className="chat-room-card-delete-button">
              Delete
              </button>
            </div>
          )}
      </div>
      )}
    });

    const directMessagesElement = chatRooms.map((item, index) => {
      if (item?.type !== "dm") return;
      if (item?.users?.length !== 2) return;
      if (item?.users?.includes(userId)) {
        const otherDmUser = item?.users?.find(user => user !== userId)
        const user = allUsers?.find(user => (user.id === otherDmUser))
      return (
          <Link to={`/chatrooms/room/${item.id}`} state={{prevUrl: location.pathname}} className="chat-room-dm-link">
            <div className="chat-room-dm-link-content">
              <VscAccount style={{scale: "2"}}/>
              <div>
                <h4>{user?.username}</h4>
                <i>{user?.email}</i>
              </div>
            </div>
            <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "99%", gap: "20px",  borderStyle: "solid", borderRadius: "10px",
            borderWidth: "1px", color: "rgba(69, 218, 190, 0.3)"}}
          ></div>
          </Link>
        )}
      });
  return chatRoomsElement.length > 0 ? (
    <div className="chat-rooms-page">
      
      
      <div style={{display: "flex", gap: "0", height: "100%"}}>
        <div className="chat-rooms-list-container">  
        <h1 style={{ marginLeft: "2vw"}}>Chat rooms</h1>
          <div className="chat-rooms-list">
            {chatRoomsElement}
          </div>
          <div className="new-room-button-div">
              <Link to="/newroom" className="new-room-button">
                <h3>Create new room +</h3>
              </Link>
            </div>
        </div>
        <div className="direct-messages-sidebar">
          <h2 style={{marginBottom: "10px", position: "sticky", top: "0", 
            backgroundColor: "rgba(68, 72, 119, 1)",
            marginLeft: "auto", width: "100%", zIndex: "100", color: "#009bcb",
            borderBottom: "solid 1px #151A1E", boxShadow: "0 4px 2px -2px rgba(0, 0, 0, 0.4)"
          }}>Direct messages</h2>
          {directMessagesElement?.length > 0 ? directMessagesElement : <i style={{marginTop: "10px"}}>You currently have no direct messages.</i>}
          </div>
      </div>
      
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
