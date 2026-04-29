import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Post from "../models/post.js";
import User from "../models/user.js";

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;
let userId: string;
let accessToken: string;
let otherUserId: string;

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
  await Post.deleteMany({});
  await User.deleteMany({});

  const userRes = await request(app).post("/users/register").send({
    username: "poster",
    email: "poster@example.com",
    fullName: "Poster User",
    password: "password123"
  });
  userId = userRes.body.data.user._id;
  accessToken = userRes.body.data.accessToken;

  const otherRes = await request(app).post("/users/register").send({
    username: "other",
    email: "other@example.com",
    fullName: "Other User",
    password: "password123"
  });
  otherUserId = otherRes.body.data.user._id;
});

describe("Posts API Extended", () => {
  test("Create Post Success", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "Japan",
        content: "Sushi",
        ownerId: userId
      });
    expect(response.statusCode).toBe(201);
  });

  test("404 Create Post - User Not Found", async () => {
    const fakeId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ tripName: "X", content: "X", ownerId: fakeId });
    expect(response.statusCode).toBe(404);
  });

  test("Get All Posts", async () => {
    await Post.create({ title: "P", content: "C", ownerId: userId });
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
  });

  test("Get Post By ID", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: userId });
    const response = await request(app).get(`/posts/${post._id}`);
    expect(response.statusCode).toBe(200);
  });

  test("Update Post Success", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: userId });
    const response = await request(app)
      .put(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "New" });
    expect(response.statusCode).toBe(200);
  });

  test("401 Update Post - Not Owner", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: otherUserId });
    const response = await request(app)
      .put(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ title: "Hacked" });
    expect(response.statusCode).toBe(401);
  });

  test("Delete Post Success", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: userId });
    const response = await request(app)
      .delete(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
  });

  test("401 Delete Post - Not Owner", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: otherUserId });
    const response = await request(app)
      .delete(`/posts/${post._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(401);
  });

  test("Toggle Like Success", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: userId });
    const response = await request(app)
      .post(`/posts/like/${post._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
  });

  test("401 Toggle Like - No Auth", async () => {
    const post = await Post.create({ title: "T", content: "C", ownerId: userId });
    const response = await request(app).post(`/posts/like/${post._id}`);
    expect(response.statusCode).toBe(401);
  });
});
