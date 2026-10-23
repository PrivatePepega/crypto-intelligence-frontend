import axios from "axios";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api-v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});


// These requests can legitimately return 401 without meaning the user's
// existing session is invalid (e.g. the initial auth check when signed out).
const SILENT_UNAUTHORIZED_ENDPOINTS = ["/authMe", "/auth/login"];

// Add a global handler for 401 errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const requestUrl =
      typeof error.config?.url === "string" ? error.config.url : "";
    const isExpectedAuthFailure = SILENT_UNAUTHORIZED_ENDPOINTS.some((path) =>
      requestUrl.includes(path)
    );

    if (error.response && error.response.status === 401 && !isExpectedAuthFailure) {
      // Dispatch a custom event to trigger logout in AuthProvider
      window.dispatchEvent(new Event("force-logout"));
    }
    return Promise.reject(error);
  }
);

const postData = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await api.post(url, data);

  return response.data;
};

const updateData = async <T>(url: string, data: unknown): Promise<T> => {
  const response = await api.put(url, data);

  return response.data;
};

const fetchData = async <T>(url: string): Promise<T> => {
  const response = await api.get(url);

  return response.data;
};

const deleteData = async <T>(url: string): Promise<T> => {
  const response = await api.delete(url);

  return response.data;
};

export { postData, fetchData, updateData, deleteData };