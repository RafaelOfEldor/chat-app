import request from "supertest";
import express from "express";
import bodyParser from "body-parser";
import { UsersRouter } from "../apiController/UsersRouter.js";
import { ChatRouter } from "../apiController/ChatRouter.js";
import { MongoClient } from "mongodb";

const app = express();
app.use(bodyParser.json());

let mongoConnection;
let server;

beforeAll(async () => {
  mongoConnection = await new MongoClient(process.env.MONGODB_URL).connect();
  app.use(ChatRouter(mongoConnection.db("Test")));
  app.use(UsersRouter(mongoConnection.db("Test")));
  server = app.listen();
  const userOne = {
    id: "1234",
    email: "validEmailOne@validprovider.com",
    username: "validUserOne",
    bio: "",
  };
  const userTwo = {
    id: "5678",
    email: "validEmailTwo@validprovider.com",
    username: "validUserTwo",
    bio: "",
  };
  const userExists = await mongoConnection.db("Test").collection("users").findOne({ id: "1234" });
  if (!userExists) {
    await mongoConnection.db("Test").collection("users").insertOne(userOne);
    await mongoConnection.db("Test").collection("users").insertOne(userTwo);
  }
});

afterAll(async () => {
  await mongoConnection.close();
  server.close();
});

describe("Chat rooms functionality", () => {
  it("a user can create a chatroom", async () => {
    const userInput = {
      title: "New room from test suite!",
      description: "For testing purposes",
      id: 1,
      created_by: "validUserOne",
      created_by_id: "1234",
    };

    const secondUserInput = {
      title: "Another new room from test suite!",
      description: "For more testing purposes",
      id: 2,
      created_by: "validUserTwo",
      created_by_id: "5678",
    };
    await request(app).post("/rooms/newroom").send(secondUserInput).expect(204);

    await request(app).post("/rooms/newroom").send(userInput).expect(204);
    const res = await request(app).get("/rooms").expect(200);
    expect(res.body.map((m) => m.title)).toContain("New room from test suite!");
    expect(res.body.map((m) => m.created_by)).toContain("validUserOne");
    expect(res.body.map((m) => m.created_by_id)).toContain("1234");
    expect(res.body.map((m) => m.id)).toContain(1);
    expect(res.body.map((m) => m.description)).toContain("For testing purposes");
  });

  it("a user cannot create a chatroom with a title that already exists", async () => {
    const userInput = {
      title: "New room from test suite!",
      description: "For testing purposes",
      id: 1,
      created_by: "validUserOne",
      created_by_id: "1234",
    };
    await request(app).post("/rooms/newroom").send(userInput).expect(406);
  });

  it("a user can edit their own chatroom", async () => {
    const userInput = {
      new_title: "Updated room title from test suite!",
      new_description: "For updated testing purposes",
      room_id: 1,
      created_by_id: "1234",
    };
    await request(app).put("/rooms/newroom").send(userInput).expect(204);
    const res = await request(app).get("/rooms").expect(200);
    expect(res.body.map((m) => m.title)).toContain("Updated room title from test suite!");
    expect(res.body.map((m) => m.created_by)).toContain("validUserOne");
    expect(res.body.map((m) => m.created_by_id)).toContain("1234");
    expect(res.body.map((m) => m.id)).toContain(1);
    expect(res.body.map((m) => m.description)).toContain("For updated testing purposes");
  });

  it("a user cannot edit their title to an existing one", async () => {
    const userInput = {
      new_title: "Another new room from test suite!",
      new_description: "For updated testing purposes",
      room_id: 1,
      created_by_id: "1234",
    };
    const res = await request(app).put("/rooms/newroom").send(userInput).expect(406);
  });

  it("a user cannot edit someone elses chatroom", async () => {
    const userInput = {
      new_title: "General chat",
      new_description: "For updated testing purposes",
      room_id: 2,
      created_by_id: "1234",
    };
    const res = await request(app).put("/rooms/newroom").send(userInput).expect(401);
  });
});

describe("Chat functionality", () => {
  it("a user can send a message in a chat room", async () => {
    const userInput = {
      sending_user: "validUserOne",
      sending_user_id: "1234",
      chat_room: 1,
      edited: false,
      deleted: false,
      message_id: 1,
      message: "Hello World!",
      date: new Date().toString(),
    };
    await request(app).post("/sendmessage").send(userInput).expect(204);
  });

  it("a user can see someone elses message in a chat room", async () => {
    const sendingUserId = "1234";
    const chatId = 1;
    const message = "Hello World!";
    const res = await request(app).get(`/log/${sendingUserId}/${chatId}`);
    expect(res.body.map((m) => m.message)).toContain(message);
    expect(res.body.map((m) => m.sending_user)).toContain("validUserOne");
    expect(res.body.map((m) => m.chat_room)).toContain(1);
    expect(res.body.map((m) => m.message_id)).toContain(1);
    expect(res.status).toBe(200);
  });

  it("a user can edit their message in a chat room", async () => {
    const userInput = {
      sending_user: "validUserOne",
      sending_user_id: "1234",
      chat_room: 1,
      edited: true,
      deleted: false,
      message_id: 1,
      message: "Hello World! Updated!",
      date: new Date().toString(),
    };
    await request(app).put("/sendmessage").send(userInput);
    const res = await request(app).get(`/log/${userInput.sending_user_id}/${userInput.chat_room}`);
    expect(res.body.map((m) => m.message)).toContain("Hello World! Updated!");
    expect(res.body.map((m) => m.edited)).toContain(true);
    expect(res.body.map((m) => m.sending_user)).toContain("validUserOne");
    expect(res.body.map((m) => m.chat_room)).toContain(1);
    expect(res.body.map((m) => m.message_id)).toContain(1);
    expect(res.status).toBe(200);
  });

  it("a user can delete their message in a chat room", async () => {
    const userInput = {
      sending_user: "validUserOne",
      sending_user_id: "1234",
      chat_room: 1,
      edited: true,
      deleted: false,
      message_id: 1,
      message: "Hello World! Updated!",
      date: new Date().toString(),
    };
    await request(app).delete(
      `/deletemessage/${userInput.sending_user_id}/${userInput.chat_room}/${userInput.message_id}`,
    );
    const res = await request(app).get(`/log/${userInput.sending_user_id}/${userInput.chat_room}`);
    expect(res.body.map((m) => m.deleted)).toContain(true);
    expect(res.body.map((m) => m.sending_user)).toContain("validUserOne");
    expect(res.body.map((m) => m.chat_room)).toContain(1);
    expect(res.body.map((m) => m.message_id)).toContain(1);
    expect(res.status).toBe(200);
    await mongoConnection.db("Test").collection("chat-messages").deleteOne({
      sending_user: "validUserOne",
      sending_user_id: "1234",
      chat_room: 1,
      edited: true,
      deleted: true,
      message_id: 1,
      message: "Hello World! Updated!",
    });
  });
});

describe("User profile functionality", () => {
  it("a user can change their username", async () => {
    const userInput = {
      user_id: "1234",
      updated_username: "validUpdatedUsernameOne",
    };
    await request(app).put("/changeusername").send(userInput).expect(204);
    const res = await request(app).get(`/byid/${1234}`).expect(200);
    const userId = res.body.id;
    const username = res.body.username;
    const email = res.body.email;
    const bio = res.body.bio;
    expect(userId).toContain("1234");
    expect(username).toContain("validUpdatedUsernameOne");
    expect(email).toContain("validEmailOne@validprovider.com");
    expect(bio).toContain("");
    const revertChangesInput = {
      user_id: "1234",
      updated_username: "validUserOne",
    };
    await request(app).put("/changeusername").send(revertChangesInput).expect(204);
  });

  it("a user can change their bio", async () => {
    const userInput = {
      user_id: "1234",
      updated_bio: "My updated bio!",
    };
    await request(app).put("/changebio").send(userInput).expect(204);
    const res = await request(app).get(`/byid/${1234}`).expect(200);
    const userId = res.body.id;
    const username = res.body.username;
    const email = res.body.email;
    const bio = res.body.bio;
    expect(userId).toContain("1234");
    expect(username).toContain("validUserOne");
    expect(email).toContain("validEmailOne@validprovider.com");
    expect(bio).toContain("My updated bio!");
    const revertChangesInput = {
      user_id: "1234",
      updated_bio: "",
    };
    await request(app).put("/changebio").send(revertChangesInput).expect(204);
    await mongoConnection.db("Test").collection("chat-rooms").deleteOne({
      title: "Updated room title from test suite!",
      description: "For updated testing purposes",
      id: 1,
      created_by: "validUserOne",
      created_by_id: "1234",
    });

    await mongoConnection.db("Test").collection("chat-rooms").deleteOne({
      title: "Another new room from test suite!",
      description: "For more testing purposes",
      id: 2,
      created_by: "validUserTwo",
      created_by_id: "5678",
    });
  });
});
