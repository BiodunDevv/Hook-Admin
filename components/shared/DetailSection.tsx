import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DetailSection({
  title,
  description,
  action,
  children,
  className,
  contentClassName,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  contentClassName?: string;
}) {
  return (
    <Card className={cn("gap-0 py-0 shadow-none", className)}>
      <CardHeader className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b px-4 py-3.5">
        <div className="min-w-0">
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          {description ? <CardDescription className="mt-0.5 text-xs">{description}</CardDescription> : null}
        </div>
        {action}
      </CardHeader>
      <CardContent className={cn("p-4", contentClassName)}>{children}</CardContent>
    </Card>
  );
}

