import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

export async function handleSendRequestUpdate(socket, userInput, sockets) {
  const { user_id, receiving_user_id } = userInput;
  const data = {
    receiving_user_id,
    user_id,
  };

  try {
    const res = await fetch(`${baseUrl}/api/users/send/request`, {
      method: "POST",
      body: JSON.stringify(data),
      headers: { "Content-Type": "application/json" },
    });
    const updatedData = await res.json();
    const messageToSend = {
      type: "REQUEST_UPDATE",
      targetUser: updatedData,
    };
    sockets.forEach((recipient) => {
      recipient.send(JSON.stringify(messageToSend));
    });
  } catch (error) {
    console.error("Error sending request update:", error);
  }
}
