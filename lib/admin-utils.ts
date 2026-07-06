"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages?: number;
  stats?: Record<string, number>;
}

export function money(value?: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

export function number(value?: number) {
  return new Intl.NumberFormat("en").format(Number(value || 0));
}

export function cleanError(error: unknown) {
  return error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "";
}

export function queryString(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value) !== "" && String(value) !== "all") {
      search.set(key, String(value));
    }
  });
  const value = search.toString();
  return value ? `?${value}` : "";
}

export function useUrlFilters(defaults: Record<string, string> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function get(key: string) {
    return searchParams.get(key) || defaults[key] || "";
  }

  function set(next: Record<string, string | number | undefined | null>) {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(next).forEach(([key, value]) => {
      if (value === undefined || value === null || String(value) === "" || String(value) === "all") {
        params.delete(key);
      } else {
        params.set(key, String(value));
      }
    });
    if (!("page" in next)) params.set("page", "1");
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return { get, set, searchParams };
}
