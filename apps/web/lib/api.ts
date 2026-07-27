const getApiBaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
  if (url && !url.endsWith("/api/v1")) {
    return `${url.replace(/\/$/, "")}/api/v1`;
  }
  return url;
};

const API_BASE_URL = getApiBaseUrl();

let csrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  csrfToken = token;
}

export function getCsrfToken(): string | null {
  return csrfToken;
}

interface RequestOptions extends RequestInit {
  json?: any;
}

async function request(method: string, path: string, options: RequestOptions = {}) {
  const url = `${API_BASE_URL}${path}`;
  const headers = new Headers(options.headers || {});

  // For JSON requests, set content type
  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // Include CSRF token for mutating requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(method.toUpperCase())) {
    if (csrfToken) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const response = await fetch(url, {
    cache: "no-store",
    ...options,
    method,
    headers,
    body: options.json ? JSON.stringify(options.json) : options.body,
    credentials: "include", // Required for session cookie
  });

  if (!response.ok) {
    let errorMsg = "Request failed";
    try {
      const errJson = await response.json();
      errorMsg = errJson.error || errJson.message || errorMsg;
    } catch (_) {
      // ignore
    }
    throw new Error(errorMsg);
  }

  // Handle empty or text responses
  const contentType = response.headers.get("Content-Type");
  if (contentType && contentType.includes("application/json")) {
    return response.json();
  }
  return response.text();
}

export const api = {
  get: (path: string, options?: RequestOptions) => request("GET", path, options),
  post: (path: string, body?: any, options?: RequestOptions) => request("POST", path, { ...options, json: body }),
  put: (path: string, body?: any, options?: RequestOptions) => request("PUT", path, { ...options, json: body }),
  patch: (path: string, body?: any, options?: RequestOptions) => request("PATCH", path, { ...options, json: body }),
  delete: (path: string, options?: RequestOptions) => request("DELETE", path, options),
};
