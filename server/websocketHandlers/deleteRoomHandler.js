import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleDeleteRoom(socket, userInput, sockets) {
  const { room_id } = userInput;
  const data = {
    room_id: room_id,
  };

  try {
    const res = await fetch(`${baseUrl}/api/chats/remove/room`, {
      method: "DELETE",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    const room = await res.json();
    const messageToSend = {
      type: "CHAT_ROOMS_UPDATE",
      targetUser: room,
    };
    const interestedSockets = sockets.filter((clientSocket) => room?.deletedRoom?.users?.includes(clientSocket.userId));
    interestedSockets.forEach((recipient) => {
      recipient.send(JSON.stringify(messageToSend));
    });
  } catch (error) {
    console.error("Error removing friend update:", error);
  }
}
