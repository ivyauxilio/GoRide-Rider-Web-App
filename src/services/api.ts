import axios from "axios";

const origin = import.meta.env.VITE_API_ORIGIN || "http://localhost:8000";

const prefix = import.meta.env.VITE_API_PREFIX || "/api/v1/rider";

export const api = axios.create({
  baseURL: `${origin}${prefix}`,

  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },

  withCredentials: true,
  withXSRFToken: true,
});

api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("rider_token");

  if (token) {
    config.headers.set("Authorization", `Bearer ${token}`);
  }

  return config;
});

// Separate Axios instance for Laravel Sanctum CSRF
export const csrfApi = axios.create({
  baseURL: origin,
  withCredentials: true,
  withXSRFToken: true,

  headers: {
    Accept: "application/json",
  },
});

// Initialize Laravel Sanctum CSRF cookie
export async function initializeCsrf(): Promise<void> {
  await csrfApi.get("/sanctum/csrf-cookie");
}

/**
 * Extract readable errors from Laravel responses.
 */
export function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data;

    if (error.response?.status === 422 && data?.errors) {
      const firstError = Object.values(data.errors)[0];

      if (Array.isArray(firstError) && firstError.length > 0) {
        return String(firstError[0]);
      }
    }

    if (typeof data?.message === "string") {
      return data.message;
    }

    if (!error.response) {
      return "Unable to connect to the server.";
    }

    switch (error.response.status) {
      case 401:
        return "Invalid credentials or session expired.";
      case 403:
        return "You do not have permission to perform this action.";
      case 419:
        return "CSRF token mismatch. Please refresh and try again.";
      case 422:
        return "Please check your submitted information.";
      case 500:
        return "An internal server error occurred.";
      default:
        return "Something went wrong. Please try again.";
    }
  }

  return error instanceof Error
    ? error.message
    : "An unexpected error occurred.";
}

export default api;
