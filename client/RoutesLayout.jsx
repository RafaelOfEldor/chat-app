import React, { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./Pages/HomePage";
import LoginPage from "./Pages/LoginPage";
import LoginCallbackPage from "./Pages/LoginCallbackPage";
import ProfilePage from "./Pages/ProfilePage";
import WelcomePage from "./Pages/WelcomePage";
import ChatRoomsPage from "./Pages/ChatRoomsPage";
import NewRoomPage from "./Pages/NewRoomPage";
import ChatRoom from "./components/ChatRoom";
import ViewUsersPage from "./Pages/ViewUsersPage";
import UserProfile from "./components/UserProfile";
import EditRoomPage from "./Pages/EditRoomPage";
import CommunitiesPage from "./Pages/CommunitiesPage";

export default function RoutesPage() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />}>
        <Route index element={<WelcomePage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="login/callback" element={<LoginCallbackPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="chatrooms" element={<ChatRoomsPage />} />
        <Route path="communities" element={<CommunitiesPage />} />
        <Route path="chatrooms/room/:roomid" element={<ChatRoom />} />
        <Route path="newroom" element={<NewRoomPage />} />
        <Route path="newroom/:editroom" element={<EditRoomPage />} />
        <Route path="viewusers" element={<ViewUsersPage />} />
        <Route path="viewusers/:user" element={<UserProfile />} />
      </Route>
      <Route path="*" element={<h1>Page not found</h1>} />
    </Routes>
  );
}
