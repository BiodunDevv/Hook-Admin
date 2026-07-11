"use client";

import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { toast } from "sonner";

function getToastMessage(error: unknown) {
  if (error instanceof Error) {
    const message = error.message.replace(/^\d+:\s*/, "");
    if (/failed to fetch|load failed|networkerror/i.test(message)) {
      return "Could not reach the Hook API. Please check that the backend is running and try again.";
    }
    return message;
  }
  return "Something went wrong. Please try again.";
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({
          onError: (error, query) => {
            if (query.meta?.silent) return;
            toast.error(getToastMessage(error));
          },
        }),
        mutationCache: new MutationCache({
          onError: (error, _variables, _context, mutation) => {
            if (mutation.meta?.silent) return;
            toast.error(getToastMessage(error));
          },
          onSuccess: (_data, _variables, _context, mutation) => {
            if (mutation.meta?.silent || mutation.meta?.skipSuccessToast) return;
            const message =
              typeof mutation.meta?.successMessage === "string"
                ? mutation.meta.successMessage
                : "Done successfully";
            toast.success(message);
          },
        }),
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof Error && /401|403/.test(error.message)) return false;
              return failureCount < 1;
            },
          },
          mutations: {
            retry: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {children}
        <Toaster position="bottom-right" closeButton />
      </TooltipProvider>
    </QueryClientProvider>
  );
}
