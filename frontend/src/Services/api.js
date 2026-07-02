import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

// Step 2: Request Interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// Step 3: Response Interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== "/api/auth/login" &&
      originalRequest.url !== "/api/auth/register" &&
      originalRequest.url !== "/api/auth/refresh"
    ) {
      originalRequest._retry = true;

      try {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/api/auth/refresh` ,
          {},
          {
            withCredentials: true,
          },
        );

        const newToken = response.data.accessToken;

        localStorage.setItem("token", newToken);

        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem("token");
        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  },
);

export const login = ({ email, password }) =>
  api.post("/api/auth/login", { email, password });

export const register = ({ name, email, password }) =>
  api.post("/api/auth/register", { name, email, password });

export default api;
