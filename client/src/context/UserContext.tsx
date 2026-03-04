import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

interface User {
    _id: string;
    username: string;
    fullName: string;
    email: string;
    imgUrl?: string;
}

interface UserContextType {
    user: User | null;
    token: string | null;
    login: (userData: User, accessToken: string, refreshToken: string) => void; 
    logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
        const storedUser = localStorage.getItem("user");
        const storedToken = localStorage.getItem("token");

        if (storedUser && storedToken && storedUser !== "undefined") {
            try {
                setUser(JSON.parse(storedUser));
                setToken(storedToken);
            } catch (error) {
                console.error("Failed to parse user data", error);
                localStorage.removeItem("user");
                localStorage.removeItem("token");
            }
        }
    }, []);

const login = (userData: User, accessToken: string, refreshToken: string) => {
    setUser(userData);
    setToken(accessToken);

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
};

    const logout = () => {
        setUser(null);
        setToken(null);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
    };

    return (
        <UserContext.Provider value={{ user, token, login, logout }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (!context) {
        throw new Error("useUser must be used within a UserProvider");
    }
    return context;
};