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

      const response = [];

      for (const room of rooms) {
        const { id, prevMessages } = room;

        if (prevMessages?.length > 0) {
          const parsedMessageIds = prevMessages.map((id) => parseInt(id) + 1);

          const messages = await mongoDatabase
            .collection("chat-messages")
            .find({ chat_room: id, message_id: { $in: parsedMessageIds } })
            .toArray();

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
      res.send(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.put("/updateroom", async (req, res) => {
    try {
      const { room_id, room_length } = req.body;

      let i;
      let a = [];
      for (i = room_length - 1; i > room_length - 11 && i >= 0; i--) {
        a.push(`${i}`);
      }

      const respone = await mongoDatabase
        .collection("chat-rooms")
        .updateOne({ id: parseInt(room_id) }, { $set: { prevMessages: a } }, { returnDocument: true });
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
        users: userInput.users,
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

  router.post("/invite/updateroom", async (req, res) => {
    try {
      const userInput = req.body;
      const { user_id, rooms } = userInput;

      // Find all rooms with the given IDs
      const chatRooms = await mongoDatabase
        .collection("chat-rooms")
        .find({ id: { $in: rooms } })
        .toArray();

      // Update each room to add the user_id to the users array if it's not already there
      for (const room of chatRooms) {
        if (!room.users.includes(user_id)) {
          await mongoDatabase.collection("chat-rooms").updateOne({ id: room.id }, { $addToSet: { users: user_id } });
        }
      }

      res.sendStatus(204);
    } catch (error) {
      console.error("Error updating rooms:", error);
      res.status(500).json({ error: "Failed to update rooms" });
    }
  });

  router.delete("/remove/room", async (req, res) => {
    try {
      const userInput = req.body;
      const { room_id } = userInput;

      const roomId = parseInt(room_id);

      const chatRoom = await mongoDatabase.collection("chat-rooms").findOneAndDelete({ id: roomId });

      if (chatRoom === null) {
        return res.status(404).json({ error: "Room not found" });
      }

      await mongoDatabase.collection("chat-messages").deleteMany({ chat_room: roomId });

      const roomsToReorder = await mongoDatabase
        .collection("chat-rooms")
        .find({ id: { $gt: roomId } })
        .toArray();

      for (const room of roomsToReorder) {
        const newRoomId = room.id - 1;

        await mongoDatabase.collection("chat-rooms").updateOne({ id: room.id }, { $set: { id: newRoomId } });

        await mongoDatabase
          .collection("chat-messages")
          .updateMany({ chat_room: room.id }, { $set: { chat_room: newRoomId } });
      }

      res.status(200).json({ deletedRoom: chatRoom });
    } catch (error) {
      console.error("Error removing room:", error);
      res.status(500).json({ error: "Failed to remove room" });
    }
  });

  router.put("/rooms/newroom", async (req, res) => {
    try {
      const { room_id, created_by_id, users, new_title, new_description } = req.body;
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
            { $set: { title: new_title, description: new_description, users: users } },
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
        { $set: { message: userInput.message, edited: true, seenBy: userInput.seenBy } },
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
      const { sendinguserid, messageid, seenBy } = req.params;
      const chatroom = parseInt(req.params.chatroom);
      await mongoDatabase.collection("chat-messages").updateOne(
        {
          sending_user_id: sendinguserid,
          chat_room: chatroom,
          message_id: parseInt(messageid),
        },
        { $set: { deleted: true, seenBy: [sendinguserid] } },
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
        res.json(chats);
      } else {
        res.status(204).json({ message: "Currently no messages in this chat" });
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  return router;
}
