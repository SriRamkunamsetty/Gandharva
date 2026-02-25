import axios from "axios";

// Standardize the API URL for all frontend services
const envUrl = process.env.NEXT_PUBLIC_API_URL;
export const BASE_API_URL = envUrl
    ? `${envUrl.replace(/\/$/, "")}/api/v1`
    : "http://localhost:8000/api/v1";

const api = axios.create({
    baseURL: BASE_API_URL,
});

api.interceptors.request.use(
    (config) => {
        if (typeof window !== "undefined") {
            const token = localStorage.getItem("gandarva_token");
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;
