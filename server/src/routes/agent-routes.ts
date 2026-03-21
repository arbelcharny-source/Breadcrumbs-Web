import express from "express";
import { smartSearch } from "../controllers/agent-controller.js";

const router = express.Router();

/**
 * @swagger
 * /agent/search:
 *   post:
 *     summary: Smart search for trips using natural language
 *     tags: [Agent]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               query:
 *                 type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.post("/search", smartSearch);

export default router;
