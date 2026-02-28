import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import commentService from '../services/comment.service.js';

interface CreateCommentBody {
  content: string;
  postId: string;
  ownerId: string;
}

interface UpdateCommentBody {
  content: string;
}

export const createComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { content, postId, ownerId } = req.body as CreateCommentBody;

  const comment = await commentService.createComment(content, postId, ownerId);

  sendCreated(res, comment);
});

export const getAllComments = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  const comments = (page && limit)
    ? await commentService.getAllComments({ page, limit })
    : await commentService.getAllComments();

  sendSuccess(res, comments);
});

export const getCommentByID = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;

  const comment = await commentService.getCommentById(id);

  sendSuccess(res, comment);
});

export const getCommentsByPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const postId = req.params.postId as string;

  const comments = await commentService.getCommentsByPost(postId);

  sendSuccess(res, comments);
});

export const updateComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;
  const { content } = req.body as UpdateCommentBody;

  const updatedComment = await commentService.updateComment(id, content);

  sendSuccess(res, updatedComment);
});

export const deleteComment = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;

  await commentService.deleteComment(id);

  sendSuccess(res, { message: 'Comment deleted successfully' });
});
