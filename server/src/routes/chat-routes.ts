import express from "express";
import { getChatHistory, getUserChats } from "../controllers/chat-controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { validateObjectId } from "../utils/validation.js";

const router = express.Router();

/**
 * @swagger
 * /chat/history/{partnerId}:
 *   get:
 *     summary: Get chat history with a specific user
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: partnerId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Chat history retrieved
 */
router.get("/history/:partnerId", authenticate, validateObjectId("partnerId"), getChatHistory);

/**
 * @swagger
 * /chat/users:
 *   get:
 *     summary: Get all users the current user has chatted with
 *     tags: [Chat]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat partners
 */
router.get("/users", authenticate, getUserChats);

export default router;
