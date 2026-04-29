import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import Post from "../models/post.js";
import User from "../models/user.js";

jest.setTimeout(60000);

jest.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => {
      return {
        getGenerativeModel: jest.fn().mockImplementation(() => {
          return {
            generateContent: jest.fn().mockImplementation((prompt) => {
              if (prompt.includes("fail_me")) {
                throw new Error("Gemini Error");
              }
              return Promise.resolve({
                response: {
                  text: () => JSON.stringify({ location: "Paris", hashtags: ["romantic", "luxury"] })
                }
              });
            })
          };
        })
      };
    })
  };
});

let mongoServer: MongoMemoryServer;
let userId: string;

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

  const user = await User.create({
    username: "agentuser",
    email: "agent@test.com",
    fullName: "Agent User",
    password: "password123"
  });
  userId = user._id.toString();
});

describe("Agent API", () => {
  test("Smart Search Success with Mocked Gemini", async () => {
    process.env.GEMINI_API_KEY = "fake_key";
    await Post.create({
      title: "Paris Trip",
      content: "Nice city",
      ownerId: userId,
      location: "Paris"
    });

    const response = await request(app)
      .post("/agent/search")
      .send({ query: "I want a romantic trip to Paris" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.posts.length).toBeGreaterThan(0);
    expect(response.body.data.parsedQuery.location).toBe("Paris");
  });

  test("Smart Search Fallback when Gemini Fails", async () => {
    process.env.GEMINI_API_KEY = "fake_key";
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    await Post.create({
      title: "London Bridge",
      content: "Historic",
      ownerId: userId,
      location: "London"
    });

    const response = await request(app)
      .post("/agent/search")
      .send({ query: "fail_me London" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.searchTerms).toContain("London");
    
    consoleSpy.mockRestore();
  });

  test("Smart Search Fallback when No API Key", async () => {
    const originalKey = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;

    await Post.create({
      title: "Berlin",
      content: "Culture",
      ownerId: userId,
      location: "Berlin"
    });

    const response = await request(app)
      .post("/agent/search")
      .send({ query: "Trip to Berlin" });

    expect(response.statusCode).toBe(200);
    expect(response.body.data.searchTerms).toContain("Berlin");
    
    process.env.GEMINI_API_KEY = originalKey;
  });

  test("400 Smart Search - Missing Query", async () => {
    const response = await request(app)
      .post("/agent/search")
      .send({});
    expect(response.statusCode).toBe(400);
  });
});