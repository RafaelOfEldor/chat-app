import { Router } from "express";
import dotenv from "dotenv";

dotenv.config();

// export const AuthenticationRouter = express.Router();

export function AuthenticationRouter(mongoDatabase) {
  const router = new Router();

  router.get("/login", async (req, res) => {
    try {
      if (req.user) {
        const user = {
          id: req.user.sub,
          email: req.user.email,
          username: req.user.username,
          bio: "",
          friends: [],
          requests: [],
          active_chats: [],
          status: "online"
        };
        const userExists = await mongoDatabase.collection("users").findOne({ id: req.user.sub });
        if (!userExists) {
          await mongoDatabase.collection("users").insertOne(user);
        }
        res.send(req.user);
      } else {
        res.sendStatus(401);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  router.delete("/login", (req, res) => {
    try {
      console.log(req.user);
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

  router.post("/login/accessToken", async (req, res) => {
    try {
      res.cookie("access_token", req.body.access_token, { signed: true });
      res.sendStatus(204);
    } catch (error) {
      console.error("Error getting access token:", error);
      res.status(500).json({ error: "Failed to get access token" });
    }
    res.end();
  });

  return router;
}
