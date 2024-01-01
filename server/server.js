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
        const username = `${
          given_name?.charAt(0).toUpperCase() + given_name?.slice(1)
        }`;
        const fullName = `${
          given_name?.charAt(0).toUpperCase() + given_name?.slice(1)
        } ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
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
        const username = `${
          given_name?.charAt(0).toUpperCase() +
          given_name?.slice(1).split(" ")[0]
        }`;
        const fullName = `${
          given_name?.charAt(0).toUpperCase() + given_name?.slice(1)
        } ${family_name?.charAt(0).toUpperCase() + family_name?.slice(1)}`;
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
  app.use(
    "/api/auth",
    AuthenticationRouter(mongoClient.db("chat-application-database")),
  );
  app.use(
    "/api/users",
    UsersRouter(mongoClient.db("chat-application-database")),
  );
  app.use(
    "/api/chats",
    ChatRouter(mongoClient.db("chat-application-database")),
  );
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
    const roomId = urlParams.get("roomid") || null;
    const userId = urlParams.get("userid") || null;

    // console.log(urlParams);
    // console.log(roomId);
    // console.log(userId);

    if (roomId) {
      socket.userId = userId;
      socket.chatRoomId = roomId;

      socket.on("message", async (message) => {
        try {
          const userInput = JSON.parse(message.toString());
          // console.log("userinput chatroom: " + userInput.chat_room);
          // console.log("socket chatroom: " + socket.chatRoomId);
          // console.log("socket userid: " + socket.userId);
          // console.log("param chatroom: " + roomId);
          // console.log("param userid: " + userId);
          if (userInput.type === "join") {
            socket.chatRoomId = roomId;
            // console.log(`Socket joined chatroom: ${socket.chatRoomId}`);
            // console.log(userInput.chat_room)
            interestedSockets = sockets.filter((clientSocket) => {
              return clientSocket.chatRoomId === roomId;
            });

            for (const recipient of interestedSockets) {
              recipient.send(
                JSON.stringify({ type: "user-joined", userId: socket.userId }),
              );
            }

            return;
          } else {
            interestedSockets = sockets.filter((clientSocket) => {
              return clientSocket.chatRoomId === roomId;
            });
          }

          if (!userInput.edited && !userInput.deleted) {
            // console.log(interestedSockets)
            fetch(
              baseUrl +
                `/api/chats/log/${userInput.sending_user_id}/${userInput.chat_id}`,
            )
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
            currentChat.push(userInput);

            const messageType = "new-message";
            const messageArrayWithType = {
              type: messageType,
              messages: currentChat,
            };
            // console.log(currentChat);
            // console.log(userInput);
            await fetch(baseUrl + "/api/chats/sendmessage", {
              method: "POST",
              body: JSON.stringify(userInput),
              headers: {
                "content-type": "application/json",
              },
            });
            for (const recipient of interestedSockets) {
              recipient.send(JSON.stringify(messageArrayWithType));
            }
          } else if (userInput.deleted) {
            const res = await fetch(
              baseUrl +
                `/api/chats/deletemessage/${userInput.sending_user_id}/${roomId}/${userInput.message_id}`,
              {
                method: "DELETE",
              },
            );
            if (res.ok) {
              fetch(
                baseUrl +
                  `/api/chats/log/${userInput.sending_user_id}/${roomId}`,
              )
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
                    for (const recipient of interestedSockets) {
                      recipient.send(JSON.stringify({ type: "deleted" }));
                    }
                  }
                })
                .catch((error) => {
                  console.error("Error fetching chat log:", error);
                });

              // console.log(currentChat);
              // console.log("in deleting part of socket");
              // console.log(userInput);
              // console.log("in deleting part of socket");
            }
          } else if (userInput.edited) {
            const res = await fetch(baseUrl + "/api/chats/sendmessage", {
              method: "PUT",
              body: JSON.stringify(userInput),
              headers: {
                "content-type": "application/json",
              },
            });
            if (res.ok) {
              fetch(
                baseUrl +
                  `/api/chats/log/${userInput.sending_user_id}/${roomId}`,
              )
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
                    for (const recipient of interestedSockets) {
                      recipient.send(JSON.stringify({ type: "edited" }));
                    }
                  }
                })
                .catch((error) => {
                  console.error("Error fetching chat log:", error);
                });

              // console.log(currentChat);
              // console.log("in socket");
              // console.log(userInput);
              // console.log("in socket");
            }
          }
        } catch (error) {
          console.error("Something went wrong with websocket: ", error);
        }
      });
    }
  });
});
