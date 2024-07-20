import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import "./css/invitePopup.css";
import { useWebSocket } from "../context/WebSocketContext";

const InvitePopup = ({ usersChatRooms, onClose, onInvite, currentUser, isRoomsAvailable }) => {
  const [selectedRooms, setselectedRooms] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const popupRef = useRef(null);
  const [webSocket] = useWebSocket();

  useEffect(() => {
    if (!isRoomsAvailable) {
      setShowNotification(true);
      const timer = setTimeout(() => setShowNotification(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isRoomsAvailable]);

  const handleCheckboxChange = (userId) => {
    console.log("selected rooms", selectedRooms);
    setselectedRooms((prevSelected) =>
      prevSelected.includes(userId) ? prevSelected.filter((id) => id !== userId) : [...prevSelected, userId],
    );
  };

  const handleSubmit = () => {
    const message = {
      type: "INVITE_USER",
      user_id: currentUser.id,
      rooms: selectedRooms,
    };
    webSocket.send(JSON.stringify(message));
    onClose();
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
  };

  const filteredRooms = usersChatRooms.filter((room) => room.title.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  return (
    <>
      {showNotification && (
        <motion.div
          className="notification"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.5 }}
        >
          You currently don't have any rooms to invite friends into
        </motion.div>
      )}
      {isRoomsAvailable && (
        <motion.div className="popup-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div
            className="popup-container"
            ref={popupRef}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0.8 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="popup-header">
              <h2>Invite {currentUser.username}</h2>
              <input
                type="search"
                placeholder="Search rooms..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="search-bar"
              />
            </div>
            <div className="user-list">
              {filteredRooms.map((room) => (
                <div key={room.id} className="user-item">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      className="styled-checkbox"
                      checked={selectedRooms.includes(room.id)}
                      onChange={() => handleCheckboxChange(room.id)}
                    />
                    <div className="checkbox-content">
                      <div className="checkbox-header">
                        <span className="header-title">Room title</span>
                        <span className="header-members">Amount of members</span>
                        <span className="header-creator">Created by</span>
                      </div>
                      <div className="checkbox-values">
                        <span className="value-title">{room.title}</span>
                        <span className="value-members">{room.users.length}</span>
                        <span className="value-creator">{room.created_by}</span>
                      </div>
                    </div>
                  </label>
                </div>
              ))}
            </div>
            <button onClick={handleSubmit} className="button" style={{ marginTop: "20px" }}>
              Add to rooms
            </button>
            <button onClick={onClose} className="button button-close" style={{ marginLeft: "20px" }}>
              Close
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default InvitePopup;
