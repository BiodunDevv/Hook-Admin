"use client";

import Link from "next/link";
import { useState } from "react";
import { Inbox, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";

type Field = { key: string; label: string; type?: "text" | "email" | "number" | "id-list"; required?: boolean };
type Row = Record<string, unknown> & { id: string; publicId?: string; status?: string; name?: string };
type PageData = { data: Row[]; total: number };

export function PlatformDirectoryPage({
  title,
  description,
  endpoint,
  detailBase,
  permissionLabel,
  fields,
  columns,
}: {
  title: string;
  description: string;
  endpoint: string;
  detailBase: string;
  permissionLabel: string;
  fields: Field[];
  columns: { key: string; label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const query = useApiQuery<PageData>(["platform", endpoint], `${endpoint}?limit=50`);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = Object.fromEntries(fields.map((field) => {
      const raw = String(form.get(field.key) || "").trim();
      if (field.type === "number") return [field.key, Number(raw)];
      if (field.type === "id-list") {
        return [field.key, raw.split(",").map((value) => value.trim()).filter(Boolean)];
      }
      return [field.key, raw];
    }));
    if (endpoint === "/admin/partners") {
      body.contact = { email: body.email, phone: body.phone };
    }
    try {
      await apiPost(endpoint, body);
      toast.success(`${title.replace(/s$/, "")} created`);
      setOpen(false);
      query.refetch();
    } catch (error) {
      toast.error(error instanceof Error ? error.message.replace(/^\d+:\s*/, "") : "Unable to save record");
    }
  }

  return (
    <div className="p-2 md:p-4">
      <PageHeader
        title={title}
        description={description}
        actions={fields.length ? (
          <Button onClick={() => setOpen(true)} className="bg-hook text-black hover:bg-hook/90">
            <Plus /> Add
          </Button>
        ) : undefined}
      />
      <Card className="mt-4 rounded-lg shadow-none">
        <CardContent className="p-0">
          {query.isLoading ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3"><HookLoader /><p className="text-sm text-muted-foreground">Loading {title.toLowerCase()}</p></div>
          ) : query.isError ? (
            <div className="flex min-h-64 flex-col items-center justify-center gap-3">
              <p className="text-sm text-muted-foreground">This directory could not be loaded.</p>
              <Button variant="outline" onClick={() => query.refetch()}><RefreshCcw /> Retry</Button>
            </div>
          ) : !query.data?.data?.length ? (
            <EmptyState icon={Inbox} title={`No ${title.toLowerCase()} yet`} description={`Create the first record when ${permissionLabel} is ready.`} />
          ) : (
            <Table>
              <TableHeader><TableRow><TableHead>ID</TableHead>{columns.map((column) => <TableHead key={column.key}>{column.label}</TableHead>)}<TableHead>Status</TableHead></TableRow></TableHeader>
              <TableBody>
                {query.data.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell><Link className="font-medium hover:underline" href={`${detailBase}/${row.publicId || row.id}`}>{row.publicId || row.id}</Link></TableCell>
                    {columns.map((column) => <TableCell key={column.key}>{String(row[column.key] ?? "—")}</TableCell>)}
                    <TableCell><Badge variant="outline" className="capitalize">{row.status || "active"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {title.replace(/s$/, "")}</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                <Input id={field.key} name={field.key} type={field.type === "id-list" ? "text" : field.type || "text"} required={field.required} />
              </div>
            ))}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-hook text-black hover:bg-hook/90">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
