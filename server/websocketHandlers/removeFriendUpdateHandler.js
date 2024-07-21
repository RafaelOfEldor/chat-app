import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleRemoveFriendUpdate(socket, userInput, sockets) {
  const { user_id, receiving_user_id } = userInput;
  const data = {
    receiving_user_id: user_id,
    user_id: receiving_user_id,
  };

  try {
    const res = await fetch(`${baseUrl}/api/users/remove/friend`, {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    const updatedData = await res.json();
    const messageToSend = {
      type: "REMOVE_FRIEND",
      targetUser: updatedData,
    };

    const interestedSockets = sockets.filter((item) => item.userId === receiving_user_id || item.userId === user_id);
    interestedSockets.forEach((recipient) => {
      recipient.send(JSON.stringify(messageToSend));
    });
  } catch (error) {
    console.error("Error removing friend update:", error);
  }
}
