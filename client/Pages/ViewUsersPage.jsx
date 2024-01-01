import React, { useContext, useRef } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate, NavLink } from "react-router-dom";
import { ExpressUsersPut } from "../functions/ExpressFunctions.jsx";

export default function ViewUsersPage() {
  const { username, fullName, userBio, userId, mail, loadUser, setUsername } =
    useAuth();
  const [showEdit, setShowEdit] = React.useState(false);
  const [updatedBio, setUpdatedBio] = React.useState("");
  const [allUsers, setAllUsers] = React.useState([]);
  const [isHovering, setIsHovering] = React.useState();
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

  const userProfileElement = allUsers.map((item, index) => {
    return (
      <NavLink
        key={index}
        onMouseOver={() => setIsHovering({ hover: true, hoveringId: index })}
        onMouseLeave={() => setIsHovering()}
        className={
          isHovering?.hover === true && isHovering?.hoveringId === index
            ? "select-user-profile-card hover"
            : "select-user-profile-card nohover"
        }
        to={`/viewusers/user?userid=${item.id}`}
      >
        <div>
          <h2>
            {isHovering?.hover === true && isHovering?.hoveringId === index
              ? "View profile"
              : item.username}
          </h2>
        </div>
      </NavLink>
    );
  });

  return username ? (
    userProfileElement?.length > 0 ? (
      <div>
        <h1 style={{ marginLeft: "45vw", marginTop: "50px" }}>All profiles:</h1>
        <div className="select-user-profiles-list">{userProfileElement}</div>
        <Link to="/profile" className="exit-profile-select-button">
          <h2>Back to my profile</h2>
        </Link>
      </div>
    ) : (
      <div className="lodaing-results-layout-div">
        <h1> Loading users... </h1>
      </div>
    )
  ) : (
    <h1>please log in</h1>
  );
}
