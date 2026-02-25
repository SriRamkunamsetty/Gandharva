import axios from "axios";

const rawBaseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const baseURL = rawBaseURL.endsWith("/") ? rawBaseURL.slice(0, -1) : rawBaseURL;

const api = axios.create({
    baseURL: `${baseURL}/api/v1`,
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
