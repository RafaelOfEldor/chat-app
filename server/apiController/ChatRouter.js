import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

// export const ChatRouter = express.Router();
export function ChatRouter(mongoDatabase) {
  const router = new Router();

  router.get("/log/:sendingUserId/:chatId", async (req, res) => {
    try {
      const { sendingUserId } = req.params;
      const chatId = parseInt(req.params.chatId);
      const chats = [];
      let i = 1;
      do {
        const chatExist = await mongoDatabase
          .collection("chat-messages")
          .findOne({
            chat_room: chatId,
            message_id: i,
          });

        if (chatExist) {
          const chat = await mongoDatabase
            .collection("chat-messages")
            .find({
              chat_room: chatId,
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
        res.status(204);
        res.end();
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.get("/rooms", async (req, res) => {
    try {
      const rooms = await mongoDatabase
        .collection("chat-rooms")
        .find()
        .toArray();
      // console.log(rooms);
      res.send(rooms);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      res.status(500).json({ error: "Failed to fetch rooms" });
    }
  });

  router.get("/room/:chatid", async (req, res) => {
    try {
      const { chatid } = req.params;
      const chatId = parseInt(chatid);
      const room = await mongoDatabase
        .collection("chat-rooms")
        .find({ id: chatId })
        .toArray();
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
      const roomExist = await mongoDatabase
        .collection("chat-rooms")
        .findOne({ title: data.title });
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
      const roomExist = await mongoDatabase
        .collection("chat-rooms")
        .findOne({ title: new_title });

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

  router.delete(
    "/deletemessage/:sendinguserid/:chatroom/:messageid",
    async (req, res) => {
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
    },
  );

  return router;
}
