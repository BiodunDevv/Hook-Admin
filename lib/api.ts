const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

const ACCESS_TOKEN_KEY = "hook_admin_token";
const REFRESH_TOKEN_KEY = "hook_admin_refresh_token";
const ADMIN_USER_KEY = "hook_admin_user";

function notifyAuthChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event("hook-auth-changed"));
}

export interface AdminUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  role: "support" | "admin" | "super_admin" | string;
  permissions?: string[];
  assignedCategoryIds?: string[];
  avatarUrl?: string;
  isEmailVerified?: boolean;
  isActive?: boolean;
  createdAt?: string;
  phone?: string;
  publicId?: string;
  accountType?: "customer" | "staff" | "runner" | "partner";
  accountStatus?: string;
  roleKeys?: string[];
  scopeType?: "global" | "multi_state" | "single_state" | "hub" | "self";
  assignedStateIds?: string[];
  assignedHubIds?: string[];
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  user: AdminUser;
}

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: {
    requestId: string;
    timestamp: string;
    pagination?: { page: number; limit: number; total: number; totalPages: number };
  };
}

function isBrowser() {
  return typeof window !== "undefined";
}

export function getAccessToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (!isBrowser()) return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function getStoredUser(): AdminUser | null {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(ADMIN_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AdminUser;
  } catch {
    return null;
  }
}

export function setSession(session: AuthSession) {
  localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session.user));
  notifyAuthChanged();
}

export function setToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearSession() {
  if (!isBrowser()) return;
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(ADMIN_USER_KEY);
  notifyAuthChanged();
}

export const clearToken = clearSession;

export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

function redirectToLogin() {
  if (!isBrowser()) return;
  const next = window.location.pathname + window.location.search;
  if (!window.location.pathname.startsWith("/login")) {
    window.location.href = `/login?next=${encodeURIComponent(next)}`;
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json")
    ? ((await res.json()) as ApiEnvelope<T>)
    : null;

  if (!res.ok || !payload?.success) {
    const message = payload?.error?.message || `Request failed with ${res.status}`;
    const error = new Error(`${res.status}: ${message}`) as Error & {
      code?: string;
      requestId?: string;
      details?: unknown;
    };
    error.code = payload?.error?.code;
    error.requestId = payload?.meta?.requestId;
    error.details = payload?.error?.details;
    throw error;
  }

  return payload.data as T;
}

let refreshInFlight: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight;

  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  refreshInFlight = (async () => {
    try {
      const res = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const session = await parseResponse<AuthSession>(res);
      setSession(session);
      return session.accessToken;
    } catch {
      clearSession();
      return null;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  config: { auth?: boolean; retryOnUnauthorized?: boolean } = {},
): Promise<T> {
  const auth = config.auth ?? true;
  const retryOnUnauthorized = config.retryOnUnauthorized ?? true;
  const token = getAccessToken();

  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (auth && token) headers.set("Authorization", `Bearer ${token}`);
  if (isBrowser()) {
    const stateId = localStorage.getItem("hook_admin_state_id");
    const hubId = localStorage.getItem("hook_admin_hub_id");
    if (stateId) headers.set("X-Hook-State-Id", stateId);
    if (hubId) headers.set("X-Hook-Hub-Id", hubId);
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && auth && retryOnUnauthorized) {
    const nextToken = await refreshAccessToken();
    if (nextToken) {
      const retryHeaders = new Headers(headers);
      retryHeaders.set("Authorization", `Bearer ${nextToken}`);
      const retry = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: retryHeaders,
      });
      return parseResponse<T>(retry);
    }
    redirectToLogin();
  }

  return parseResponse<T>(res);
}

export function apiGet<T>(path: string): Promise<T> {
  return apiRequest<T>(path);
}

export function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export function apiDelete<T>(path: string, body?: unknown): Promise<T> {
  return apiRequest<T>(path, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });
}

export async function loginAdmin(email: string, password: string) {
  const session = await apiRequest<AuthSession>(
    "/admin/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ email, password }),
    },
    { auth: false },
  );
  if (session.user.accountType !== "staff" && !["support", "admin", "super_admin"].includes(session.user.role)) {
    throw new Error("403: Staff access required");
  }
  setSession(session);
  return session;
}

export async function loginPlatformAccount(
  email: string,
  password: string,
  accountType: "runner" | "partner",
) {
  const session = await apiRequest<AuthSession>(
    `/${accountType}/auth/login`,
    { method: "POST", body: JSON.stringify({ email, password }) },
    { auth: false },
  );
  if (session.user.accountType !== accountType) {
    throw new Error(`403: ${accountType === "runner" ? "Runner" : "Hook Partner"} access required`);
  }
  setSession(session);
  return session;
}

export async function logoutAdmin() {
  const accessToken = getAccessToken();
  const refreshToken = getRefreshToken();
  if (!accessToken && !refreshToken) {
    throw new Error("401: Authentication token required");
  }
  await apiRequest<{ loggedOut: boolean }>(
    "/admin/auth/logout",
    {
      method: "POST",
      body: JSON.stringify({ refreshToken: refreshToken || undefined }),
    },
    { auth: true, retryOnUnauthorized: false },
  );
  clearSession();
}

export async function requestAdminPasswordReset(email: string) {
  return apiRequest<{ sent: boolean } | { message: string }>(
    "/admin/auth/password/forgot",
    {
      method: "POST",
      body: JSON.stringify({ email }),
    },
    { auth: false },
  );
}

export async function resetAdminPassword(email: string, code: string, password: string) {
  return apiRequest<{ reset: boolean } | { message: string }>(
    "/admin/auth/password/reset",
    {
      method: "POST",
      body: JSON.stringify({ email, code, password }),
    },
    { auth: false },
  );
}

export async function getCurrentAdmin() {
  const user = await apiGet<AdminUser>("/auth/profile");
  if (user.accountType !== "staff" && !["support", "admin", "super_admin"].includes(user.role)) {
    clearSession();
    throw new Error("403: Admin access required");
  }
  localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(user));
  return user;
}

export async function ensureAdminSession() {
  if (!getAccessToken() && !getRefreshToken()) return null;
  try {
    return await getCurrentAdmin();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("401")) {
      const refreshed = await refreshAccessToken();
      if (refreshed) return getCurrentAdmin();
    }
    clearSession();
    throw error;
  }
}
