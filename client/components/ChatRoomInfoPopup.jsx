import React, { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import "./css/chatRoomInfoPopup.css";

const ChatRoomInfoPopup = ({ info, onClose }) => {
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
          <h2>Information</h2>
        </div>
        <div className="popup-content">
          <p>{info}</p>
        </div>
        <button onClick={onClose} className="button button-close" style={{ marginTop: "20px" }}>
          Close
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ChatRoomInfoPopup;
