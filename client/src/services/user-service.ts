import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const apiClient = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

export interface UserResponse {
    _id: string;
    username: string;
    email: string;
    fullName: string;
    profileUrl?: string;
    bio?: string;
}

interface AuthResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: UserResponse;
    };
}

export interface PostResponse {
    _id: string;
    title: string;
    content: string;
    imageAttachmentUrl?: string;
    location: string;
    hashtags?: string[];
    likes?: string[];
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    ownerId: {
        _id: string;
        username: string;
        fullName?: string;
        profileUrl?: string;
    };
}

interface ProfileResponse {
    success: boolean;
    data: {
        user: UserResponse;
        posts: PostResponse[];
        pagination?: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    };
}

export const resolveImageUrl = (url?: string | null, type: 'profile' | 'post' = 'post') => {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // 1. Fallback for empty/null/undefined
  if (!url || typeof url !== 'string' || url.trim() === '') {
    return type === 'profile' 
      ? 'https://placehold.co/400x400/FAF9F6/2D2621?text=User' 
      : 'https://placehold.co/800x600/FAF9F6/2D2621?text=Breadcrumb';
  }

  let finalUrl = url;

  // 2. Handle Google/External URLs (starting with http)
  if (url.startsWith('http')) {
    finalUrl = url;
  } 
  // 3. Handle local paths
  else {
    // Ensure there is exactly one slash between baseUrl and the path
    const cleanPath = url.startsWith('/') ? url : `/${url}`;
    finalUrl = `${baseUrl}${cleanPath}`;
  }

  // Temporary debug log - we will remove this before production
  // console.log(`[Image Debug] Input: ${url} | Output: ${finalUrl}`);
  
  return finalUrl;
};

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export const register = async (userData: any) => {
    const response = await apiClient.post<AuthResponse>("/users/register", userData);
    return response.data;
};

export const login = async (credentials: any) => {
    const response = await apiClient.post<AuthResponse>("/users/login", credentials);
    return response.data;
};

export const googleSignin = async (credential: string) => {
    try {
        const response = await apiClient.post<AuthResponse>("/users/google", {
            credential: credential,
        });
        return response.data;
    } catch (error) {
        console.error("Error logging in with Google:", error);
        throw error;
    }
};

export const refresh = async (refreshToken: string) => {
    const response = await apiClient.post<AuthResponse>("/users/refresh", { refreshToken });
    return response.data;
};

export const logout = async (refreshToken: string) => {
    const response = await apiClient.post("/users/logout", { refreshToken });
    return response.data;
};

export const getUserProfile = async (id: string, page?: number, limit?: number) => {
    const response = await apiClient.get<ProfileResponse>(`/users/profile/${id}`, {
        params: { page, limit }
    });
    return response.data;
};

export const updateUserBio = async (bio: string) => {
    const response = await apiClient.patch<{ success: boolean; data: UserResponse }>("/users/profile/bio", { bio });
    return response.data;
};

export const updateUser = async (id: string, formData: FormData) => {
    const response = await apiClient.put<{ success: boolean; data: UserResponse }>(`/users/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    });
    return response.data;
};

export const updatePost = async (id: string, formData: FormData) => {
    const token = localStorage.getItem("token");
    const response = await apiClient.put<{ success: boolean; data: PostResponse }>(`/posts/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
        },
    });
    return response.data;
};

export const deletePost = async (id: string) => {
    const response = await apiClient.delete<{ success: boolean; data: { message: string } }>(`/posts/${id}`);
    return response.data;
};

export const createPost = async (formData: FormData) => {
    const response = await apiClient.post<{ success: boolean; data: PostResponse }>("/posts", formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        },
    });
    return response.data;
};

export const toggleLike = async (id: string) => {
    const token = localStorage.getItem("token");
    const response = await apiClient.post<{ success: boolean; data: PostResponse }>(`/posts/like/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const addComment = async (postId: string, content: string) => {
    const token = localStorage.getItem("token");
    const response = await apiClient.post<{ success: boolean; data: any }>(`/comments`, { postId, content }, {
        headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
};

export const smartSearch = async (query: string) => {
    const response = await apiClient.post<{ success: boolean; data: { parsedQuery: any; posts: PostResponse[] } }>("/agent/search", { query });
    return response.data;
};

export default apiClient;