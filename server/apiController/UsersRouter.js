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
