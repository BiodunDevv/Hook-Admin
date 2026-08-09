"use client";

import type { ReactNode } from "react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export function AdminWorkflowSheet({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className={cn("min-h-0 w-full gap-0 overflow-hidden border-l bg-background p-0 shadow-2xl sm:w-[min(45vw,52rem)] sm:max-w-none", className)}>
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-4 py-4 shadow-sm backdrop-blur sm:px-6">
          <div className="min-w-0 pr-10">
            <SheetTitle className="text-lg font-semibold tracking-normal">{title}</SheetTitle>
            {description ? <SheetDescription className="mt-1 line-clamp-2 max-w-2xl text-xs leading-4 sm:text-sm">{description}</SheetDescription> : null}
          </div>
        </SheetHeader>
        <ScrollArea className="h-0 min-h-0 flex-1 overflow-hidden">
          <div className="min-h-full px-4 py-5 sm:px-6">{children}</div>
        </ScrollArea>
        {footer ? <SheetFooter className="sticky bottom-0 z-10 flex-row justify-end border-t bg-background/95 px-4 py-4 shadow-[0_-8px_20px_-18px_rgba(0,0,0,0.3)] backdrop-blur sm:px-6 [&>button]:min-w-0 [&>button]:flex-1 sm:[&>button]:flex-none">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
