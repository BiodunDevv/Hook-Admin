const API_BASE = "/api/v1";
const REQUEST_TIMEOUT_MS = 12_000;

type Envelope<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } };

export async function publicPaymentRequest<T>(path: string, options: RequestInit = {}) {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(options.headers || {}) },
      cache: "no-store",
      signal: options.signal || AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch (cause) {
    const timedOut = cause instanceof DOMException && cause.name === "TimeoutError";
    throw new Error(timedOut ? "Hook is taking too long to respond. Check the server and try again." : "Hook could not connect to the payment server. Check your connection and try again.");
  }
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || "Payment request could not be completed") as Error & { code?: string };
    error.code = payload?.error?.code;
    throw error;
  }
  return payload.data as T;
}
