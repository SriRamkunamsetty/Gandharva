"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";

interface User {
    id: number;
    email: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (token: string, userData?: User) => void;
    logout: () => void;
    isAuthenticated: boolean;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Load token from local storage on mount
        const storedToken = localStorage.getItem("gandarva_token");
        const storedUser = localStorage.getItem("gandarva_user");

        if (storedToken) {
            setToken(storedToken);
            if (storedUser) {
                setUser(JSON.parse(storedUser));
            }
        }
        setIsLoading(false);
    }, []);

    const login = (newToken: string, userData?: User) => {
        setToken(newToken);
        localStorage.setItem("gandarva_token", newToken);
        if (userData) {
            setUser(userData);
            localStorage.setItem("gandarva_user", JSON.stringify(userData));
        }
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        localStorage.removeItem("gandarva_token");
        localStorage.removeItem("gandarva_user");
        router.push("/login");
    };

    return (
        <AuthContext.Provider value={{
            user,
            token,
            login,
            logout,
            isAuthenticated: !!token,
            isLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
