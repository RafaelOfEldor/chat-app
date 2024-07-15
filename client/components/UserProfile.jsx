import React, { useContext, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import "../Pages/css/loadingAndFiller.css"

export default function UserProfile() {
  const { username, fullName, userBio, userId, mail, loadUser, setUsername } =
    useAuth();
  const [showEdit, setShowEdit] = React.useState(false);
  const [userProfileInfo, setUserProfileInfo] = React.useState([]);
  const inputRef = useRef(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const userParamId = searchParams.get("userid");

  async function fetchUserInfo() {
    fetch(`/api/users/byid/${userParamId}`).then((response) =>
      response.json().then((data) => {
        setUserProfileInfo(data);
      }),
    );
  }

  React.useEffect(() => {
    fetchUserInfo();
  }, []);

  React.useEffect(() => {
    console.log(userProfileInfo)
  }, [userProfileInfo]);

  return username ? (
    userProfileInfo?.username ? (
      <div style={{color: "white"}}>
        <div className="profile-page header">
          <div>
            <h1 style={{ fontSize: "3rem", fontWeight: "300" }}>{userProfileInfo?.username}</h1>
            <h3 style={{fontWeight: "300"}}>{userProfileInfo?.email}</h3>
          </div>
        </div>
        <div className="profile-page intermediary-line">
          <h1>Profile Details</h1>
          <div style={{display: "flex", flexDirection: "column", alignItems: "center", width: "70vw", gap: "20px", marginTop: "20px", borderStyle: "solid", borderRadius: "10px",
            borderWidth: "1px", color: "rgba(176, 176, 176, 0.84)"}}
          ></div>
        </div>

        <div className="profile-page info">
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", textAlign: "center", gap: "10px"}}>
            <h2>
              Username:
            </h2>
            <h3 style={{fontWeight: "100"}}>
                {userProfileInfo?.username}
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
              </div>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "row", alignItems: "center", textAlign: "center", gap: "50px"}}>
            <h2>Email: </h2>
            <h3 style={{fontWeight: "100"}}>{userProfileInfo?.email}</h3>
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
              <div style={{ display: "flex", flexDirection: "row", alignItems: "center", textAlign: "center", gap: "75px"}}>
                <h2>Bio: </h2>
                <h3 style={{fontWeight: "100"}}>{userProfileInfo?.bio !== "" ? userProfileInfo?.bio : <i>This user does not currently have a bio...</i>}</h3>
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
              </div>
            </div>
          </div>
        </div>


     
        <Link to="/viewusers" className="exit-profile-button">
          <h2>Exit profile</h2>
        </Link>
      </div>
    ) : (
      <div className="loading-results-layout-div">
        <h1> Loading profile... </h1>
      </div>
    )
  ) : (
    <h1>please log in</h1>
  );
}
