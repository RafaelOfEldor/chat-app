import React, { useContext, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { ExpressUsersPut } from "../functions/ExpressFunctions.jsx";
import { FiUser, FiUserPlus, FiSearch, FiSend } from "react-icons/fi";
import { VscAccount, VscSend  } from "react-icons/vsc";
import "./css/viewUsersPage.css"
import "./css/loadingAndFiller.css"

export default function ViewUsersPage() {
  const { username, fullName, userBio, userId, mail, loadUser, setUsername } =
    useAuth();
  const [showEdit, setShowEdit] = React.useState(false);
  const [updatedBio, setUpdatedBio] = React.useState("");
  const [allUsers, setAllUsers] = React.useState([]);
  const [isHovering, setIsHovering] = React.useState();
  const [searchQuery, setSearchQuery] = React.useState("");
  const inputRef = useRef(null);

  const navigate = useNavigate();

  async function fetchAllUsers() {
    fetch(`/api/users/get/allusers`).then((response) =>
      response.json().then((data) => {
        setAllUsers(data);
      }),
    );
  }

  React.useEffect(() => {
    fetchAllUsers();
  }, []);

  React.useEffect(() => {
   console.log(allUsers)
    
  }, [allUsers]);

  // React.useEffect(() => {
  //   if(searchedUserProfileElement) {
  //     console.log(searchedUserProfileElement)
  //   }
    
  // }, [searchQuery]);

  async function handleDirectMessageChat(receivingUserId, receivingUserUsername) {

    const res = await fetch(`/api/chats/rooms`)
    

    if (res.ok) {
      const data = await res.json();
      const isDm = data.find(room => {
        if (room.users.length === 2) {
          if (room.users.includes(userId) && room.users.includes(receivingUserId)) {
            return true;
          }
        }
      })
      console.log(isDm)
      console.log(data)
      if (isDm) {
        // navigate(`/chatrooms/room/${isDm.id}`)
      } else {
        const newRoom = {
          title: receivingUserUsername,
          description: "",
          id: data?.length + 1,
          type: "dm",
          isPublic: false,
          users: [userId, receivingUserId],
          created_by: username,
          created_by_id: userId,
        };
        const res = await fetch("/api/chats/rooms/newroom", {
          method: "POST",
          body: JSON.stringify(newRoom),
          headers: {
            "content-type": "application/json",
          },
        });
        if (!res.ok) {
          setErrorMessage("A room with that name already exists!");
        } else if (res.ok) {
          // navigate("/chatrooms");
        }
      }
      
    } else {
      console.error("Couldn't fetch rooms")
    }
    // navigate(`/api/chats/rooms`)
  }

  

  const handleSearchChange = (event) => {
    console.log(searchQuery)
    setSearchQuery(event.target.value);
  };

  const userProfileElement = allUsers.map((item, index) => {
    return (
      <div style={{height: "60px", marginTop: "3px"}}>
        {index === 0 && 
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "auto", gap: "20px", borderStyle: "solid", borderRadius: "10px",
            borderWidth: "1px", color: "rgba(176, 176, 176, 0.5)"}}
          ></div>
        }
        <div className="select-user-profile-card nohover">
          <div className="user-element">
                <VscAccount  style={{scale: "1.5", marginLeft: "10px"}}/>
                <h4 style={{fontSize: "1.2rem", fontWeight: "300"}}>
                  {item.username}
                </h4>
                <i style={{fontSize: "0.9rem", fontWeight: "300"}}>
                  {item.email}
                </i>
                <button className="view-profile-button" style={{marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px"}}
                  onClick={() => navigate(`/viewusers/user?userid=${item.id}`)}
                >
                  View profile
                  
                </button>
                <button className="send-message-button" onClick={() => handleDirectMessageChat(item?.id, item?.username)} style={{ display: "flex", alignItems: "center", gap: "5px"}}>
                  Message
                  <VscSend />
                </button>
                <FiUserPlus className="add-user" />
          </div>
        </div>
        <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "auto", gap: "20px",  borderStyle: "solid", borderRadius: "10px",
            borderWidth: "1px", color: "rgba(176, 176, 176, 0.5)"}}
          ></div>
      </div>
    );
  });

  const searchedUserProfileElement = allUsers
  .filter((a) => a.username.toLowerCase().includes(searchQuery.toLowerCase()))
  .map((item, index) => (
    <div key={item.id} style={{ height: "60px", marginTop: "3px" }}>
      {index === 0 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "auto",
            gap: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.5)",
          }}
        ></div>
      )}
      <div className="select-user-profile-card nohover">
        <div className="user-element">
          <VscAccount style={{ scale: "1.5", marginLeft: "10px" }} />
          <h4 style={{ fontSize: "1.2rem", fontWeight: "300" }}>{item.username}</h4>
          <i style={{ fontSize: "0.9rem", fontWeight: "300" }}>{item.email}</i>
          <button
            className="view-profile-button"
            style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "5px" }}
            onClick={() => navigate(`/viewusers/user?userid=${item.id}`)}
          >
            View profile
          </button>
          <button className="send-message-button" onClick={() => handleDirectMessageChat(item?.id, item?.username)} style={{ display: "flex", alignItems: "center", gap: "5px" }}>
            Message
            <VscSend />
          </button>
          <FiUserPlus className="add-user" />
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "auto",
          gap: "20px",
          borderStyle: "solid",
          borderRadius: "10px",
          borderWidth: "1px",
          color: "rgba(176, 176, 176, 0.5)",
        }}
      ></div>
    </div>
  ));


  return username ? (
    userProfileElement?.length > 0 ? 
    (
      <div className="view-users-page">
        <div className="header-section">
          <h4>View all users</h4>
          <div className="header-section-bar">

            <h1 >Users</h1>
            <div className="search-wrapper">
              <FiSearch />
              <input type="search" placeholder="Search users..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
        <div className="select-user-profiles-list">{searchQuery === "" ? userProfileElement : searchedUserProfileElement}</div>
        {/* <Link to="/profile" className="exit-profile-select-button">
          <h2>Back to my profile</h2>
        </Link> */}
      </div>
    ) : (
      <div className="loading-results-layout-div">
        <h1> Loading users... </h1>
      </div>
    )
  ) : (
    <h1>please log in</h1>
  );
}
