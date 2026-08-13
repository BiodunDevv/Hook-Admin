const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL;

type Envelope<T> = { success: boolean; data?: T; error?: { code?: string; message?: string } };

export async function publicPaymentRequest<T>(path: string, options: RequestInit = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    cache: "no-store",
  });
  const payload = await response.json().catch(() => null) as Envelope<T> | null;
  if (!response.ok || !payload?.success) {
    const error = new Error(payload?.error?.message || "Payment request could not be completed") as Error & { code?: string };
    error.code = payload?.error?.code;
    throw error;
  }
  return payload.data as T;
}
