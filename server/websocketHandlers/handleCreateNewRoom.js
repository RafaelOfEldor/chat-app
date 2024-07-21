import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleCreateNewRoom(socket, userInput, sockets) {
  const { user_id, roomid, old_users } = userInput;

  console.log("user input", userInput);
  const dataElement = {
    joining_user: user_id,
    room_id: roomid,
  };

  try {
    const res = await fetch(`${baseUrl}/api/chats/room/${roomid}`);
    const room = await res.json();
    if (res.ok) {
      const returnMessage = {
        type: "CHAT_ROOMS_UPDATE",
        message: { id: user_id },
      };

      const interestedSockets = sockets.filter(
        (clientSocket) => old_users?.includes(clientSocket.userId) || room[0]?.users?.includes(clientSocket.userId),
      );

      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify(returnMessage));
      }
    }
  } catch (error) {
    console.error("Error updating room:", error);
  }
}
