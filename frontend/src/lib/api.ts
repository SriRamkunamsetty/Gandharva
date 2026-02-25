import axios from "axios";

// Standardize the API URL for all frontend services
const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
// Strip trailing slash if present
const cleanBaseURL = rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : rawBaseURL;

// Exported for use in fetch() calls in Auth pages
export const BASE_API_URL = `${cleanBaseURL}/api/v1`;

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
