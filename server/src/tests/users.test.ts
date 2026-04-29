import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import User from "../models/user.js";
import Post from "../models/post.js";

jest.setTimeout(60000);

jest.mock("google-auth-library", () => {
    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return {
                setCredentials: jest.fn(),
                request: jest.fn().mockImplementation(({ url }) => {
                    return Promise.resolve({
                        data: {
                            email: "google@test.com",
                            name: "Google Test User",
                            picture: "http://pic.com",
                            sub: "12345"
                        }
                    });
                })
            };
        })
    };
});

let mongoServer: MongoMemoryServer;
let userId: string;
let accessToken: string;
let refreshToken: string;

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
    await Post.deleteMany({});

    const registerResponse = await request(app).post("/users/register").send({
        username: "poster",
        email: "poster@example.com",
        fullName: "Poster User",
        password: "password123"
    });

    userId = registerResponse.body.data.user._id;
    accessToken = registerResponse.body.data.accessToken;
    refreshToken = registerResponse.body.data.refreshToken;
});

describe("Users API Extended", () => {
    test("Register a new user", async () => {
        const response = await request(app).post("/users/register").send({
            username: "newuser",
            email: "new@example.com",
            fullName: "New User",
            password: "password123"
        });
        expect(response.statusCode).toBe(201);
    });

    test("409 Duplicate Username", async () => {
        const response = await request(app).post("/users/register").send({
            username: "poster",
            email: "other@example.com",
            fullName: "Other",
            password: "password123"
        });
        expect(response.statusCode).toBe(409);
    });

    test("409 Duplicate Email", async () => {
        const response = await request(app).post("/users/register").send({
            username: "other",
            email: "poster@example.com",
            fullName: "Other",
            password: "password123"
        });
        expect(response.statusCode).toBe(409);
    });

    test("400 Validation Error - Invalid Email", async () => {
        const response = await request(app).post("/users/register").send({
            username: "test",
            email: "bad-email",
            fullName: "Test",
            password: "password123"
        });
        expect(response.statusCode).toBe(400);
    });

    test("401 Login - Invalid Password", async () => {
        const response = await request(app).post("/users/login").send({
            username: "poster",
            password: "wrongpassword"
        });
        expect(response.statusCode).toBe(401);
    });

    test("401 Login - User Not Found", async () => {
        const response = await request(app).post("/users/login").send({
            username: "nonexistent",
            password: "password123"
        });
        expect(response.statusCode).toBe(401);
    });

    test("Google Login Success", async () => {
        const response = await request(app).post("/users/google").send({
            credential: "fake_valid_google_token"
        });
        expect(response.statusCode).toBe(200);
    });

    test("Refresh Token Success", async () => {
        const response = await request(app).post("/users/refresh").send({
            refreshToken: refreshToken
        });
        expect(response.statusCode).toBe(200);
    });

    test("401 Refresh Token - Invalid Token", async () => {
        const response = await request(app).post("/users/refresh").send({
            refreshToken: "invalid"
        });
        expect(response.statusCode).toBe(401);
    });

    test("404 Refresh Token - No User", async () => {
        await User.deleteMany({});
        const response = await request(app).post("/users/refresh").send({
            refreshToken: refreshToken
        });
        expect(response.statusCode).toBe(404);
    });

    test("Logout Success", async () => {
        const response = await request(app)
            .post("/users/logout")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ refreshToken });
        expect(response.statusCode).toBe(200);
    });

    test("Logout All Success", async () => {
        const response = await request(app)
            .post("/users/logout-all")
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.statusCode).toBe(200);
    });

    test("Update Profile Success", async () => {
        const response = await request(app)
            .put(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ fullName: "Updated" });
        expect(response.statusCode).toBe(200);
    });

    test("403 Update Other User Profile", async () => {
        const otherId = new mongoose.Types.ObjectId().toString();
        const response = await request(app)
            .put(`/users/${otherId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ fullName: "Illegal" });
        expect(response.statusCode).toBe(403);
    });

    test("Update Bio", async () => {
        const response = await request(app)
            .patch("/users/profile/bio")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({ bio: "New Bio" });
        expect(response.statusCode).toBe(200);
    });

    test("Get Profile with Posts", async () => {
        await Post.create({ title: "T", content: "C", ownerId: userId });
        const response = await request(app).get(`/users/profile/${userId}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.posts).toBeDefined();
    });

    test("404 Get User - Not Found", async () => {
        const fakeId = new mongoose.Types.ObjectId().toString();
        const response = await request(app).get(`/users/${fakeId}`);
        expect(response.statusCode).toBe(404);
    });

    test("Delete Account Success", async () => {
        const response = await request(app)
            .delete(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.statusCode).toBe(200);
    });

    test("400 Register - Missing Fields", async () => {
        const response = await request(app).post("/users/register").send({});
        expect(response.statusCode).toBe(400);
    });
});
