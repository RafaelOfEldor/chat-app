import express from "express";
import * as path from "path";
import bodyParser from "body-parser";
import { AuthenticationRouter } from "./apiController/AuthenticationRouter.js";
import { UsersRouter } from "./apiController/UsersRouter.js";
import { ChatRouter } from "./apiController/ChatRouter.js";
import cookieParser from "cookie-parser";
import dotenv from "dotenv";
import { WebSocketServer } from "ws";
import { MongoClient } from "mongodb";

dotenv.config();

const app = express();

app.use(bodyParser.json());
app.use(cookieParser(process.env.SECRET_COOKIE));

async function fetchJson(url, params) {
  const res = await fetch(url, params);
  if (!res.ok) {
    return null;
  }
  return await res.json();
}

const googleDiscoveryUrl = process.env.GOOGLE_DISCOVERY_URL;
const microsoftDiscoveryUrl = process.env.MICROSOFT_DISCOVERY_URL;
const baseUrl = process.env.REACT_APP_ENVIRONMENT_BASE_URL;

app.use(async (req, res, next) => {
  const { username, access_token } = req.signedCookies;
  if (access_token) {
    const googleInfo = await fetchJson(googleDiscoveryUrl);
    const microsoftInfo = await fetchJson(microsoftDiscoveryUrl);

    if (googleInfo.userinfo_endpoint) {
      const { userinfo_endpoint } = googleInfo;
      const user = await fetchJson(userinfo_endpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (user) {
        const { given_name, family_name, email, picture } = user;
        const username = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1)}`;
        const fullName = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1)} ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
        const mail = `${email}`;
        const photo = `${picture}`;
        req.user = { ...user, username, fullName, mail, photo };
      }
    }

    if (microsoftInfo.userinfo_endpoint) {
      const { userinfo_endpoint } = microsoftInfo;
      const user = await fetchJson(userinfo_endpoint, {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });
      if (user) {
        const { given_name, family_name, email, picture } = user;
        const username = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1).split(" ")[0]}`;
        const fullName = `${given_name?.charAt(0).toUpperCase() + given_name?.slice(1)} ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
        const mail = `${email}`;
        const photo = `${picture}`;
        req.user = { ...user, username, fullName, mail, photo };
      }
    }
  }
  next();
});

const mongoClient = new MongoClient(process.env.MONGODB_URL);
mongoClient.connect().then(async () => {
  app.use("/api/auth", AuthenticationRouter(mongoClient.db("chat-application-database")));
  app.use("/api/users", UsersRouter(mongoClient.db("chat-application-database")));
  app.use("/api/chats", ChatRouter(mongoClient.db("chat-application-database")));
});

app.use(express.static("../client/dist"));

app.use((req, res, next) => {
  if (req.method === "GET" && !req.path.startsWith("/api")) {
    res.sendFile(path.resolve("../client/dist/index.html"));
  } else {
    next();
  }
});

const webSocketServer = new WebSocketServer({ noServer: true });

const server = app.listen(process.env.PORT || 3000, () => {
  console.log(`Running on http://localhost:${server.address().port}`);
});

let currentChat = [];
const sockets = [];
let interestedSockets;

server.on("upgrade", (req, socket, head) => {
  webSocketServer.handleUpgrade(req, socket, head, (socket) => {
    sockets.push(socket);

    const urlParams = new URLSearchParams(req.url.split("?")[1]);
    // const roomId = urlParams.get("roomid") || null;
    const userId = urlParams.get("userid") || null;
    const receivingUser = urlParams.get("receivinguser") || null;
    socket.userId = userId;
    // socket.chatRoomId = roomId;

    socket.on("message", async (message) => {
      const userInput = JSON.parse(message.toString());
      if (userInput.type === "UPDATE_ROOM") {
        const { user_id } = userInput;
        const dataElement = {
          joining_user: user_id,
          room_id: userInput.roomid,
        };

        const updateRoomsRes = await fetch(baseUrl + "/api/chats/updateview", {
          method: "PUT",
          body: JSON.stringify(dataElement),
          headers: {
            "content-type": "application/json",
          },
        });

        const res = await fetch(baseUrl + `/api/chats/room/${userInput.roomid}`);
        const room = await res.json();
        if (res.status === 200 || res.status === 204) {
          const returnMessage = {
            type: "UPDATE_ROOM",
            message: {
              id: user_id,
            },
          };
          interestedSockets = sockets.filter((clientSocket) => {
            return room[0]?.users?.includes(clientSocket.userId);
          });
          for (const recipient of interestedSockets) {
            recipient.send(JSON.stringify(returnMessage));
          }
        }
      }
      if (userInput.type === "SEND_REQUEST_UPDATE") {
        try {
          const { user_id, receiving_user_id } = userInput;
          const data = {
            receiving_user_id: receiving_user_id,
            user_id: user_id,
          };
          const res = await fetch(baseUrl + `/api/users/send/request`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "content-type": "application/json",
            },
          });
          const updatedData = await res.json();
          const messageToSend = {
            type: "REQUEST_UPDATE",
            targetUser: updatedData,
          };
          sockets.forEach((recipient) => {
            recipient.send(JSON.stringify(messageToSend));
          });
        } catch (e) {
          console.error(e);
        }
      }

      if (userInput.type === "REMOVE_REQUEST_UPDATE") {
        try {
          const { user_id, receiving_user_id } = userInput;
          const data = {
            receiving_user_id: user_id,
            user_id: receiving_user_id,
          };
          const res = await fetch(baseUrl + `/api/users/remove/request`, {
            method: "DELETE",
            body: JSON.stringify(data),
            headers: {
              "content-type": "application/json",
            },
          });
          const updatedData = await res.json();
          const messageToSend = {
            type: "REQUEST_UPDATE",
            targetUser: updatedData,
          };
          sockets.forEach((recipient) => {
            recipient.send(JSON.stringify(messageToSend));
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (userInput.type === "ACCEPT_FRIEND_UPDATE") {
        try {
          const { user_id, receiving_user_id } = userInput;
          const data = {
            receiving_user_id: user_id,
            user_id: receiving_user_id,
          };
          const res = await fetch(baseUrl + `/api/users/accept/request`, {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
              "content-type": "application/json",
            },
          });
          const updatedData = await res.json();
          const messageToSend = {
            type: "FRIEND_UPDATE",
            targetUser: updatedData,
          };
          sockets.forEach((recipient) => {
            recipient.send(JSON.stringify(messageToSend));
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (userInput.type === "REMOVE_FRIEND_UPDATE") {
        try {
          const { user_id, receiving_user_id } = userInput;
          const data = {
            receiving_user_id: user_id,
            user_id: receiving_user_id,
          };
          const res = await fetch(baseUrl + `/api/users/remove/friend`, {
            method: "DELETE",
            body: JSON.stringify(data),
            headers: {
              "content-type": "application/json",
            },
          });
          const updatedData = await res.json();
          const messageToSend = {
            type: "FRIEND_UPDATE",
            targetUser: updatedData,
          };
          sockets.forEach((recipient) => {
            recipient.send(JSON.stringify(messageToSend));
          });
        } catch (e) {
          console.error(e);
        }
      }
      if (userInput.type === "SEND_MESSAGE") {
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

            sockets.forEach((recipient) => {
              recipient.send(JSON.stringify(messageToSend));
            });

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

          if (!userInput.messageElement?.edited && !userInput.messageElement?.deleted) {
            fetch(baseUrl + `/api/chats/log/${userInput.messageElement?.chat_id}`)
              .then((response) => {
                const contentType = response.headers.get("Content-Type");

                if (contentType && contentType.includes("application/json")) {
                  return response.json();
                } else {
                  return null;
                }
              })
              .then((data) => {
                if (data !== null) {
                  currentChat = data;
                }
              })
              .catch((error) => {
                console.error("Error fetching chat log:", error);
              });
            currentChat.push(userInput.messageElement);

            const messageType = "new-message";
            const messageArrayWithType = {
              type: messageType,
              messages: currentChat,
            };
            await fetch(baseUrl + "/api/chats/sendmessage", {
              method: "POST",
              body: JSON.stringify(userInput.messageElement),
              headers: {
                "content-type": "application/json",
              },
            });

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
          } else if (userInput.messageElement?.deleted) {
            const res = await fetch(
              baseUrl +
                `/api/chats/deletemessage/${userInput.messageElement?.sending_user_id}/${roomid}/${userInput.messageElement?.message_id}`,
              {
                method: "DELETE",
              },
            );
            if (res.ok) {
              try {
                const response = await fetch(baseUrl + `/api/chats/log/${roomid}`);
                const contentType = response.headers.get("Content-Type");

                let data = null;
                if (contentType && contentType.includes("application/json")) {
                  data = await response.json();
                }

                if (data !== null) {
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
                  for (const recipient of interestedSockets) {
                    recipient.send(JSON.stringify({ type: "deleted" }));
                  }
                }
              } catch (error) {
                console.error("Error fetching chat log:", error);
              }
            }
          } else if (userInput.messageElement?.edited) {
            const res = await fetch(baseUrl + "/api/chats/sendmessage", {
              method: "PUT",
              body: JSON.stringify(userInput.messageElement),
              headers: {
                "content-type": "application/json",
              },
            });
            if (res.ok) {
              try {
                const response = await fetch(baseUrl + `/api/chats/log/${roomid}`);
                const contentType = response.headers.get("Content-Type");

                let data = null;
                if (contentType && contentType.includes("application/json")) {
                  data = await response.json();
                }

                if (data !== null) {
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
                  for (const recipient of interestedSockets) {
                    recipient.send(JSON.stringify({ type: "edited" }));
                  }
                }
              } catch (error) {
                console.error("Error fetching chat log:", error);
              }
            }
          }
        } catch (error) {
          console.error("Something went wrong with websocket: ", error);
        }
      }
    });
  });
});
