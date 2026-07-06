import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  apiGet,
  apiPatch,
  apiPost,
  clearSession,
  ensureAdminSession,
  loginAdmin,
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

export function useAdminSession(enabled = true) {
  return useQuery<AdminUser | null>({
    queryKey: ["auth", "admin-session"],
    queryFn: ensureAdminSession,
    enabled,
    retry: false,
  });
}

export function useAdminLogin() {
  const queryClient = useQueryClient();
  return useMutation<AuthSession, Error, { email: string; password: string }>({
    mutationFn: ({ email, password }) => loginAdmin(email, password),
    meta: {
      successMessage: "Signed in successfully",
    },
    onSuccess: (session) => {
      queryClient.setQueryData(["auth", "admin-session"], session.user);
      queryClient.invalidateQueries();
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return () => {
    clearSession();
    queryClient.clear();
    toast.success("Signed out successfully");
  };
}
