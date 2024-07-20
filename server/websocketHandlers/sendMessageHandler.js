import fetch from "node-fetch";

import dotenv from "dotenv";

dotenv.config();

const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

let currentChat = [];
let interestedSockets;

export async function handleSendMessage(socket, userInput, sockets) {
  const { roomid, messageElement } = userInput;

  try {
    const { user_id, roomid } = userInput;
    socket.chatRoomId = roomid;

    if (userInput.subtype === "join") {
      const { joining_user, chat_room } = userInput;

      const dataElement = {
        joining_user: joining_user,
        room_id: chat_room,
      };

      interestedSockets = sockets.filter((clientSocket) => {
        return clientSocket.chatRoomId === chat_room;
      });

      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify({ type: "user-joined", userId: socket.userId }));
      }
      const res = await fetch(baseUrl + "/api/chats/updateview", {
        method: "PUT",
        body: JSON.stringify(dataElement),
        headers: {
          "content-type": "application/json",
        },
      });

      const messageToSend = {
        type: "CHAT_ROOMS_UPDATE",
        targetUser: "updating rooms",
      };
      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify(messageToSend));
      }
      return;
    } else {
      const res = await fetch(baseUrl + `/api/chats/room/${roomid}`);
      const data = await res.json();

      interestedSockets = sockets.filter((clientSocket) => {
        if (data[0].isPublic) {
          return clientSocket.chatRoomId === roomid;
        } else {
          return data[0]?.users?.includes(clientSocket.userId);
        }
      });
    }

    if (!messageElement.edited && !messageElement.deleted) {
      await fetch(`${baseUrl}/api/chats/sendmessage`, {
        method: "POST",
        body: JSON.stringify(messageElement),
        headers: { "Content-Type": "application/json" },
      });
      const response = await fetch(`${baseUrl}/api/chats/log/${roomid}`);
      const chatLogs = await response.json();
      currentChat = chatLogs;

      const messageArrayWithType = {
        type: "new-message",
        messages: currentChat,
      };

      const chatLogsRes = await fetch(baseUrl + `/api/chats/log/${roomid}`);
      if (chatLogsRes.status === 204) {
      } else {
        const data = await chatLogsRes.json();
        const roomElement = {
          room_id: roomid,
          room_length: data.length,
        };
        const roomRes = await fetch(baseUrl + "/api/chats/updateroom", {
          method: "PUT",
          body: JSON.stringify(roomElement),
          headers: {
            "content-type": "application/json",
          },
        });
      }

      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify(messageArrayWithType));
      }
    } else if (messageElement.deleted) {
      await fetch(
        `${baseUrl}/api/chats/deletemessage/${messageElement.sending_user_id}/${roomid}/${messageElement.message_id}`,
        {
          method: "DELETE",
        },
      );

      const response = await fetch(`${baseUrl}/api/chats/log/${roomid}`);
      const chatLog = await response.json();

      const roomElement = {
        room_id: roomid,
        room_length: chatLog.length,
      };

      await fetch(`${baseUrl}/api/chats/updateroom`, {
        method: "PUT",
        body: JSON.stringify(roomElement),
        headers: { "Content-Type": "application/json" },
      });

      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify({ type: "deleted" }));
      }
    } else if (messageElement.edited) {
      await fetch(`${baseUrl}/api/chats/sendmessage`, {
        method: "PUT",
        body: JSON.stringify(messageElement),
        headers: { "Content-Type": "application/json" },
      });

      const response = await fetch(`${baseUrl}/api/chats/log/${roomid}`);
      const chatLog = await response.json();

      const roomElement = {
        room_id: roomid,
        room_length: chatLog.length,
      };

      await fetch(`${baseUrl}/api/chats/updateroom`, {
        method: "PUT",
        body: JSON.stringify(roomElement),
        headers: { "Content-Type": "application/json" },
      });

      for (const recipient of interestedSockets) {
        recipient.send(JSON.stringify({ type: "edited" }));
      }
    }
  } catch (error) {
    console.error("Error handling message:", error);
  }
}
