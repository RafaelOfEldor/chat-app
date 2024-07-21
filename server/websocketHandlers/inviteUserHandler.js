import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleInviteUser(socket, userInput, sockets) {
  const { user_id, rooms } = userInput;
  const data = {
    user_id: user_id,
    rooms: rooms,
  };

  try {
    const res = await fetch(`${baseUrl}/api/chats/invite/updateroom`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });

    if (res.status === 204) {
      const messageToSend = {
        type: "CHAT_ROOMS_UPDATE",
        message: "success",
      };
      const interestedSockets = sockets.filter((item) => item.userId === user_id);
      interestedSockets.forEach((recipient) => {
        recipient.send(JSON.stringify(messageToSend));
      });
    }
  } catch (error) {
    console.error("Error removing friend update:", error);
  }
}
