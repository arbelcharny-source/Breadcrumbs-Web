import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Post from "../models/post.js";
import User from "../models/user.js";

let mongoServer: MongoMemoryServer;
let userId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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
});

describe("Posts API", () => {
  test("Create a new post", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post",
      content: "Content",
      ownerId: userId,
      imageAttachmentUrl: "http://img.com/1.png"
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.title).toBe("Test Post");
    expect(response.body.data.ownerId).toBe(userId);
  });

  test("Fail to create post with invalid ownerId format", async () => {
    const response = await request(app).post("/posts").send({
      title: "Test Post",
      content: "Content",
      ownerId: "invalid_id",
      imageAttachmentUrl: "http://img.com/1.png"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get all posts", async () => {
    await request(app).post("/posts").send({
        title: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
    });
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  test("Get post by ID", async () => {
    const postRes = await request(app).post("/posts").send({
        title: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
    });
    const postId = postRes.body.data._id;

    const response = await request(app).get(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(postId);
  });

  test("Get post by ID - Invalid format", async () => {
    const response = await request(app).get("/posts/123_invalid");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get post by ID - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/posts/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Get posts by Sender", async () => {
    await request(app).post("/posts").send({
        title: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
    });

    const response = await request(app).get(`/posts/sender/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
    expect(response.body.data[0].ownerId).toBe(userId);
  });

  test("Get posts by Sender - Invalid format", async () => {
    const response = await request(app).get("/posts/sender/123_invalid");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update post", async () => {
    const postRes = await request(app).post("/posts").send({
        title: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
    });
    const postId = postRes.body.data._id;

    const response = await request(app).put(`/posts/${postId}`).send({
        content: "Updated Content"
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe("Updated Content");
  });

  test("Update post - Invalid format", async () => {
    const response = await request(app).put("/posts/123_invalid").send({ content: "Up" });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update post - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).put(`/posts/${nonExistentId}`).send({ content: "Up" });
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Fail to create post without title", async () => {
    const response = await request(app).post("/posts").send({
      content: "Content only",
      ownerId: userId,
      imageAttachmentUrl: "http://img.com/1.png"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Delete post", async () => {
    const postRes = await request(app).post("/posts").send({
      title: "Delete Me", content: "To be deleted", ownerId: userId, imageAttachmentUrl: "url"
    });
    const postId = postRes.body.data._id;

    const response = await request(app).delete(`/posts/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const checkRes = await request(app).get(`/posts/${postId}`);
    expect(checkRes.statusCode).toBe(404);
  });

  test("Delete post - Invalid format", async () => {
    const response = await request(app).delete("/posts/invalid_id");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Delete post - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).delete(`/posts/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });
});

test("Fail to create post with empty content", async () => {
    const response = await request(app).post("/posts").send({
      title: "Title",
      content: "",
      ownerId: userId
    });
    expect(response.statusCode).toBe(400); 
  });
