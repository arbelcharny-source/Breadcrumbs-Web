import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Comment from "../models/comment.js";
import Post from "../models/post.js";
import User from "../models/user.js";

let mongoServer: MongoMemoryServer;
let userId: string;
let accessToken: string;
let postId: string;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
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

  const postRes = await request(app)
    .post("/posts")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({
      tripName: "Post", content: "...", ownerId: userId, imageAttachmentUrl: "url"
    });
  postId = postRes.body.data._id;
});

describe("Comments API", () => {
  test("Create a new comment", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Nice post!",
        postId: postId,
        ownerId: userId
      });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe("Nice post!");
  });

  test("Create Comment - 401 Unauthorized (Missing Token)", async () => {
    const response = await request(app)
        .post("/comments")
        .send({
            content: "Ghost comment",
            postId: postId
        });
    expect(response.statusCode).toBe(401);
  });

  test("Fail to create comment with invalid postId", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Bad post id",
        postId: "123_invalid",
        ownerId: userId
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get all comments", async () => {
    await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "C1", postId, ownerId: userId });
    const response = await request(app).get("/comments");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  test("Get comment by ID", async () => {
    const commentRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "C1", postId, ownerId: userId });
    const commentId = commentRes.body.data._id;

    const response = await request(app).get(`/comments/${commentId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(commentId);
  });

  test("Get comment by ID - Invalid format", async () => {
    const response = await request(app).get("/comments/123_invalid");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Get comment by ID - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/comments/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Get comments by Post ID", async () => {
    await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "C1", postId, ownerId: userId });

    const response = await request(app).get(`/comments/post/${postId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(1);
  });

  test("Get comments by Post ID - Invalid format", async () => {
    const response = await request(app).get("/comments/post/123_invalid");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update comment", async () => {
    const commentRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Old", postId, ownerId: userId });
    const commentId = commentRes.body.data._id;

    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Updated"
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.content).toBe("Updated");
  });

  test("Update Comment - 401 Unauthorized (Not Owner)", async () => {
    const commentRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "User 1 comment", postId, ownerId: userId });
    const commentId = commentRes.body.data._id;

    const res2 = await request(app).post("/users/register").send({
        username: "hacker",
        email: "hacker@test.com",
        fullName: "Hacker",
        password: "password123"
    });
    const hackerToken = res2.body.data.accessToken;

    const response = await request(app)
      .put(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${hackerToken}`)
      .send({ content: "Hacked" });
    
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("You do not have permission to modify this comment.");
  });

  test("Update comment - Invalid format", async () => {
    const response = await request(app)
      .put("/comments/123_invalid")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Up" });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update comment - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .put(`/comments/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Up" });
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Delete comment", async () => {
    const commentRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Del", postId, ownerId: userId });
    const commentId = commentRes.body.data._id;

    const response = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const checkRes = await request(app).get(`/comments/${commentId}`);
    expect(checkRes.statusCode).toBe(404);
  });

  test("Delete Comment - 401 Unauthorized (Not Owner)", async () => {
    const commentRes = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ content: "Owner comment", postId, ownerId: userId });
    const commentId = commentRes.body.data._id;

    const res2 = await request(app).post("/users/register").send({
        username: "hacker2",
        email: "hacker2@test.com",
        fullName: "Hacker 2",
        password: "password123"
    });
    const hackerToken = res2.body.data.accessToken;

    const response = await request(app)
      .delete(`/comments/${commentId}`)
      .set("Authorization", `Bearer ${hackerToken}`);
    
    expect(response.statusCode).toBe(401);
    expect(response.body.error).toBe("You do not have permission to modify this comment.");
  });

  test("Delete comment - Invalid format", async () => {
    const response = await request(app)
      .delete("/comments/123_invalid")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Delete comment - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app)
      .delete(`/comments/${nonExistentId}`)
      .set("Authorization", `Bearer ${accessToken}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Fail to create comment without postId", async () => {
    const response = await request(app)
      .post("/comments")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({
        content: "Orphan comment",
        ownerId: userId
      });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});
