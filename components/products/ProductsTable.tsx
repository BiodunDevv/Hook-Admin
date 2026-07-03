"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { cn } from "@/lib/utils";
import { apiGet } from "@/lib/api";

interface ProductRow {
  id: string;
  title: string;
  category?: { name?: string };
  vendor?: { businessName?: string };
  sellingPrice: number;
  quantity: number;
  status: string;
}

interface Page<T> { data: T[]; total: number; }

export function ProductsTable() {
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    apiGet<Page<ProductRow>>("/admin/products")
      .then((result) => setProducts(result.data))
      .catch((err: unknown) => setError(err instanceof Error ? err.message : "Failed to load products"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="border-b border-zinc-100 bg-zinc-50">
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Product</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Category</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Vendor</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Price</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Stock</TableHead>
            <TableHead className="px-5 py-3 text-[11px] font-semibold uppercase tracking-wide text-zinc-400">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && <TableRow><TableCell colSpan={6} className="px-5 py-8 text-center text-zinc-500">Loading products...</TableCell></TableRow>}
          {error && <TableRow><TableCell colSpan={6} className="px-5 py-8 text-center text-red-600">{error}</TableCell></TableRow>}
          {!loading && !error && products.length === 0 && <TableRow><TableCell colSpan={6} className="px-5 py-8 text-center text-zinc-500">No products found.</TableCell></TableRow>}
          {products.map((p) => (
            <TableRow key={p.id} className="border-b border-zinc-100 transition-colors hover:bg-zinc-50">
              <TableCell className="px-5 py-4 font-medium text-zinc-900">{p.title}</TableCell>
              <TableCell className="px-5 py-4 text-zinc-600">{p.category?.name || "Uncategorized"}</TableCell>
              <TableCell className="px-5 py-4 text-zinc-600">{p.vendor?.businessName || "Vendor"}</TableCell>
              <TableCell className="px-5 py-4 font-semibold text-zinc-900">₦{Number(p.sellingPrice || 0).toLocaleString()}</TableCell>
              <TableCell className="px-5 py-4">
                <span className={cn("font-medium", p.quantity < 10 ? "text-amber-600" : "text-zinc-600")}>
                  {p.quantity}
                </span>
              </TableCell>
              <TableCell className="px-5 py-4">
                <StatusBadge status={p.quantity < 10 ? "Low Stock" : p.status} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
