import Comment, { IComment } from '../models/comment.js';
import { AppError } from '../middleware/error.middleware.js';
import userService from './user.service.js';
import postService from './post.service.js';
import { PaginationParams, PaginatedResult } from './post.service.js';

export class CommentService {
  async createComment(content: string, postId: string, ownerId: string): Promise<IComment> {
    const [userExists, postExists] = await Promise.all([
      userService.checkUserExists(ownerId),
      postService.checkPostExists(postId)
    ]);

    if (!userExists) {
      throw new AppError(`User with id ${ownerId} not found`, 404);
    }

    if (!postExists) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    const comment = await Comment.create({
      content,
      postId,
      ownerId
    });

    return comment;
  }

  async getAllComments(params?: PaginationParams): Promise<PaginatedResult<IComment> | IComment[]> {
    if (params) {
      const { page, limit } = params;
      const skip = (page - 1) * limit;

      const [comments, total] = await Promise.all([
        Comment.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Comment.countDocuments({})
      ]);

      return {
        data: comments,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    const comments = await Comment.find({}).sort({ createdAt: -1 });
    return comments;
  }

  async getCommentById(commentId: string): Promise<IComment> {
    const comment = await Comment.findById(commentId);

    if (!comment) {
      throw new AppError(`Comment with id ${commentId} not found`, 404);
    }

    return comment;
  }

  async getCommentsByPost(postId: string): Promise<IComment[]> {
    const postExists = await postService.checkPostExists(postId);

    if (!postExists) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    const comments = await Comment.find({ postId }).sort({ createdAt: -1 });
    return comments;
  }

  async updateComment(commentId: string, content: string): Promise<IComment> {
    const updatedComment = await Comment.findByIdAndUpdate(
      commentId,
      { content },
      { new: true, runValidators: true }
    );

    if (!updatedComment) {
      throw new AppError(`Comment with id ${commentId} not found`, 404);
    }

    return updatedComment;
  }

  async deleteComment(commentId: string): Promise<void> {
    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
      throw new AppError(`Comment with id ${commentId} not found`, 404);
    }
  }
}

export default new CommentService();
