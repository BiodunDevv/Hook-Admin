import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: React.ElementType;
  title: string;
  description?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-12 text-center",
        className
      )}
    >
      <Icon className="mb-3 h-10 w-10 text-zinc-300" />
      <p className="font-medium text-zinc-500">{title}</p>
      {description && (
        <p className="mt-1 text-sm text-zinc-400">{description}</p>
      )}
    </div>
  );
}
