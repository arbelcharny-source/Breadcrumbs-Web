import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Post from "../models/post.js";
import User from "../models/user.js";

let mongoServer: MongoMemoryServer;
let userId: string;
let accessToken: string;

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
  accessToken = userRes.body.data.accessToken;
});

describe("Posts API", () => {
  test("Create a new post", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "Test Post",
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
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "Test Post",
        content: "Content",
        ownerId: "invalid_id",
        imageAttachmentUrl: "http://img.com/1.png"
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get all posts", async () => {
    await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
      });
    const response = await request(app).get("/posts");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  test("Get all posts - Pagination check", async () => {
    for (let i = 0; i < 5; i++) {
        await Post.create({
            title: "Post",
            content: `C ${i}`,
            ownerId: new mongoose.Types.ObjectId(userId)
        });
    }

    const response = await request(app).get("/posts?page=1&limit=2");
    expect(response.statusCode).toBe(200);
    expect(response.body.data.data.length).toBe(2);
    expect(response.body.data.pagination.total).toBe(5);
  });

  test("Get post by ID", async () => {
    const postRes = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
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
    await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
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
    const postRes = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "P1", content: "C1", ownerId: userId, imageAttachmentUrl: "url"
      });
    const postId = postRes.body.data._id;

    const response = await request(app)
      .put(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Updated Content"
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe("Updated Content");
  });

  test("Update Post - 401 Unauthorized (Not Owner)", async () => {
    const post = await Post.create({
        title: "User 1 Post",
        content: "Content",
        ownerId: new mongoose.Types.ObjectId(userId)
    });

    const res2 = await request(app).post("/users/register").send({
        username: "hacker",
        email: "hacker@test.com",
        fullName: "Hacker",
        password: "password123"
    });
    const hackerToken = res2.body.data.accessToken;

    const response = await request(app)
        .put(`/posts/${post._id}`)
        .set("Authorization", `Bearer ${hackerToken}`)
        .send({ content: "Hacked Content" });
    
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("You do not have permission to modify this post.");
  });

  test("Update post - Invalid format", async () => {
    const response = await request(app)
      .put("/posts/123_invalid")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Up" });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update post - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/posts/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Up" });
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Fail to create post without title", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Content only",
        ownerId: userId,
        imageAttachmentUrl: "http://img.com/1.png"
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Delete post", async () => {
    const postRes = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        tripName: "Delete Me", content: "To be deleted", ownerId: userId, imageAttachmentUrl: "url"
      });
    const postId = postRes.body.data._id;

    const response = await request(app)
      .delete(`/posts/${postId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const checkRes = await request(app).get(`/posts/${postId}`);
    expect(checkRes.statusCode).toBe(404);
  });

  test("Delete Post - 401 Unauthorized (Not Owner)", async () => {
    const post = await Post.create({
        title: "User 1 Post",
        content: "Content",
        ownerId: new mongoose.Types.ObjectId(userId)
    });

    const res2 = await request(app).post("/users/register").send({
        username: "hacker2",
        email: "hacker2@test.com",
        fullName: "Hacker 2",
        password: "password123"
    });
    const hackerToken = res2.body.data.accessToken;

    const response = await request(app)
        .delete(`/posts/${post._id}`)
        .set("Authorization", `Bearer ${hackerToken}`);
    
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("You do not have permission to modify this post.");
  });

  test("Delete post - Invalid format", async () => {
    const response = await request(app)
      .delete("/posts/invalid_id")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Delete post - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/posts/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Create Post - 401 Unauthorized (Missing Token)", async () => {
    const response = await request(app)
      .post("/posts")
      .send({
        title: "Unauthorized Post",
        content: "Content",
        ownerId: userId
      });
    expect(response.statusCode).toBe(401);
  });

  test("Create Post - 400 Bad Request (Missing Content)", async () => {
    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        title: "Missing Content",
        ownerId: userId
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get All Posts - Pagination with limit 0 (Edge Case)", async () => {
    const response = await request(app).get("/posts?page=1&limit=0");
    // Depending on implementation, it might return 400 or default limit. 
    // Usually, it's 200 with default limit or empty if handled.
    expect(response.statusCode).toBe(200);
  });
});

test("Fail to create post with empty content", async () => {
    const userRes = await request(app).post("/users/register").send({
        username: "poster_err",
        email: "postererr@example.com",
        fullName: "Poster User",
        password: "password123"
    });
    const token = userRes.body.data.accessToken;

    const response = await request(app)
      .post("/posts")
      .set("Authorization", `Bearer ${token}`)
      .send({
        tripName: "Title",
        content: "",
        ownerId: userRes.body.data.user._id
      });
    expect(response.statusCode).toBe(400); 
  });
