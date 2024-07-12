import React from "react";
import { motion } from "framer-motion";
import "./css/welcomePage.css";

const messages = [
  "Hey there! Let's chat!",
  "Welcome to cyberspace!",
  "Connect with friends.",
  "Join the conversation!",
  "Discover new chats!",
];

const FloatingMessage = () => {
  return (
    <>
      {messages.map((message, index) => (
        <motion.div
          key={index}
          className="floating-message"
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 100 }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse",
            delay: Math.random() * 5,
          }}
          style={{
            position: 'absolute',
            left: `${Math.random() * 50}vw`, // Limit to left half
            top: `${Math.random() * 100}vh`,  // Cover full height
            fontSize: '1.5rem',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {message}
        </motion.div>
      ))}
    </>
  );
};

const WelcomePage = () => {
  return (
    <div className="welcome-container">
      <div className="message-area left-side">
        <FloatingMessage />
      </div>
      <div className="message-area right-side">
        <FloatingMessage />
      </div>
      <motion.div
        className="welcome-content"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        <motion.h1
          className="welcome-title"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, type: "spring", stiffness: 100 }}
        >
          Welcome to Your Digital Haven
        </motion.h1>
        <motion.p
          className="welcome-description"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          In our digital era, we can socialize amongst ourselves, by ourselves. 
          Stay in touch and bear witness to gatherings in this dimension we call.. 
          <i className="highlight"> the cyberspace.</i>
        </motion.p>
        <motion.a
          href="/login"
          className="welcome-button"
          initial={{ scale: 1 }}
          whileHover={{ scale: 1.1, backgroundColor: "#67a8ff" }}
          whileTap={{ scale: 0.9 }}
        >
          Enter
        </motion.a>
      </motion.div>
    </div>
  );
};

export default WelcomePage;
