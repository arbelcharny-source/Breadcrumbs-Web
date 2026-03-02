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
}

interface AuthResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: UserResponse;
    };
}

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

export default apiClient;