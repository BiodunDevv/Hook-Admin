const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1";

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("hook_admin_token");
}

export function setToken(token: string) {
  localStorage.setItem("hook_admin_token", token);
}

export function clearToken() {
  localStorage.removeItem("hook_admin_token");
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export async function apiGet<T>(path: string): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
  });
  const data = await res.json();
  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }
  if (!data.success) throw new Error(data.message || "API error");
  return data.data;
}

export async function apiPost<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }
  if (!data.success) throw new Error(data.message || "API error");
  return data.data;
}

export async function apiPatch<T>(
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const token = getToken();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "PATCH",
    headers: {
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (res.status === 401 && typeof window !== "undefined") {
    clearToken();
    window.location.href = "/login";
  }
  if (!data.success) throw new Error(data.message || "API error");
  return data.data;
}
