import express from "express";
import {
  createComment,
  getAllComments,
  getCommentByID,
  getCommentsByPost,
  updateComment,
  deleteComment
} from "../controllers/comment-controller.js";
import { validateCommentCreation, validateCommentUpdate } from "../middleware/validation.middleware.js";
import { validateObjectId } from "../utils/validation.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

/**
 * @swagger
 * /comments:
 *   post:
 *     summary: Create a new comment
 *     description: Creates a new comment on a specific post
 *     tags:
 *       - Comments
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentCreationRequest'
 *     responses:
 *       201:
 *         description: Comment created successfully
 */
router.post("/", authenticate, validateCommentCreation, createComment);

/**
 * @swagger
 * /comments:
 *   get:
 *     summary: Get all comments
 */
router.get("/", getAllComments);

/**
 * @swagger
 * /comments/{_id}:
 *   get:
 *     summary: Get comment by ID
 */
router.get("/:_id", validateObjectId("_id"), getCommentByID);

/**
 * @swagger
 * /comments/post/{postId}:
 *   get:
 *     summary: Get comments by post
 */
router.get("/post/:postId", validateObjectId("postId"), getCommentsByPost);

/**
 * @swagger
 * /comments/{_id}:
 *   put:
 *     summary: Update comment
 */
router.put("/:_id", authenticate, validateObjectId("_id"), validateCommentUpdate, updateComment);

/**
 * @swagger
 * /comments/{_id}:
 *   delete:
 *     summary: Delete comment
 */
router.delete("/:_id", authenticate, validateObjectId("_id"), deleteComment);

export default router;
