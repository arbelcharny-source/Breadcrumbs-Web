import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000",
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
    likesCount: number;
    commentsCount: number;
    createdAt: string;
    ownerId: string;
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

export const resolveImageUrl = (path: string | undefined | null, fallbackType: 'profile' | 'post' = 'post'): string => {
    if (!path) {
        return fallbackType === 'profile' 
            ? 'https://placehold.co/400x400?text=User' 
            : 'https://placehold.co/800x600?text=Breadcrumb';
    }
    if (path.startsWith('http')) return path;
    return `http://localhost:3000${path}`;
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
    const token = localStorage.getItem("token");
    const response = await apiClient.put<{ success: boolean; data: UserResponse }>(`/users/${id}`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
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
    const token = localStorage.getItem("token");
    const response = await apiClient.delete<{ success: boolean; data: { message: string } }>(`/posts/${id}`, {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });
    return response.data;
};

export const createPost = async (formData: FormData) => {
    const token = localStorage.getItem("token");
    const headers: any = {
        'Content-Type': 'multipart/form-data',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    console.log("Create Post FormData:");
    formData.forEach((value, key) => {
        console.log(`${key}:`, value);
    });

    const response = await apiClient.post<{ success: boolean; data: PostResponse }>("/posts", formData, {
        headers,
    });
    return response.data;
};

export default apiClient;