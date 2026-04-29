import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { sendSuccess, sendCreated } from '../utils/response.js';
import postService from '../services/post.service.js';

interface CreatePostBody {
  title?: string;
  tripName?: string;
  content: string;
  ownerId: string;
  imageAttachmentUrl?: string;
  location?: string;
  hashtags?: string;
}

interface UpdatePostBody {
  title?: string;
  content?: string;
  location?: string;
  hashtags?: string;
}

export const createPost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }

  const { title, tripName, content, location, ownerId, hashtags } = req.body as CreatePostBody;
  const finalTitle = tripName || title || "Untitled Trip";
  const finalOwnerId = ownerId || userId;

  let imageAttachmentUrl = req.body.imageAttachmentUrl;
  if (req.file) {
    imageAttachmentUrl = `/uploads/${req.file.filename}`;
  }

  let hashtagsArray: string[] = [];
  if (hashtags) {
    hashtagsArray = hashtags.split(',').map(tag => tag.trim()).filter(t => t);
  }

  const post = await postService.createPost(finalTitle, content, finalOwnerId, imageAttachmentUrl, location, hashtagsArray);
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
  const userId = req.user?.userId;

  const post = await postService.getPostById(id);
  const postOwnerId = (post.ownerId as any)._id?.toString() || post.ownerId.toString();
  
  if (postOwnerId !== userId) {
    throw new AppError('You do not have permission to modify this post.', 401);
  }

  const { title, content, location, hashtags } = req.body as UpdatePostBody;
  const updates: any = {};
  if (title !== undefined) updates.title = title;
  if (content !== undefined) updates.content = content;
  if (location !== undefined) updates.location = location;
  if (hashtags !== undefined && typeof hashtags === 'string') {
    updates.hashtags = hashtags.split(',').map((tag: string) => tag.trim()).filter((t: string) => t);
  }

  if (req.file) {
    updates.imageAttachmentUrl = `/uploads/${req.file.filename}`;
  }

  const updatedPost = await postService.updatePost(id, updates);
  sendSuccess(res, updatedPost);
});

export const deletePost = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;
  const userId = req.user?.userId;

  const post = await postService.getPostById(id);
  const postOwnerId = (post.ownerId as any)._id?.toString() || post.ownerId.toString();

  if (postOwnerId !== userId) {
    throw new AppError('You do not have permission to modify this post.', 401);
  }

  await postService.deletePost(id);
  sendSuccess(res, { message: 'Post deleted successfully' });
});

export const toggleLike = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const id = req.params._id as string;
  const userId = req.user?.userId;
  if (!userId) {
    throw new AppError('Unauthorized', 401);
  }
  const post = await postService.toggleLike(id, userId);
  sendSuccess(res, post);
});