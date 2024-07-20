import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import path from 'path';
import { setupWebSocketServer } from './websocketServer.js';
import { serveClientApp, userMiddleware } from './middleware.js';
import { setupRoutes } from './apiController/routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(cookieParser(process.env.SECRET_COOKIE));
app.use(userMiddleware);

const mongoClient = new MongoClient(process.env.MONGODB_URL);
mongoClient.connect().then(() => {
  const db = mongoClient.db('chat-application-database');
  setupRoutes(app, db);
});

app.use(express.static('../client/dist'));
app.use(serveClientApp);

const server = app.listen(PORT, () => {
  console.log(`Running on http://localhost:${PORT}`);
});

setupWebSocketServer(server);
