import Post, { IPost } from '../models/post.js';
import { AppError } from '../middleware/error.middleware.js';
import userService from './user.service.js';

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export class PostService {
  async createPost(
    title: string,
    content: string,
    ownerId: string,
    imageAttachmentUrl?: string
  ): Promise<IPost> {
    const userExists = await userService.checkUserExists(ownerId);

    if (!userExists) {
      throw new AppError(`User with id ${ownerId} not found`, 404);
    }

    const post = await Post.create({
      title,
      content,
      ownerId,
      imageAttachmentUrl
    });

    return post;
  }

  async getAllPosts(params?: PaginationParams): Promise<PaginatedResult<IPost> | IPost[]> {
    if (params) {
      const { page, limit } = params;
      const skip = (page - 1) * limit;

      const [posts, total] = await Promise.all([
        Post.find({}).skip(skip).limit(limit).sort({ createdAt: -1 }),
        Post.countDocuments({})
      ]);

      return {
        data: posts,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    const posts = await Post.find({}).sort({ createdAt: -1 });
    return posts;
  }

  async getPostById(postId: string): Promise<IPost> {
    const post = await Post.findById(postId);

    if (!post) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    return post;
  }

  async getPostsBySender(ownerId: string): Promise<IPost[]> {
    const userExists = await userService.checkUserExists(ownerId);

    if (!userExists) {
      throw new AppError(`User with id ${ownerId} not found`, 404);
    }

    const posts = await Post.find({ ownerId }).sort({ createdAt: -1 });
    return posts;
  }

  async updatePost(postId: string, content: string): Promise<IPost> {
    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { content },
      { new: true, runValidators: true }
    );

    if (!updatedPost) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    return updatedPost;
  }

  async deletePost(postId: string): Promise<void> {
    const post = await Post.findByIdAndDelete(postId);

    if (!post) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }
  }

  async checkPostExists(postId: string): Promise<boolean> {
    const post = await Post.findById(postId);
    return !!post;
  }
}

export default new PostService();
