import { Request, Response } from 'express';
import { asyncHandler } from '../middleware/error.middleware.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import postService from '../services/post.service.js';

interface CreatePostBody {
  title: string;
  content: string;
  ownerId: string;
  imageAttachmentUrl?: string;
}

interface UpdatePostBody {
  content: string;
}

export const createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { title, content, ownerId, imageAttachmentUrl } = req.body as CreatePostBody;

  const post = await postService.createPost(title, content, ownerId, imageAttachmentUrl);

  sendCreated(res, post);
});

export const getAllPosts = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  const posts = (page && limit)
    ? await postService.getAllPosts({ page, limit })
    : await postService.getAllPosts();

  sendSuccess(res, posts);
});

export const getPostByID = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;

  const post = await postService.getPostById(id);

  sendSuccess(res, post);
});

export const getPostsBySender = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const ownerId = req.params.ownerId as string;

  const posts = await postService.getPostsBySender(ownerId);

  sendSuccess(res, posts);
});

export const updatePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;
  const { content } = req.body as UpdatePostBody;

  const updatedPost = await postService.updatePost(id, content);

  sendSuccess(res, updatedPost);
});

export const deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;

  await postService.deletePost(id);

  sendSuccess(res, { message: 'Post deleted successfully' });
});
