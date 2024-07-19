import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

// export const ChatRouter = express.Router();
export function ChatRouter(mongoDatabase) {
  const router = new Router();

  //Chat rooms

  router.get("/log/:chatId", async (req, res) => {
    try {
      const chatId = parseInt(req.params.chatId);

      const chats = await mongoDatabase
        .collection("chat-messages")
        .find({ chat_room: chatId })
        .sort({ message_id: 1 })
        .toArray();

      if (chats.length > 0) {
        res.json(chats);
      } else {
        res.status(204).end();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.post("/checkview", async (req, res) => {
    try {
      const { user_id, rooms } = req.body;

      // console.log("receiving body:",req.body);

      // Prepare the response structure
      const response = [];

      // Process each room
      for (const room of rooms) {
        const { id, prevMessages } = room;

        // Convert prevMessages to integers if they are in string format
        if (prevMessages?.length > 0) {
          const parsedMessageIds = prevMessages.map((id) => parseInt(id) + 1);

          // Retrieve messages for the current room
          const messages = await mongoDatabase
            .collection("chat-messages")
            .find({ chat_room: id, message_id: { $in: parsedMessageIds } })
            .toArray();

          // Check if user_id is in seenBy array for each message

          if (messages?.length > 0) {
            const roomResult = {
              id,
              messages:
                messages.length &&
                messages.map((message) => ({
                  message_id: message.message_id,
                  seenByUser: message.seenBy.includes(user_id),
                })),
            };
            // console.log(messages);

            // Add the result for the current room to the response
            response.push(roomResult);
          }
        }
      }
      if (response?.length > 0) {
        res.json(response);
      } else {
        res.sendStatus(204);
      }
    } catch (error) {
      console.error("Error checking seenBy:", error);
      res.status(500).json({ error: "Failed to check seenBy" });
    }
  });

  router.get("/rooms", async (req, res) => {
    try {
      const rooms = await mongoDatabase.collection("chat-rooms").find().toArray();
      // console.log(rooms);
      res.send(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.put("/updateroom", async (req, res) => {
    try {
      const { room_id, room_length } = req.body;
      // console.log("receiving body:",req.body);
      // console.log("yo?");
      let i;
      let a = [];
      for (i = room_length - 1; i > room_length - 11 && i >= 0; i--) {
        a.push(`${i}`);
      }

      // console.log(a);
      const respone = await mongoDatabase
        .collection("chat-rooms")
        .updateOne({ id: parseInt(room_id) }, { $set: { prevMessages: a } }, { returnDocument: true });
      // console.log(rooms);
      if (respone.ok) {
        res.sendStatus(200);
      } else {
        res.sendStatus(204);
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.get("/room/:chatid", async (req, res) => {
    try {
      const { chatid } = req.params;
      const chatId = parseInt(chatid);
      const room = await mongoDatabase.collection("chat-rooms").find({ id: chatId }).toArray();
      // console.log(room);
      res.send(room);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.post("/rooms/newroom", async (req, res) => {
    try {
      const userInput = req.body;
      const data = {
        title: userInput.title,
        description: userInput.description,
        id: userInput.id,
        created_by: userInput.created_by,
      };
      const roomExist = await mongoDatabase.collection("chat-rooms").findOne({ title: data.title });
      if (!roomExist) {
        await mongoDatabase.collection("chat-rooms").insertOne(userInput);
        res.sendStatus(204);
      } else {
        res.status(406);
        res.end();
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.put("/rooms/newroom", async (req, res) => {
    try {
      const { room_id, created_by_id, new_title, new_description } = req.body;
      const roomId = parseInt(room_id);
      const roomExist = await mongoDatabase.collection("chat-rooms").findOne({ title: new_title });

      if (!roomExist) {
        const correctUser = await mongoDatabase
          .collection("chat-rooms")
          .findOne({ id: roomId, created_by_id: created_by_id });
        if (correctUser) {
          const result = await mongoDatabase.collection("chat-rooms").updateOne(
            {
              id: roomId,
            },
            { $set: { title: new_title, description: new_description } },
            { returnDocument: true },
          );
          res.sendStatus(204);
        } else {
          res.status(401);
          res.end();
        }
      } else {
        res.status(406);
        res.end();
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.post("/sendmessage", async (req, res) => {
    try {
      const userInput = req.body;
      await mongoDatabase.collection("chat-messages").insertOne(userInput);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  router.put("/sendmessage", async (req, res) => {
    try {
      const userInput = req.body;
      await mongoDatabase.collection("chat-messages").updateOne(
        {
          sending_user_id: userInput.sending_user_id,
          chat_room: parseInt(userInput.chat_room),
          message_id: userInput.message_id,
        },
        { $set: { message: userInput.message, edited: true } },
        { returnDocument: true },
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  router.put("/updateview", async (req, res) => {
    try {
      const userInput = req.body;
      const { joining_user, room_id } = userInput;
      const userId = userInput.user_id; // Assuming the user ID is sent in the body

      console.log("userinput", userInput);

      const response = await mongoDatabase.collection("chat-messages").updateMany(
        {
          chat_room: parseInt(room_id),
        },
        {
          $addToSet: { seenBy: joining_user }, // Add the user ID to the seenBy array if it's not already there
        },
      );
      if (response.ok) {
        res.sendStatus(200);
      } else {
        res.sendStatus(204);
      }
    } catch (error) {
      console.error("Error updating view:", error);
      res.status(500).json({ error: "Failed to update view" });
    }
    res.end();
  });

  router.delete("/deletemessage/:sendinguserid/:chatroom/:messageid", async (req, res) => {
    try {
      const { sendinguserid, messageid } = req.params;
      const chatroom = parseInt(req.params.chatroom);
      await mongoDatabase.collection("chat-messages").updateOne(
        {
          sending_user_id: sendinguserid,
          chat_room: chatroom,
          message_id: parseInt(messageid),
        },
        { $set: { deleted: true } },
        { returnDocument: true },
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  // Direct messages

  router.get("/log/:sendingUserId/:recievingUserId/:chatId", async (req, res) => {
    try {
      const { sendingUserId, recievingUserId, chatId } = req.params;
      const chats = [];
      let i = 1;
      do {
        const chatExist = await mongoDatabase.collection("direct-messages").findOne({
          sending_user_id: sendingUserId.toString(),
          receiving_user_id: recievingUserId.toString(),
          chat_id: 1,
          message_id: i,
        });

        const chatExistMirror = await mongoDatabase.collection("direct-messages").findOne({
          sending_user_id: recievingUserId.toString(),
          receiving_user_id: sendingUserId.toString(),
          chat_id: 1,
          message_id: i,
        });
        if (chatExist) {
          const chat = await mongoDatabase
            .collection("direct-messages")
            .find({
              sending_user_id: sendingUserId.toString(),
              receiving_user_id: recievingUserId.toString(),
              chat_id: 1,
              message_id: i,
            })
            .toArray();
          chats.push(chat[0]);
        } else if (chatExistMirror) {
          const chat = await mongoDatabase
            .collection("direct-messages")
            .find({
              sending_user_id: recievingUserId.toString(),
              receiving_user_id: sendingUserId.toString(),
              chat_id: 1,
              message_id: i,
            })
            .toArray();
          chats.push(chat[0]);
        } else {
          break;
        }
        i++;
      } while (true);
      if (chats.length > 0) {
        // console.log(chats)
        res.json(chats);
      } else {
        res.status(204).json({ message: "Currently no messages in this chat" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.post("/send/directmessage", async (req, res) => {
    try {
      const userInput = req.body;
      await mongoDatabase.collection("direct-messages").insertOne(userInput);
      res.sendStatus(204);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  router.put("/send/directmessage", async (req, res) => {
    try {
      const userInput = req.body;
      await mongoDatabase.collection("direct-messages").updateOne(
        {
          sending_user_id: userInput.sending_user_id,
          receiving_user_id: userInput.receiving_user_id,
          message_id: userInput.message_id,
        },
        { $set: { message: userInput.message, edited: true } },
        { returnDocument: true },
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  router.delete("/delete/directmessage/:sendinguserid/:receivinguserid/:messageid", async (req, res) => {
    try {
      const { sendinguserid, receivignuserid, messageid } = req.params;
      const chatroom = parseInt(req.params.chatroom);
      await mongoDatabase.collection("direct-messages").updateOne(
        {
          sending_user_id: sendinguserid,
          receiving_user_id: receivignuserid,
          message_id: parseInt(messageid),
        },
        { $set: { deleted: true } },
        { returnDocument: true },
      );
      res.sendStatus(200);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  return router;
}
