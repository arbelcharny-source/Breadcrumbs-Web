import request from "supertest";
import app from "../app.js";

describe("Validation Middleware - Negative Tests", () => {
  test("Fail registration - Email missing @", async () => {
    const res = await request(app).post("/users/register").send({
      username: "testuser",
      email: "invalidemail",
      fullName: "Test",
      password: "password123"
    });
    expect(res.statusCode).toBe(400);
  });

  test("Fail registration - Password too short", async () => {
    const res = await request(app).post("/users/register").send({
      username: "testuser",
      email: "test@test.com",
      fullName: "Test",
      password: "123"
    });
    expect(res.statusCode).toBe(400);
  });

  test("Fail post creation - Missing content", async () => {
    const res = await request(app).post("/posts").send({
      tripName: "Israel"
      // content is missing
    });
    expect(res.statusCode).toBe(401);
  });
});