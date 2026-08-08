import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  apiGet,
  apiDelete,
  apiPatch,
  apiPost,
  clearSession,
  ensureAccountSession,
  loginAccount,
  logoutAccount,
  requestPasswordReset,
  resetPassword,
  type AdminUser,
  type AuthSession,
} from "@/lib/api";

type ToastOptions = {
  successMessage?: string;
  silent?: boolean;
};

export function useApiQuery<T>(queryKey: readonly unknown[], path: string, enabled = true) {
  return useQuery({
    queryKey,
    queryFn: () => apiGet<T>(path),
    enabled,
  });
}

export function useApiPost<TData, TVariables = unknown>(
  path: string,
  invalidate?: readonly unknown[],
  toastOptions: ToastOptions = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => apiPost<TData>(path, variables),
    meta: {
      successMessage: toastOptions.successMessage || "Saved successfully",
      silent: toastOptions.silent,
    },
    onSuccess: () => {
      if (invalidate) queryClient.invalidateQueries({ queryKey: invalidate });
    },
  });
}

export function useApiPatch<TData, TVariables = unknown>(
  path: string,
  invalidate?: readonly unknown[],
  toastOptions: ToastOptions = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => apiPatch<TData>(path, variables),
    meta: {
      successMessage: toastOptions.successMessage || "Changes saved",
      silent: toastOptions.silent,
    },
    onSuccess: () => {
      if (invalidate) queryClient.invalidateQueries({ queryKey: invalidate });
    },
  });
}

export function useApiDelete<TData = unknown, TVariables = undefined>(
  path: string,
  invalidate?: readonly unknown[],
  toastOptions: ToastOptions = {},
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (variables: TVariables) => apiDelete<TData>(path, variables),
    meta: {
      successMessage: toastOptions.successMessage || "Record archived",
      silent: toastOptions.silent,
    },
    onSuccess: () => {
      if (invalidate) queryClient.invalidateQueries({ queryKey: invalidate });
    },
  });
}

export function useAccountSession(enabled = true) {
  return useQuery<AdminUser | null>({
    queryKey: ["auth", "session"],
    queryFn: ensureAccountSession,
    enabled,
    retry: false,
  });
}

export function useAdminSession(enabled = true) {
  return useAccountSession(enabled);
}

export function useAccountLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthSession, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginAccount(email, password),
    meta: {
      successMessage: "Signed in successfully",
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["auth", "session"], session.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logoutAccount,
    meta: {
      successMessage: "Signed out successfully",
    },
    onSettled: () => {
      clearSession();
      queryClient.clear();
    },
  });
}

export function useForgotPassword() {
  return useMutation<{ sent: boolean } | { message: string }, Error, { email: string }>({
    mutationFn: ({ email }) => requestPasswordReset(email),
    meta: {
      successMessage: "If that account exists, an OTP has been sent",
    },
  });
}

export function useResetPassword() {
  return useMutation<{ reset: boolean } | { message: string }, Error, { email: string; code: string; password: string }>({
    mutationFn: ({ email, code, password }) => resetPassword(email, code, password),
    meta: {
      successMessage: "Password reset successfully",
    },
  });
}
