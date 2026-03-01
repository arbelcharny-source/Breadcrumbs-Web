import express from "express";
import { createUser, login, googleLogin, refreshToken, logout, logoutAll, getUserById, getAllUsers, updateUser, deleteUser } from "../controllers/user-controller.js";
import { validateUserRegistration, validateLogin, validateRefreshToken, validateUserUpdate } from "../middleware/validation.middleware.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   - name: Users
 *     description: User management and authentication
 */

/**
 * @swagger
 * /users/register:
 *   post:
 *     summary: Register a new user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserRegistrationRequest'
 *     responses:
 *       201:
 *         description: User successfully registered
 *       400:
 *         description: Invalid input data
 *       409:
 *         description: Username or email already exists
 */
router.post("/register", validateUserRegistration, createUser);

/**
 * @swagger
 * /users/login:
 *   post:
 *     summary: Login user
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post("/login", validateLogin, login);

/**
 * @swagger
 * /users/google:
 *   post:
 *     summary: Google Login
 *     description: Authenticates a user via Google OAuth2
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - credential
 *             properties:
 *               credential:
 *                 type: string
 *                 description: The Google JWT credential (ID Token)
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/TokenPair'
 *       400:
 *         description: Invalid Google Token
 */
router.post("/google", googleLogin);

/**
 * @swagger
 * /users/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post("/refresh", validateRefreshToken, refreshToken);

/**
 * @swagger
 * /users/logout:
 *   post:
 *     summary: Logout user
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: Logout successful
 *       401:
 *         description: Unauthorized
 */
router.post("/logout", authenticate, validateRefreshToken, logout);

/**
 * @swagger
 * /users/logout-all:
 *   post:
 *     summary: Logout from all devices
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logged out from all devices successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/logout-all", authenticate, logoutAll);

/**
 * @swagger
 * /users:
 *   get:
 *     summary: Get all users
 *     tags:
 *       - Users
 *     responses:
 *       200:
 *         description: List of users retrieved successfully
 */
router.get("/", getAllUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *       404:
 *         description: User not found
 */
router.get("/:id", validateObjectId("id"), getUserById);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateRequest'
 *     responses:
 *       200:
 *         description: User updated successfully
 *       404:
 *         description: User not found
 */
router.put("/:id", validateObjectId("id"), validateUserUpdate, updateUser);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete user
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted successfully
 *       404:
 *         description: User not found
 */
router.delete("/:id", validateObjectId("id"), deleteUser);

export default router;
