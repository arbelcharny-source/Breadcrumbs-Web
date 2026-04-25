import Post, { IPost } from '../models/post.js';
import Comment from '../models/comment.js';
import { AppError } from '../middleware/error.middleware.js';
import userService from './user.service.js';
import fs from 'fs';
import path from 'path';

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

export interface PostWithStats extends Omit<IPost, keyof import('mongoose').Document> {
  _id: any;
  ownerId: any;
  title: string;
  content: string;
  imageAttachmentUrl?: string;
  location: string;
  createdAt: Date;
  likesCount: number;
  commentsCount: number;
}

export class PostService {
  async createPost(
    title: string,
    content: string,
    ownerId: string,
    imageAttachmentUrl?: string,
    location?: string,
    hashtags?: string[]
  ): Promise<IPost> {
    const userExists = await userService.checkUserExists(ownerId);

    if (!userExists) {
      throw new AppError(`User with id ${ownerId} not found`, 404);
    }

    const post = await Post.create({
      title,
      content,
      ownerId,
      imageAttachmentUrl,
      location,
      hashtags: hashtags || []
    });

    return post;
  }

  async getAllPosts(params?: PaginationParams): Promise<PaginatedResult<PostWithStats> | PostWithStats[]> {
    let posts;
    let total = 0;

    if (params) {
      const { page, limit } = params;
      const skip = (page - 1) * limit;

      [posts, total] = await Promise.all([
        Post.find({}).populate('ownerId', 'username profileUrl fullName').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
        Post.countDocuments({})
      ]);
    } else {
      posts = await Post.find({}).populate('ownerId', 'username profileUrl fullName').sort({ createdAt: -1 }).lean();
    }

    const postsWithStats = await Promise.all(posts.map(async (post: any) => {
      const commentsCount = await Comment.countDocuments({ postId: post._id });
      return {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount
      };
    }));

    if (params) {
      return {
        data: postsWithStats as PostWithStats[],
        pagination: {
          page: params.page,
          limit: params.limit,
          total,
          totalPages: Math.ceil(total / params.limit)
        }
      };
    }

    return postsWithStats as PostWithStats[];
  }

  async searchPosts(searchTerms: string[]): Promise<PostWithStats[]> {
    const conditions: any[] = [];

    if (searchTerms && searchTerms.length > 0) {
      const regexes = searchTerms.map(term => new RegExp(term, 'i'));

      conditions.push({ title: { $in: regexes } });
      conditions.push({ content: { $in: regexes } });
      conditions.push({ location: { $in: regexes } });
      conditions.push({ hashtags: { $in: regexes } });
    }

    const query = conditions.length > 0 ? { $or: conditions } : {};
    const posts = await Post.find(query).populate('ownerId', 'username profileUrl fullName').sort({ createdAt: -1 }).lean();

    const postsWithStats = await Promise.all(posts.map(async (post: any) => {
      const commentsCount = await Comment.countDocuments({ postId: post._id });
      return {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount
      };
    }));

    return postsWithStats as PostWithStats[];
  }

  async getPostById(postId: string): Promise<IPost> {
    const post = await Post.findById(postId).populate('ownerId', 'username profileUrl fullName');

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

    const posts = await Post.find({ ownerId }).populate('ownerId', 'username profileUrl fullName').sort({ createdAt: -1 });
    return posts;
  }

  async getPostsBySenderWithStats(ownerId: string, params?: PaginationParams): Promise<PaginatedResult<PostWithStats> | PostWithStats[]> {
    const userExists = await userService.checkUserExists(ownerId);

    if (!userExists) {
      throw new AppError(`User with id ${ownerId} not found`, 404);
    }

    let posts;
    let total = 0;

    if (params) {
      const { page, limit } = params;
      const skip = (page - 1) * limit;

      [posts, total] = await Promise.all([
        Post.find({ ownerId }).populate('ownerId', 'username profileUrl fullName').skip(skip).limit(limit).sort({ createdAt: -1 }).lean(),
        Post.countDocuments({ ownerId })
      ]);
    } else {
      posts = await Post.find({ ownerId }).populate('ownerId', 'username profileUrl fullName').sort({ createdAt: -1 }).lean();
    }

    const postsWithStats = await Promise.all(posts.map(async (post: any) => {
      const commentsCount = await Comment.countDocuments({ postId: post._id });
      return {
        ...post,
        likesCount: post.likes ? post.likes.length : 0,
        commentsCount
      };
    }));

    if (params) {
      const { page, limit } = params;
      return {
        data: postsWithStats as PostWithStats[],
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    }

    return postsWithStats as PostWithStats[];
  }

  async updatePost(postId: string, updates: { content?: string; location?: string; title?: string; imageAttachmentUrl?: string, hashtags?: string[] }): Promise<IPost> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    // If new image is provided, optionally delete the old one
    if (updates.imageAttachmentUrl && post.imageAttachmentUrl && post.imageAttachmentUrl.startsWith('/uploads/')) {
      const oldPath = path.join(process.cwd(), post.imageAttachmentUrl);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    const updatedPost = await Post.findByIdAndUpdate(
      postId,
      { $set: updates },
      { new: true, runValidators: true }
    );

    return updatedPost!;
  }

  async deletePost(postId: string): Promise<void> {
    const post = await Post.findById(postId);

    if (!post) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    // Delete image file if it exists
    if (post.imageAttachmentUrl && post.imageAttachmentUrl.startsWith('/uploads/')) {
      const imagePath = path.join(process.cwd(), post.imageAttachmentUrl);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    await Post.findByIdAndDelete(postId);
  }

  async checkPostExists(postId: string): Promise<boolean> {
    const post = await Post.findById(postId);
    return !!post;
  }

  async toggleLike(postId: string, userId: string): Promise<any> {
    const post = await Post.findById(postId);
    if (!post) {
      throw new AppError(`Post with id ${postId} not found`, 404);
    }

    const likeIndex = post.likes.findIndex(id => id.toString() === userId);
    if (likeIndex === -1) {
      post.likes.push(userId as any);
    } else {
      post.likes.splice(likeIndex, 1);
    }

    await post.save();
    
    // Return populated post with stats
    const populatedPost = await Post.findById(postId).populate('ownerId', 'username profileUrl fullName').lean();
    const commentsCount = await Comment.countDocuments({ postId });
    
    return {
      ...populatedPost,
      likesCount: populatedPost.likes ? populatedPost.likes.length : 0,
      commentsCount
    };
  }
}

export default new PostService();
