import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleStatusUpdate(socket, userInput, sockets) {
  try {
    const { user_id, status } = userInput;
    const requestBody = {
      user_id: user_id,
      status: status,
    };
    const res = await fetch(`${baseUrl}/api/users/updatestatus`, {
      method: "PUT",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (!res.ok) {
      // console.log("user not found");
    } else {
      // console.log("found user!");
      const updatedUser = await res.json();
      const returnMessage = {
        type: "FRIEND_UPDATE",
        message: updatedUser,
      };

      const interestedSockets = sockets.filter((clientSocket) => updatedUser?.friends?.includes(clientSocket.userId));
      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify(returnMessage));
      }
    }
  } catch (error) {
    console.error("Error removing friend update:", error);
  }
}
