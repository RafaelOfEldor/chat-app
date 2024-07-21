import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./css/chatRoomInfoPopup.css";

const ChatRoomInfoPopup = ({ info, onClose, allUsers }) => {
  const popupRef = useRef(null);

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
    <motion.div className="popup-overlay room" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <motion.div
        className="popup-container room"
        ref={popupRef}
        initial={{ scale: 0.8 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.8 }}
        transition={{ type: "spring", stiffness: 300 }}
      >
        <div className="popup-header-room">
          <h2>{info.title}</h2>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            gap: "20px",
            marginTop: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.84)",
          }}
        ></div>
        <div className="popup-content-room">
          <p style={{ whiteSpace: "pre-wrap" }}>{info.description}</p>
        </div>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            width: "100%",
            gap: "20px",
            marginTop: "20px",
            borderStyle: "solid",
            borderRadius: "10px",
            borderWidth: "1px",
            color: "rgba(176, 176, 176, 0.84)",
          }}
        ></div>
        <div className="bottom-section-content">
          <div style={{ display: "flex", flexDirection: "column", minWidth: "50%", gap: "20px", marginTop: "10px" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <i>Created by </i>
              <h4>{info.created_by}</h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  marginLeft: "auto",
                  marginRight: "20%",
                  alignItems: "center",
                }}
              >
                <i>Room status</i>
                <h4> {info.isPublic ? "Public" : "private"}</h4>
              </div>
            </div>
            <button onClick={onClose} className="close-button room">
              Close
            </button>
          </div>
          {!info.isPublic && <i style={{ marginRight: "10px", marginTop: "10px" }}>Members:</i>}
          {!info.isPublic && (
            <div className="members-list">
              {info.users.map((item, index) => (
                <div key={index} className="member-item">
                  {allUsers?.find((user) => user.id === item).username}
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ChatRoomInfoPopup;
