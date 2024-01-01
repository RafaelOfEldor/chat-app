import React, { useContext, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import {
  ExpressUsersPutBio,
  ExpressUsersPutUsername,
} from "../functions/ExpressFunctions.jsx";

export default function ProfilePage() {
  const {
    username,
    fullName,
    userBio,
    userId,
    mail,
    userInfo,
    fetchUserInfo,
    loadUser,
    setUsername,
  } = useAuth();
  const [showEditBio, setShowEditBio] = React.useState(false);
  const [showEditUsername, setShowEditUsername] = React.useState(false);
  const [updatedBio, setUpdatedBio] = React.useState("");
  const [updatedUsername, setUpdatedUsername] = React.useState("");
  const [editedCounter, setEditedCounter] = React.useState(1);
  const [loadingUsername, setLoadingUsername] = React.useState(false);
  const [loadingBio, setLoadingBio] = React.useState(false);
  const inputRef = useRef(null);

  const navigate = useNavigate();

  async function handleEditBio(e) {
    e.preventDefault();
    setShowEditBio(false);
    ExpressUsersPutBio(updatedBio, userId);
    setLoadingBio(true);
    setTimeout(() => {
      setEditedCounter((prev) => prev + 1);
      setLoadingBio(false);
      setUpdatedBio("");
    }, 1000);
  }

  async function handleEditUsername(e) {
    e.preventDefault();
    setShowEditUsername(false);
    ExpressUsersPutUsername(updatedUsername, userId);
    setLoadingUsername(true);
    setTimeout(() => {
      setEditedCounter((prev) => prev + 1);
      setLoadingUsername(false);
      setUpdatedUsername("");
    }, 1000);
  }

  function handleChangeBio(e) {
    setUpdatedBio(e.target.value);
  }

  function handleChangeUsername(e) {
    setUpdatedUsername(e.target.value);
  }

  React.useEffect(() => {
    fetchUserInfo();
  }, [userId, editedCounter]);

  return username ? (
    userInfo?.username ? (
      <div>
        <div className="profile-page header">
          <h1 style={{ fontSize: "3rem" }}>My profile</h1>
        </div>
        <div className="profile-page info">
          <div style={{ display: "flex" }}>
            <h3>
              Username:{" "}
              {loadingUsername ? "Loading new username..." : userInfo?.username}
            </h3>
            <div>
              <div className="list-element-div">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                ></div>
                <button onClick={() => setShowEditUsername((prev) => !prev)}>
                  {showEditUsername ? "Hide Edit" : "Edit username"}
                </button>
              </div>
            </div>
          </div>
          {showEditUsername && (
            <form onSubmit={handleEditUsername} className="show-edit-div">
              <input
                placeholder="change here"
                value={updatedUsername}
                onChange={(e) => handleChangeUsername(e)}
                name="editText"
                ref={inputRef}
              />
              <button> Submit Change </button>
            </form>
          )}
          <h3>Full name: {fullName}</h3>
          <h3>Email: {mail}</h3>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h3>Bio: </h3>
              <h3>{loadingBio ? "Loading new bio..." : userInfo?.bio}</h3>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div className="list-element-div">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    textAlign: "center",
                    justifyContent: "center",
                    gap: "10px",
                  }}
                ></div>
                <button onClick={() => setShowEditBio((prev) => !prev)}>
                  {showEditBio ? "Hide Edit" : "Edit bio"}
                </button>
              </div>
            </div>
          </div>
          {showEditBio && (
            <form onSubmit={handleEditBio} className="show-edit-div">
              <input
                placeholder="change here"
                value={updatedBio}
                onChange={(e) => handleChangeBio(e)}
                name="editText"
                ref={inputRef}
              />
              <button> Submit Change </button>
            </form>
          )}
        </div>

        <div className="profile-page lists">
          <h1>Actions:</h1>
          <div style={{ display: "flex" }}>
            <Link to={`/chatrooms/room/${1}`} className="profile-page list">
              General chat
            </Link>
            <Link to="/chatrooms" className="profile-page list">
              Chat-rooms
            </Link>
            <Link to="/viewusers" className="profile-page list">
              Users
            </Link>
          </div>
        </div>
      </div>
    ) : (
      <div className="lodaing-results-layout-div">
        <h1> Loading profile... </h1>
      </div>
    )
  ) : (
    <h1>please log in</h1>
  );
}
