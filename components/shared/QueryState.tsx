import { AlertTriangle, Inbox, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HookLoader } from "@/components/shared/HookLoader";
import { EmptyState } from "@/components/shared/EmptyState";
import { cn } from "@/lib/utils";

interface QueryStateProps {
  loading?: boolean;
  error?: unknown;
  empty?: boolean;
  loadingLabel?: string;
  errorTitle?: string;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyIcon?: React.ElementType;
  onRetry?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function QueryState({
  loading,
  error,
  empty,
  loadingLabel = "Loading...",
  errorTitle = "This information could not be loaded",
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyIcon = Inbox,
  onRetry,
  className,
  children,
}: QueryStateProps) {
  if (loading) {
    return (
      <div className={cn("grid min-h-64 place-items-center", className)}>
        <HookLoader label={loadingLabel} />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof Error
        ? error.message.replace(/^\d+:\s*/, "")
        : undefined;
    return (
      <div
        className={cn(
          "flex min-h-64 flex-col items-center justify-center px-6 text-center",
          className,
        )}
      >
        <span className="grid size-10 place-items-center rounded-full bg-danger-soft text-danger">
          <AlertTriangle className="size-5" />
        </span>
        <p className="mt-3 text-sm font-semibold text-foreground">
          {errorTitle}
        </p>
        {message ? (
          <p className="mt-1 max-w-lg text-sm text-muted-foreground">
            {message}
          </p>
        ) : null}
        {onRetry ? (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-4"
            onClick={onRetry}
          >
            <RefreshCcw /> Retry
          </Button>
        ) : null}
      </div>
    );
  }

  if (empty) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        className={cn("min-h-64", className)}
      />
    );
  }

  return <>{children}</>;
}
