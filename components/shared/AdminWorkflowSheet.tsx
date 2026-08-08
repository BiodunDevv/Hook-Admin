"use client";

import type { ReactNode } from "react";
import { PanelRightOpen } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
      <SheetContent side="right" className={cn("w-full gap-0 overflow-hidden border-l bg-background p-0 shadow-2xl sm:max-w-2xl xl:max-w-3xl 2xl:max-w-4xl", className)}>
        <SheetHeader className="sticky top-0 z-10 border-b bg-background/95 px-7 py-6 shadow-sm backdrop-blur">
          <div className="flex items-start gap-3 pr-10">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#fff4b8] text-[#806300] ring-1 ring-[#f0d76a]">
              <PanelRightOpen className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#9a7800]">Hook workflow</p>
              <SheetTitle className="mt-1 text-xl tracking-tight">{title}</SheetTitle>
              {description ? <SheetDescription className="mt-1.5 max-w-2xl leading-5">{description}</SheetDescription> : null}
            </div>
          </div>
        </SheetHeader>
        <div className="min-h-0 flex-1 overflow-y-auto px-7 py-7">{children}</div>
        {footer ? <SheetFooter className="sticky bottom-0 z-10 border-t bg-background/95 px-7 py-5 shadow-[0_-8px_20px_-18px_rgba(0,0,0,0.3)] backdrop-blur sm:flex-row sm:justify-end">{footer}</SheetFooter> : null}
      </SheetContent>
    </Sheet>
  );
}
