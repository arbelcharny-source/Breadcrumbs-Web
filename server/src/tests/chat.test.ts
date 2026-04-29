import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import User from "../models/user.js";
import Message from "../models/message.js";

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;
let user1Id: string;
let user2Id: string;
let user1Token: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

beforeEach(async () => {
  await User.deleteMany({});
  await Message.deleteMany({});

  const res1 = await request(app).post("/users/register").send({
    username: "user1",
    email: "u1@test.com",
    fullName: "U1",
    password: "password123"
  });
  user1Id = res1.body.data.user._id;
  user1Token = res1.body.data.accessToken;

  const res2 = await request(app).post("/users/register").send({
    username: "user2",
    email: "u2@test.com",
    fullName: "U2",
    password: "password123"
  });
  user2Id = res2.body.data.user._id;
});

describe("Chat API", () => {
  test("Get Chat History Success", async () => {
    await Message.create({ senderId: user1Id, receiverId: user2Id, content: "Hello" });
    await Message.create({ senderId: user2Id, receiverId: user1Id, content: "Hi" });

    const response = await request(app)
      .get(`/chat/history/${user2Id}`)
      .set("Authorization", `Bearer ${user1Token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.length).toBe(2);
  });

  test("Get User Chats (Partners List)", async () => {
    await Message.create({ senderId: user1Id, receiverId: user2Id, content: "Hello" });

    const response = await request(app)
      .get("/chat/users")
      .set("Authorization", `Bearer ${user1Token}`);

    expect(response.statusCode).toBe(200);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0]._id).toBe(user2Id);
  });

  test("401 Get Chat History - No Auth", async () => {
    const response = await request(app).get(`/chat/history/${user2Id}`);
    expect(response.statusCode).toBe(401);
  });

  test("400 Get Chat History - Invalid Partner ID", async () => {
    const response = await request(app)
      .get("/chat/history/invalid_id")
      .set("Authorization", `Bearer ${user1Token}`);
    expect(response.statusCode).toBe(400);
  });
});
