import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:5173", 
    headers: {
        "Content-Type": "application/json",
    },
});

interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        _id: string;
        username: string;
        email: string;
        imgUrl?: string;
    };
}

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

export default apiClient;