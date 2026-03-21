import { Request, Response } from 'express';
import { asyncHandler, AppError } from '../middleware/error.middleware.js';
import { sendSuccess } from '../utils/response.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import postService from '../services/post.service.js';

export const smartSearch = asyncHandler(async (req: Request, res: Response): Promise<void> => {
  const { query } = req.body;
  if (!query) throw new AppError('Query is required', 400);

  const apiKey = process.env.GEMINI_API_KEY || '';
  let parsed: any = {};
  let searchTerms: string[] = [];

  if (apiKey.trim() !== '') {
    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const prompt = `You are a travel assistant extracting search parameters from a user query: "${query}". Return ONLY a valid JSON object with the following optional keys: 'location' (string, the general place they want to visit), 'hashtags' (array of strings, e.g. ["nature", "cheap", "luxury", "food"]). Do not use markdown wraps or extra text. EXTREMELY IMPORTANT: Only return raw JSON.`;
      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(text);

      Object.values(parsed).forEach((val: any) => {
        if (typeof val === 'string') {
          searchTerms.push(val);
        } else if (Array.isArray(val)) {
          searchTerms.push(...val.filter(v => typeof v === 'string'));
        }
      });
    } catch (e: any) {
      console.error("Agent parsing error:", e.message);
      searchTerms = query.split(' ').filter((w: string) => w.length > 3);
    }
  } else {
    searchTerms = query.split(' ').filter((w: string) => w.length > 3);
  }

  const posts = await postService.searchPosts(searchTerms);
  console.log(query, searchTerms);
  sendSuccess(res, { parsedQuery: parsed, searchTerms, posts });
});
