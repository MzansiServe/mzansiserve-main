/**
 * API Utility for MzansiServe Frontend
 * Wrapper around standard fetch to add base URLs and authorization headers.
 */

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5006";

interface FetchOptions extends RequestInit {
    data?: any;
}

/**
 * Core fetch wrapper that automatically adds the Auth token if present
 */
export async function apiFetch<T = any>(
    endpoint: string,
    options: FetchOptions = {}
): Promise<T> {
    const { data, headers: customHeaders, ...customOptions } = options;

    const isCoreApi = endpoint.startsWith("/api/admin");
    const token = isCoreApi
        ? (localStorage.getItem("adminToken") || localStorage.getItem("token"))
        : (localStorage.getItem("token") || localStorage.getItem("adminToken"));

    const headers: any = {
        ...customHeaders,
    };

    if (token && !headers["Authorization"] && !headers["authorization"]) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    // Use either data or body (body is standard fetch, data is our custom wrapper)
    const requestBody = data || options.body;
    const isFormData = requestBody instanceof FormData;

    if (requestBody && !isFormData && !headers["Content-Type"] && !headers["content-type"]) {
        headers["Content-Type"] = "application/json";
    }

    const config: RequestInit = {
        ...customOptions,
        method: options.method || (requestBody ? "POST" : "GET"),
        body: requestBody ? (isFormData ? requestBody : (typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody))) : undefined,
        headers,
    };

    // Ensure endpoint starts with a slash
    const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

    const response = await fetch(url, config);

    // Parse JSON response
    let result;
    try {
        result = await response.json();
    } catch (err) {
        result = null;
    }

    // Handle errors
    if (!response.ok) {
        // If unauthorized, clear token
        if (response.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("user");
            // Optional: force reload or redirect to login
            // window.location.href = '/login';
        }

        const errorMessage = result?.message || result?.error || response.statusText;
        throw new Error(errorMessage || "An error occurred");
    }

    return result;
}

export default apiFetch;
