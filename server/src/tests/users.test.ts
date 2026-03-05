import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../app.js";
import User from "../models/user.js";
import Post from "../models/post.js";

jest.mock("../controllers/user-controller.js", () => {
    const actual = jest.requireActual("../controllers/user-controller.js");
    return {
        ...actual,
        googleLogin: async (req: any, res: any) => {
            if (req.body.credential === "fake_valid_google_token") {
                return res.status(200).send({
                    success: true,
                    data: {
                        user: {
                            _id: "mock_google_id",
                            email: "google@test.com",
                            username: "google_user",
                            fullName: "Google Test User"
                        },
                        accessToken: "mock_access_token",
                        refreshToken: "mock_refresh_token"
                    }
                });
            }
            return res.status(400).send({ success: false, error: "Invalid Google Token" });
        }
    };
});

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
    await Post.deleteMany({});
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

    test("Google Login with valid token", async () => {
        const response = await request(app).post("/users/google").send({
            credential: "fake_valid_google_token"
        });

        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.accessToken).toBeDefined();
        expect(response.body.data.refreshToken).toBeDefined();
    });

    test("Google Login with invalid token", async () => {
        const response = await request(app).post("/users/google").send({
            credential: "invalid_token_string"
        });

        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
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
        const accessToken = registerResponse.body.data.accessToken;

        const response = await request(app)
            .put(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                fullName: "Updated Name",
                email: "updated@example.com"
            });
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);
        expect(response.body.data.fullName).toBe("Updated Name");
        expect(response.body.data.email).toBe("updated@example.com");
    });

    test("Update user - 403 Forbidden (Updating another user)", async () => {
        const registerResponse1 = await request(app).post("/users/register").send({
            username: "victim",
            email: "victim@test.com",
            fullName: "Victim",
            password: "password123"
        });
        const victimId = registerResponse1.body.data.user._id;

        const registerResponse2 = await request(app).post("/users/register").send({
            username: "attacker",
            email: "attacker@test.com",
            fullName: "Attacker",
            password: "password123"
        });
        const attackerToken = registerResponse2.body.data.accessToken;

        const response = await request(app)
            .put(`/users/${victimId}`)
            .set("Authorization", `Bearer ${attackerToken}`)
            .send({ fullName: "Hacked" });
        
        expect(response.statusCode).toBe(403);
    });

    test("Update user - Not Found", async () => {
        // Since my controller checks req.user.userId === req.params.id FIRST,
        // we can't get a 404 easily unless we delete the user after they authenticate.
        const registerResponse = await request(app).post("/users/register").send({
            username: "updateuser404",
            email: "updateuser404@example.com",
            fullName: "Update User",
            password: "password123"
        });
        const userId = registerResponse.body.data.user._id;
        const accessToken = registerResponse.body.data.accessToken;

        // Delete the user from DB manually
        await User.findByIdAndDelete(userId);

        const response = await request(app)
            .put(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
                fullName: "New Name"
            });
        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("Update user - Invalid format", async () => {
        // To trigger 400 validation on ObjectId while still passing the ownership check, 
        // we'd need parameters that mismatch or are invalid before the check.
        // However, validateObjectId runs BEFORE the controller. 
        // So a request to /users/invalid_id will fail validation immediately.
        // But since it's a protected route, it needs a token.
        const registerResponse = await request(app).post("/users/register").send({
            username: "updateuserinvalid",
            email: "updateuserinvalid@example.com",
            fullName: "Update User",
            password: "password123"
        });
        const accessToken = registerResponse.body.data.accessToken;

        const response = await request(app)
            .put("/users/invalid_id")
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
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
        const accessToken = registerResponse.body.data.accessToken;

        const response = await request(app)
            .put(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`)
            .send({
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
        const accessToken = registerResponse.body.data.accessToken;

        const response = await request(app)
            .delete(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        const checkResponse = await request(app).get(`/users/${userId}`);
        expect(checkResponse.statusCode).toBe(404);
    });

    test("Delete user - Not Found", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "deleteuser404",
            email: "deleteuser404@example.com",
            fullName: "Delete User",
            password: "password123"
        });
        const userId = registerResponse.body.data.user._id;
        const accessToken = registerResponse.body.data.accessToken;

        await User.findByIdAndDelete(userId);

        const response = await request(app)
            .delete(`/users/${userId}`)
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.statusCode).toBe(404);
        expect(response.body.success).toBe(false);
    });

    test("Delete user - Invalid format", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "deleteuserinvalid",
            email: "deleteuserinvalid@example.com",
            fullName: "Delete User",
            password: "password123"
        });
        const accessToken = registerResponse.body.data.accessToken;

        const response = await request(app)
            .delete("/users/invalid_id")
            .set("Authorization", `Bearer ${accessToken}`);
        expect(response.statusCode).toBe(400);
        expect(response.body.success).toBe(false);
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

    test("Logout from all devices (Logout All)", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "logoutalluser",
            email: "logoutall@example.com",
            fullName: "Logout All",
            password: "password123"
        });

        const accessToken = registerResponse.body.data.accessToken;
        const refreshToken = registerResponse.body.data.refreshToken;

        const response = await request(app)
            .post("/users/logout-all")
            .set("Authorization", `Bearer ${accessToken}`);
        
        expect(response.statusCode).toBe(200);
        expect(response.body.success).toBe(true);

        // Verify refresh token is now invalid
        const refreshRes = await request(app).post("/users/refresh").send({
            refreshToken
        });
        expect(refreshRes.statusCode).toBe(401);
    });

    test("Get Profile - Success with Pagination", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "profileuser",
            email: "profile@test.com",
            fullName: "Profile User",
            password: "password123"
        });
        const userId = registerResponse.body.data.user._id;

        // Create 15 posts
        for (let i = 0; i < 15; i++) {
            await Post.create({
                title: "Trip",
                content: `Crumb ${i}`,
                ownerId: new mongoose.Types.ObjectId(userId),
                location: "Test Location"
            });
        }

        const response = await request(app).get(`/users/profile/${userId}?page=1&limit=10`);
        expect(response.statusCode).toBe(200);
        expect(response.body.data.user.username).toBe("profileuser");
        expect(response.body.data.posts.length).toBe(10);
        expect(response.body.data.pagination.total).toBe(15);
    });

    test("Update Bio - Success", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "biouser",
            email: "bio@test.com",
            fullName: "Bio User",
            password: "password123"
        });
        const token = registerResponse.body.data.accessToken;

        const newBio = "New travel bio";
        const response = await request(app)
            .patch("/users/profile/bio")
            .set("Authorization", `Bearer ${token}`)
            .send({ bio: newBio });
        
        expect(response.statusCode).toBe(200);
        expect(response.body.data.bio).toBe(newBio);
    });

    test("Update Bio - 400/500 Validation Error (Exceeds Max Length)", async () => {
        const registerResponse = await request(app).post("/users/register").send({
            username: "longbiouser",
            email: "longbio@test.com",
            fullName: "Long Bio",
            password: "password123"
        });
        const token = registerResponse.body.data.accessToken;

        const longBio = "a".repeat(201);
        const response = await request(app)
            .patch("/users/profile/bio")
            .set("Authorization", `Bearer ${token}`)
            .send({ bio: longBio });
        
        expect([400, 500]).toContain(response.statusCode);
    });
});