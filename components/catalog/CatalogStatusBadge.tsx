import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const tones: Record<string, string> = {
  draft: "border-zinc-200 bg-zinc-100 text-zinc-700",
  submitted: "border-blue-200 bg-blue-50 text-blue-700",
  in_review: "border-violet-200 bg-violet-50 text-violet-700",
  changes_requested: "border-amber-200 bg-amber-50 text-amber-800",
  approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
  published: "border-emerald-200 bg-emerald-50 text-emerald-700",
  rejected: "border-rose-200 bg-rose-50 text-rose-700",
  paused: "border-amber-200 bg-amber-50 text-amber-800",
  unpublished: "border-zinc-200 bg-zinc-100 text-zinc-700",
};

export function CatalogStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="outline" className={cn("capitalize", tones[status])}>
      {status.replaceAll("_", " ")}
    </Badge>
  );
}
