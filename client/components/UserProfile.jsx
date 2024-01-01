import React, { useContext, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, useSearchParams } from "react-router-dom";

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

  return username ? (
    userProfileInfo?.username ? (
      <div>
        <div className="profile-page header">
          <h1 style={{ fontSize: "3rem" }}>
            {userProfileInfo?.username}'s profile
          </h1>
        </div>
        <div className="profile-page info">
          <h3>Username: {userProfileInfo?.username}</h3>
          <h3>Email: {userProfileInfo?.email}</h3>

          <div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h3>Bio: </h3>
              <h3>
                {userProfileInfo?.bio !== ""
                  ? userProfileInfo?.bio
                  : "This user does not seem to have a bio :/"}
              </h3>
            </div>
          </div>
        </div>
        <Link to="/viewusers" className="exit-profile-button">
          <h2>Exit profile</h2>
        </Link>
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
