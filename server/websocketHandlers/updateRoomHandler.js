import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleUpdateRoom(socket, userInput, sockets) {
  const { user_id, roomid } = userInput;
  const dataElement = {
    user_id: user_id,
    status: roomid,
  };

  try {
    await fetch(`${baseUrl}/api/chats/updateview`, {
      method: "PUT",
      body: JSON.stringify(dataElement),
      headers: { "Content-Type": "application/json" },
    });

    const res = await fetch(`${baseUrl}/api/chats/room/${roomid}`);
    const room = await res.json();

    if (res.ok) {
      const returnMessage = {
        type: "UPDATE_ROOM",
        message: { id: user_id },
      };
      const interestedSockets = sockets.filter((clientSocket) => room[0]?.users?.includes(clientSocket.userId));
      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify(returnMessage));
      }
    }
  } catch (error) {
    console.error("Error updating room:", error);
  }
}
