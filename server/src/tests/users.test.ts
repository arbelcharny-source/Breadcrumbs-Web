import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import User from "../models/user.js";

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});
});

describe("Users API", () => {
  test("Register a new user", async () => {
    const response = await request(app).post("/users/register").send({
      username: "testuser",
      email: "test@example.com",
      fullName: "Test User",
      password: "password123"
    });
    expect(response.statusCode).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe("testuser");
    expect(response.body.data.user.email).toBe("test@example.com");
    expect(response.body.data.user.password).not.toBeDefined();
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
    expect(typeof response.body.data.accessToken).toBe("string");
    expect(typeof response.body.data.refreshToken).toBe("string");
  });

  test("Fail to register duplicate username", async () => {
    await request(app).post("/users/register").send({
      username: "testuser",
      email: "test@example.com",
      fullName: "Test User",
      password: "password123"
    });

    const response = await request(app).post("/users/register").send({
      username: "testuser",
      email: "different@example.com",
      fullName: "Another User",
      password: "password456"
    });
    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Username already exists");
  });

  test("Fail to register duplicate email", async () => {
    await request(app).post("/users/register").send({
      username: "testuser",
      email: "test@example.com",
      fullName: "Test User",
      password: "password123"
    });

    const response = await request(app).post("/users/register").send({
      username: "differentuser",
      email: "test@example.com",
      fullName: "Another User",
      password: "password456"
    });
    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Email already exists");
  });

  test("Fail to register user without required fields", async () => {
    const response = await request(app).post("/users/register").send({
      username: "missingFields"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Fail to register user with invalid email", async () => {
    const response = await request(app).post("/users/register").send({
      username: "testuser",
      email: "invalid-email",
      fullName: "Test User",
      password: "password123"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid email format");
  });

  test("Login with valid credentials", async () => {
    await request(app).post("/users/register").send({
      username: "loginuser",
      email: "login@example.com",
      fullName: "Login User",
      password: "password123"
    });

    const response = await request(app).post("/users/login").send({
      username: "loginuser",
      password: "password123"
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.username).toBe("loginuser");
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  test("Fail to login with invalid password", async () => {
    await request(app).post("/users/register").send({
      username: "loginuser",
      email: "login@example.com",
      fullName: "Login User",
      password: "password123"
    });

    const response = await request(app).post("/users/login").send({
      username: "loginuser",
      password: "wrongpassword"
    });

    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.error).toBe("Invalid username or password");
  });

  test("Refresh token successfully", async () => {
    const registerResponse = await request(app).post("/users/register").send({
      username: "refreshuser",
      email: "refresh@example.com",
      fullName: "Refresh User",
      password: "password123"
    });

    const refreshToken = registerResponse.body.data.refreshToken;

    const response = await request(app).post("/users/refresh").send({
      refreshToken
    });

    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.accessToken).toBeDefined();
    expect(response.body.data.refreshToken).toBeDefined();
  });

  test("Get all users", async () => {
    await request(app).post("/users/register").send({
      username: "user1",
      email: "user1@example.com",
      fullName: "User One",
      password: "password123"
    });
    await request(app).post("/users/register").send({
      username: "user2",
      email: "user2@example.com",
      fullName: "User Two",
      password: "password123"
    });

    const response = await request(app).get("/users");
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBe(2);
  });

  test("Get user by ID", async () => {
    const registerResponse = await request(app).post("/users/register").send({
      username: "getuser",
      email: "getuser@example.com",
      fullName: "Get User",
      password: "password123"
    });
    const userId = registerResponse.body.data.user._id;

    const response = await request(app).get(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data._id).toBe(userId);
    expect(response.body.data.username).toBe("getuser");
  });

  test("Get user by ID - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).get(`/users/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Get user by ID - Invalid format", async () => {
    const response = await request(app).get("/users/invalid_id");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update user", async () => {
    const registerResponse = await request(app).post("/users/register").send({
      username: "updateuser",
      email: "updateuser@example.com",
      fullName: "Update User",
      password: "password123"
    });
    const userId = registerResponse.body.data.user._id;

    const response = await request(app).put(`/users/${userId}`).send({
      fullName: "Updated Name",
      email: "updated@example.com"
    });
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.fullName).toBe("Updated Name");
    expect(response.body.data.email).toBe("updated@example.com");
  });

  test("Update user - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).put(`/users/${nonExistentId}`).send({
      fullName: "New Name"
    });
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Update user - Invalid format", async () => {
    const response = await request(app).put("/users/invalid_id").send({
      fullName: "New Name"
    });
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test("Update user - Duplicate email", async () => {
    await request(app).post("/users/register").send({
      username: "existinguser",
      email: "existing@example.com",
      fullName: "Existing User",
      password: "password123"
    });
    const registerResponse = await request(app).post("/users/register").send({
      username: "updateuser2",
      email: "updateuser2@example.com",
      fullName: "Update User 2",
      password: "password123"
    });
    const userId = registerResponse.body.data.user._id;

    const response = await request(app).put(`/users/${userId}`).send({
      email: "existing@example.com"
    });
    expect(response.statusCode).toBe(409);
    expect(response.body.success).toBe(false);
  });

  test("Delete user", async () => {
    const registerResponse = await request(app).post("/users/register").send({
      username: "deleteuser",
      email: "deleteuser@example.com",
      fullName: "Delete User",
      password: "password123"
    });
    const userId = registerResponse.body.data.user._id;

    const response = await request(app).delete(`/users/${userId}`);
    expect(response.statusCode).toBe(200);
    expect(response.body.success).toBe(true);

    const checkResponse = await request(app).get(`/users/${userId}`);
    expect(checkResponse.statusCode).toBe(404);
  });

  test("Delete user - Not Found", async () => {
    const nonExistentId = new mongoose.Types.ObjectId();
    const response = await request(app).delete(`/users/${nonExistentId}`);
    expect(response.statusCode).toBe(404);
    expect(response.body.success).toBe(false);
  });

  test("Delete user - Invalid format", async () => {
    const response = await request(app).delete("/users/invalid_id");
    expect(response.statusCode).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

test("Fail to login with non-existent username", async () => {
    const response = await request(app).post("/users/login").send({
      username: "ghost_user",
      password: "password123"
    });
    expect(response.statusCode).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test("Fail to refresh token - Missing token", async () => {
    const response = await request(app).post("/users/refresh").send({});
    expect(response.statusCode).toBe(400); 
  });

  test("Fail to refresh token - Invalid token", async () => {
    const response = await request(app).post("/users/refresh").send({
        refreshToken: "invalid_token_string_123"
    });
    expect(response.statusCode).toBe(401);
  });

  test("Logout successfully", async () => {
    const registerResponse = await request(app).post("/users/register").send({
      username: "logoutuser",
      email: "logout@example.com",
      fullName: "Logout User",
      password: "password123"
    });
    
    const refreshToken = registerResponse.body.data.refreshToken;
    const accessToken = registerResponse.body.data.accessToken;

    const response = await request(app)
      .post("/users/logout")
      .set("Authorization", "Bearer " + accessToken)
      .send({ refreshToken });
    
    expect(response.statusCode).toBe(200);

    if (response.statusCode === 200) {
        const refreshRes = await request(app).post("/users/refresh").send({ refreshToken });
        expect(refreshRes.statusCode).not.toBe(200); 
    }
  });