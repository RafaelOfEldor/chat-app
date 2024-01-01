import React, { useContext } from "react";
import { Link, Routes, Route, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function WeclomePage(props) {
  return (
    <div
      style={{
        marginLeft: "50vw",
        marginTop: "40vh",
        transform: "translate(-50%, -50%)",
      }}
    >
      <h1>
        In our digital era, we can socialize amongst ourselves, by ourselves. We
        can stay in touch with one another despite being miles apart. Thereby, i
        welcome you to this digital haven of social bubbles, where you can stay
        in touch with those out of reach and bear witness to stray gatherings in
        this dimension we call...{" "}
        <i style={{ color: "blue" }}> the cyberspace. </i>
      </h1>
    </div>
  );
}
