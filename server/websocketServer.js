import { WebSocketServer } from "ws";
import { handleUpdateRoom } from "./websocketHandlers/updateRoomHandler.js";
import { handleSendRequestUpdate } from "./websocketHandlers/sendRequestUpdateHandler.js";
import { handleRemoveRequestUpdate } from "./websocketHandlers/removeRequestUpdateHandler.js";
import { handleAcceptFriendUpdate } from "./websocketHandlers/acceptFriendUpdateHandler.js";
import { handleRemoveFriendUpdate } from "./websocketHandlers/removeFriendUpdateHandler.js";
import { handleSendMessage } from "./websocketHandlers/sendMessageHandler.js";
import { handleStatusUpdate } from "./websocketHandlers/statusUpdateHandler.js";
import { handleInviteUser } from "./websocketHandlers/inviteUserHandler.js";
import { handleDeleteRoom } from "./websocketHandlers/deleteRoomHandler.js";
import { handleCreateNewRoom } from "./websocketHandlers/handleCreateNewRoom.js";

let currentChat = [];
const sockets = [];

export function setupWebSocketServer(server) {
  const webSocketServer = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    webSocketServer.handleUpgrade(req, socket, head, (ws) => {
      webSocketServer.emit("connection", ws, req);
    });
  });

  webSocketServer.on("connection", (socket, req) => {
    sockets.push(socket);

    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    const userId = urlParams.get("userid") || null;
    socket.userId = userId;

    if (userId != "null") {
      const requestBody = {
        user_id: userId,
        status: "online",
      };
      handleStatusUpdate(socket, requestBody, sockets);
    } else {
      // console.log("User connected with no userId");
    }

    socket.on("message", (message) => {
      const userInput = JSON.parse(message.toString());
      switch (userInput.type) {
        case "UPDATE_ROOM":
          // console.log("UPDATE_ROOM");
          handleUpdateRoom(socket, userInput, sockets);
          break;
        case "SEND_REQUEST_UPDATE":
          // console.log("SEND_REQUEST_UPDATE");
          handleSendRequestUpdate(socket, userInput, sockets);
          break;
        case "REMOVE_REQUEST_UPDATE":
          // console.log("REMOVE_REQUEST_UPDATE");
          handleRemoveRequestUpdate(socket, userInput, sockets);
          break;
        case "ACCEPT_FRIEND_UPDATE":
          // console.log("ACCEPT_FRIEND_UPDATE");
          handleAcceptFriendUpdate(socket, userInput, sockets);
          break;
        case "REMOVE_FRIEND_UPDATE":
          // console.log("REMOVE_FRIEND_UPDATE");
          handleRemoveFriendUpdate(socket, userInput, sockets);
          break;
        case "SEND_MESSAGE":
          // console.log("SEND_MESSAGE");
          handleSendMessage(socket, userInput, sockets);
          break;
        case "INVITE_USER":
          // console.log("INVITE_USER");
          handleInviteUser(socket, userInput, sockets);
          break;
        case "DELETE_ROOM":
          // console.log("DELETE_ROOM");
          handleDeleteRoom(socket, userInput, sockets);
          break;
        case "CHAT_ROOMS_UPDATE":
          console.log("DELETE_ROOM");
          handleCreateNewRoom(socket, userInput, sockets);
          break;

        default:
          console.error("Unknown message type:", userInput.type);
      }
    });

    socket.on("close", () => {
      // console.log(`User disconnected: ${socket.userId || "Unknown userId"}`);
      const requestBody = {
        user_id: userId,
        status: "offline",
      };
      handleStatusUpdate(socket, requestBody, sockets);
      const index = sockets.indexOf(socket);
      if (index > -1) {
        sockets.splice(index, 1);
      }
    });
  });
}
