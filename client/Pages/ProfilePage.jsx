import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ExpressUsersPutBio, ExpressUsersPutUsername } from "../functions/ExpressFunctions.jsx";
import "./css/loadingAndFiller.css";
import "./css/profilePage.css";

export default function ProfilePage() {
  const { username, fullName, userBio, userId, mail, userInfo, fetchUserInfo, loadUser, setUsername } = useAuth();
  const [showEditBio, setShowEditBio] = useState(false);
  const [showEditUsername, setShowEditUsername] = useState(false);
  const [updatedBio, setUpdatedBio] = useState("");
  const [updatedUsername, setUpdatedUsername] = useState("");
  const [editedCounter, setEditedCounter] = useState(1);
  const [loadingUsername, setLoadingUsername] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const inputRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

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

  useEffect(() => {
    fetchUserInfo();
  }, [userId, editedCounter]);

  return username ? (
    userInfo?.username ? (
      <div style={{ color: "white" }}>
        <div className="profile-page header">
          <div>
            <h1 style={{ fontSize: "3rem", fontWeight: "300" }}>
              {fullName} ({userInfo?.username})
            </h1>
            <h3 style={{ fontWeight: "300" }}>{mail}</h3>
          </div>
        </div>
        <div className="profile-page intermediary-line">
          <h1>Profile Details</h1>
          <h3 style={{ fontWeight: "100", marginTop: "10px" }}>Update your profile information</h3>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "70vw",
              gap: "20px",
              marginTop: "20px",
              borderStyle: "solid",
              borderRadius: "10px",
              borderWidth: "1px",
              color: "rgba(176, 176, 176, 0.84)",
            }}
          ></div>
        </div>
        <div className="profile-page info">
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <h2>Username:</h2>
            <h3 style={{ fontWeight: "100" }}>{loadingUsername ? "Loading new username..." : userInfo?.username}</h3>
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
          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textAlign: "center",
              gap: "10px",
            }}
          >
            <h2>Full name: </h2>
            <h3 style={{ fontWeight: "100" }}>{fullName}</h3>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "row",
              alignItems: "center",
              textAlign: "center",
              gap: "50px",
            }}
          >
            <h2>Email: </h2>
            <h3 style={{ fontWeight: "100" }}>{mail}</h3>
          </div>

          <div style={{ display: "flex" }}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  textAlign: "center",
                  gap: "75px",
                }}
              >
                <h2>Bio: </h2>
                <h3 style={{ fontWeight: "100" }}>{loadingBio ? "Loading new bio..." : userInfo?.bio}</h3>
              </div>
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
              <textarea
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
      </div>
    ) : (
      <div className="loading-results-layout-div">
        <h1> Loading profile... </h1>
      </div>
    )
  ) : (
    <div style={{ display: "flex", gap: "40px", color: "white" }}>
      <h1>Please log in</h1>
      <button onClick={() => navigate("/login")} style={{ width: "150px", height: "50px", fontSize: "1.3rem" }}>
        Login
      </button>
    </div>
  );
}
