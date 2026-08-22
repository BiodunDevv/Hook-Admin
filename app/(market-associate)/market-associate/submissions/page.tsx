"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { Camera, Plus } from "lucide-react";
import { CatalogStatusBadge } from "@/components/catalog/CatalogStatusBadge";
import { HookLoader } from "@/components/shared/HookLoader";
import { MobileEmpty, MobileHeader } from "@/components/mobile/MobileUI";
import { useApiQuery } from "@/lib/query";
import type { CursorPage, ProductSubmission } from "@/lib/catalog";

const filters = [
  ["All", "all"],
  ["Drafts", "draft"],
  ["In review", "submitted"],
  ["Changes", "changes_requested"],
] as const;

export default function RunnerSubmissionsPage() {
  const query = useApiQuery<CursorPage<ProductSubmission>>(
    ["runner", "submissions"],
    "/runner/product-submissions?limit=50",
  );
  const [filter, setFilter] = useState<string>("all");
  const rows = query.data?.data || [];
  const visible =
    filter === "all"
      ? rows
      : rows.filter((row) =>
          filter === "submitted"
            ? row.status === "submitted" || row.status === "in_review"
            : row.status === filter,
        );

  return (
    <div>
      <MobileHeader
        title="Captures"
        subtitle="Draft, submit, and respond to Catalog Review."
        action={
          <Link
            href="/runner/submissions/new"
            className="flex size-10 items-center justify-center rounded-full bg-[#FFC809]"
            aria-label="New submission"
          >
            <Plus size={20} className="text-black" />
          </Link>
        }
      />

      <div className="mb-4 flex gap-2 overflow-x-auto pb-1">
        {filters.map(([label, value]) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-[13px] font-semibold transition ${
              filter === value ? "bg-black text-white" : "bg-white text-[#8F8F8F]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {query.isLoading ? (
        <div className="grid min-h-56 place-items-center">
          <HookLoader label="Loading captures" />
        </div>
      ) : query.isError ? (
        <div className="grid min-h-56 place-items-center text-center text-sm text-destructive">
          Captures could not be loaded.
        </div>
      ) : !visible.length ? (
        <MobileEmpty
          icon={Camera}
          title="Nothing here yet"
          description="Capture a product from your assigned market to get started."
        />
      ) : (
        <div className="overflow-hidden rounded-[10px] bg-white px-2.5">
          {visible.map((row) => (
            <Link
              key={row.publicId}
              href={`/runner/submissions/${row.publicId}`}
              className="flex min-h-17.5 items-center gap-3 border-b border-[#D9D9D9] last:border-b-0 transition active:bg-black/3"
            >
              <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[7px] bg-[#EAEBE7]">
                {row.imageUrl ? (
                  <Image src={row.imageUrl} alt="" width={44} height={44} className="size-full object-cover" />
                ) : (
                  <Camera size={18} className="text-black" />
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[15px] font-semibold text-black">{row.basicTitle}</span>
                <span className="mt-0.5 block truncate text-[13px] text-[#8F8F8F]">
                  Updated {new Date(row.updatedAt).toLocaleDateString("en-NG")}
                </span>
              </span>
              <CatalogStatusBadge status={row.status} />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
