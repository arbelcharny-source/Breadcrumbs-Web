import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Comment from "../models/comment.js";
import Post from "../models/post.js";
import User from "../models/user.js";

jest.setTimeout(60000);

let mongoServer: MongoMemoryServer;
let userId: string;
let accessToken: string;
let otherUserId: string;
let postId: string;

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
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await User.deleteMany({});

  const userRes = await request(app).post("/users/register").send({
    username: "commenter",
    email: "commenter@example.com",
    fullName: "Commenter",
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

  const postRes = await Post.create({
    title: "Post",
    content: "...",
    ownerId: userId
  });
  postId = postRes._id.toString();
});

describe("Comments API Extended", () => {
  test("Create Comment Success", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Nice", postId });
    expect(response.statusCode).toBe(201);
  });

  test("404 Create Comment - Post Not Found", async () => {
    const fakePostId = new mongoose.Types.ObjectId().toString();
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Nice", postId: fakePostId });
    expect(response.statusCode).toBe(404);
  });

  test("Get All Comments", async () => {
    await Comment.create({ content: "C", postId, ownerId: userId });
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
  });

  test("Get Comment By ID Success", async () => {
    const comment = await Comment.create({ content: "C", postId, ownerId: userId });
    const response = await request(app).get(`/comments/${comment._id}`);
    expect(response.statusCode).toBe(200);
  });

  test("Update Comment Success", async () => {
    const comment = await Comment.create({ content: "Old", postId, ownerId: userId });
    const response = await request(app)
      .put(`/comments/${comment._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "New" });
    expect(response.statusCode).toBe(200);
  });

  test("401 Update Comment - Not Owner", async () => {
    const comment = await Comment.create({ content: "C", postId, ownerId: otherUserId });
    const response = await request(app)
      .put(`/comments/${comment._id}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Hacked" });
    expect(response.statusCode).toBe(401);
  });

  test("Delete Comment Success", async () => {
    const comment = await Comment.create({ content: "C", postId, ownerId: userId });
    const response = await request(app)
      .delete(`/comments/${comment._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
  });

  test("401 Delete Comment - Not Owner", async () => {
    const comment = await Comment.create({ content: "C", postId, ownerId: otherUserId });
    const response = await request(app)
      .delete(`/comments/${comment._id}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(401);
  });
});
