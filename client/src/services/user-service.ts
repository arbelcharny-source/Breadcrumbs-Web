import axios from "axios";

const apiClient = axios.create({
    baseURL: "http://localhost:3000",
    headers: {
        "Content-Type": "application/json",
    },
});

interface AuthResponse {
    data: {
        accessToken: string;
        refreshToken: string;
        user: {
            _id: string;
            username: string;
            email: string;
            profileUrl?: string;
        };
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