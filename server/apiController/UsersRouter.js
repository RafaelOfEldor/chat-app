import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

// export const UsersRouter = express.Router();

export function UsersRouter(mongoDatabase) {
  const router = new Router();

  router.get("/bymail/:useremail", async (req, res) => {
    try {
      const wantedUsersEmail = req.params.useremail;
      const userExists = await mongoDatabase
        .collection("users")
        .findOne({ email: wantedUsersEmail });
      if (userExists) {
        // console.log("user exists");
        res.json(userExists);
      } else {
        // console.log("user does not exist");
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error looking for user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.get("/byid/:userid", async (req, res) => {
    try {
      const wantedUsersId = req.params.userid;
      // console.log(wantedUsersId);
      const userExists = await mongoDatabase
        .collection("users")
        .findOne({ id: wantedUsersId });
      if (userExists) {
        // console.log("user exists");
        res.json(userExists);
      } else {
        // console.log("user does not exist");
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error looking for user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.post("/allfriends", async (req, res) => {
    try {
      const user_ids = req.body.user_ids;
      if (!Array.isArray(user_ids)) {
        return res
          .status(400)
          .json({ error: "Invalid input, expected an array of user IDs" });
      }

      const users = await mongoDatabase
        .collection("users")
        .find({ id: { $in: user_ids } })
        .toArray();

      if (users.length > 0) {
        res.json(users);
      } else {
        res.sendStatus(404); // No users found
      }
    } catch (error) {
      console.error("Error looking for users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  router.post("/allrequests", async (req, res) => {
    try {
      const user_ids = req.body.user_ids;
      if (!Array.isArray(user_ids)) {
        return res
          .status(400)
          .json({ error: "Invalid input, expected an array of user IDs" });
      }

      const users = await mongoDatabase
        .collection("users")
        .find({ id: { $in: user_ids } })
        .toArray();

      if (users.length > 0) {
        res.json(users);
      } else {
        res.sendStatus(404); // No users found
      }
    } catch (error) {
      console.error("Error looking for users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  router.delete("/login", (req, res) => {
    try {
      // console.log(req.user);
      res.clearCookie("username");
      res.clearCookie("access_token");
      res.sendStatus(204);
    } catch (error) {
      console.error("Error login out:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
    res.end();
  });

  router.post("/login", async (req, res) => {
    try {
      const { access_token } = req.body;
      res.cookie("username", req.body.username, { signed: true });
      res.cookie("access_token", access_token, { signed: true });
      res.sendStatus(204);
    } catch (error) {
      console.error("Error login in:", error);
      res.status(500).json({ error: "Failed to create goal" });
    }
    res.end();
  });

  router.put("/changebio", async (req, res) => {
    try {
      const { user_id, updated_bio } = req.body;
      // console.log(req.body);
      await mongoDatabase.collection("users").updateOne(
        {
          id: user_id,
        },
        { $set: { bio: updated_bio } },
        { returnDocument: true },
      );
      res.sendStatus(204);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.post("/send/request", async (req, res) => {
    try {
      const { receiving_user_id, user_id } = req.body;
      // console.log(req.body);
      await mongoDatabase.collection("users").findOneAndUpdate(
        { id: receiving_user_id },
        { $push: { requests: user_id } },
        { returnOriginal: false }, // This option ensures that the updated document is returned
      );

      const result = await mongoDatabase
        .collection("users")
        .findOne({ id: receiving_user_id });

      if (result) {
        res.json(result);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.post("/accept/request", async (req, res) => {
    try {
      const { receiving_user_id, user_id } = req.body;
      // console.log(req.body);
      await mongoDatabase
        .collection("users")
        .updateOne(
          { id: receiving_user_id },
          { $pull: { requests: user_id } },
          { returnDocument: true },
        )
        .then((result) => {
          return mongoDatabase
            .collection("users")
            .updateOne(
              { id: user_id },
              { $push: { friends: receiving_user_id } },
              { returnDocument: true },
            );
        })
        .then((result) => {
          return mongoDatabase
            .collection("users")
            .updateOne(
              { id: receiving_user_id },
              { $push: { friends: user_id } },
              { returnDocument: true },
            );
        })
        .catch((error) => {
          console.error("An error occurred:", error);
        });

      const result1 = await mongoDatabase
        .collection("users")
        .findOne({ id: receiving_user_id });

      const result2 = await mongoDatabase
        .collection("users")
        .findOne({ id: user_id });

      if (result1 && result2) {
        const returnMessage = [result1, result2];
        res.json(returnMessage);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.delete("/remove/request", async (req, res) => {
    try {
      const { receiving_user_id, user_id } = req.body;
      // console.log(req.body);
      await mongoDatabase
        .collection("users")
        .findOneAndUpdate(
          { id: receiving_user_id },
          { $pull: { requests: user_id } },
          { returnOriginal: false },
        );

      const result = await mongoDatabase
        .collection("users")
        .findOne({ id: receiving_user_id });

      if (result) {
        res.json(result);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.delete("/remove/friend", async (req, res) => {
    try {
      const { receiving_user_id, user_id } = req.body;
      // console.log(req.body);
      await mongoDatabase
        .collection("users")
        .updateOne(
          { id: user_id },
          { $pull: { friends: receiving_user_id } },
          { returnDocument: true },
        )
        .then((result) => {
          return mongoDatabase
            .collection("users")
            .updateOne(
              { id: receiving_user_id },
              { $pull: { friends: user_id } },
              { returnDocument: true },
            );
        });

      const result1 = mongoDatabase
        .collection("users")
        .findOne({ id: user_id });
      const result2 = mongoDatabase
        .collection("users")
        .findOne({ id: receiving_user_id });

      if (result1 && result2) {
        const returnMessage = [result1, result2];
        res.json(returnMessage);
      } else {
        res.sendStatus(404);
      }
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.put("/changeusername", async (req, res) => {
    try {
      const { user_id, updated_username } = req.body;
      // console.log(req.body);
      await mongoDatabase.collection("users").updateOne(
        {
          id: user_id,
        },
        { $set: { username: updated_username } },
        { returnDocument: true },
      );
      res.sendStatus(204);
    } catch (error) {
      console.error("Error updating goal:", error);
      res.status(500).json({ error: "Failed to update goal" });
    }
    res.end();
  });

  router.get("/get/allusers", async (req, res) => {
    try {
      const users = await mongoDatabase.collection("users").find().toArray();
      if (users) {
        res.send(users);
      } else {
        res.status(500);
        res.send("We had an error fetching users");
      }
    } catch (error) {
      console.error("Error login out:", error);
      res.status(500).json({ error: "Failed to delete goal" });
    }
    res.end();
  });

  return router;
}
