"use client";

import Link from "next/link";
import { useState } from "react";
import { ChevronsUpDown, Inbox, Plus, RefreshCcw } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/EmptyState";
import { HookLoader } from "@/components/shared/HookLoader";
import { PageHeader } from "@/components/shared/PageHeader";
import { apiPost } from "@/lib/api";
import { useApiQuery } from "@/lib/query";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };
type Field = {
  key: string;
  label: string;
  type?: "text" | "email" | "number" | "id-list" | "select" | "multi-select";
  required?: boolean;
  options?: Option[];
  optionsEndpoint?: string;
  optionLabelKey?: string;
  dependsOn?: string;
  dependsOnKey?: string;
};
type Row = Record<string, unknown> & { id: string; publicId?: string; status?: string; name?: string };
type PageData = { data: Row[]; total: number };
type FormValue = string | string[];
type FormValues = Record<string, FormValue>;

function selectedDependency(values: FormValues, key?: string) {
  if (!key) return [];
  const value = values[key];
  return Array.isArray(value) ? value : value ? [value] : [];
}

function useRelatedOptions(field: Field, values: FormValues) {
  const dependencies = selectedDependency(values, field.dependsOn);
  const query = useApiQuery<PageData | Row[]>(
    ["platform-options", field.optionsEndpoint, ...dependencies],
    `${field.optionsEndpoint}?limit=100`,
    Boolean(field.optionsEndpoint) && (!field.dependsOn || dependencies.length > 0),
  );
  const rows = Array.isArray(query.data) ? query.data : query.data?.data || [];
  const filtered = dependencies.length
    ? rows.filter((row) => dependencies.includes(String(row[field.dependsOnKey || `${field.dependsOn}Id`] || "")))
    : rows;
  const options = field.options || filtered.map((row) => ({
    value: String(row.id),
    label: String(row[field.optionLabelKey || "name"] || row.publicId || "Unnamed record"),
  }));
  return { options, query, dependencies };
}

function RelatedSelect({
  field,
  value,
  values,
  onChange,
}: {
  field: Field;
  value?: string;
  values: FormValues;
  onChange: (value: string) => void;
}) {
  const { options, query, dependencies } = useRelatedOptions(field, values);

  return (
    <>
      <input type="hidden" name={field.key} value={value || ""} />
      <Select value={value} onValueChange={onChange} disabled={Boolean(field.dependsOn && !dependencies.length) || query.isLoading}>
        <SelectTrigger id={field.key} className="w-full">
          <SelectValue placeholder={
            field.dependsOn && !dependencies.length
              ? `Select ${field.dependsOn.replace(/Id$/, "")} first`
              : query.isLoading
                ? "Loading options..."
                : `Select ${field.label.toLowerCase()}`
          } />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );
}

function RelatedMultiSelect({
  field,
  value = [],
  values,
  onChange,
}: {
  field: Field;
  value?: string[];
  values: FormValues;
  onChange: (value: string[]) => void;
}) {
  const { options, query, dependencies } = useRelatedOptions(field, values);
  const disabled = Boolean(field.dependsOn && !dependencies.length) || query.isLoading;
  const selectedLabels = options.filter((option) => value.includes(option.value)).map((option) => option.label);

  return (
    <>
      <input type="hidden" name={field.key} value={value.join(",")} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id={field.key}
            type="button"
            variant="outline"
            role="combobox"
            disabled={disabled}
            className="h-auto min-h-9 w-full justify-between px-3 font-normal"
          >
            <span className={cn("truncate text-left", !selectedLabels.length && "text-muted-foreground")}>
              {query.isLoading
                ? "Loading options..."
                : field.dependsOn && !dependencies.length
                  ? `Select ${field.dependsOn.replace(/Ids?$/, "")} first`
                  : selectedLabels.length
                    ? selectedLabels.join(", ")
                    : `Select ${field.label.toLowerCase()}`}
            </span>
            <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] gap-0 p-0">
          <Command>
            <CommandInput placeholder={`Search ${field.label.toLowerCase()}...`} />
            <CommandList>
              <CommandEmpty>No matching options.</CommandEmpty>
              <CommandGroup>
                {options.map((option) => {
                  const selected = value.includes(option.value);
                  return (
                    <CommandItem
                      key={option.value}
                      value={`${option.label} ${option.value}`}
                      data-checked={selected}
                      onSelect={() => onChange(selected ? value.filter((item) => item !== option.value) : [...value, option.value])}
                    >
                      <span className="truncate">{option.label}</span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </>
  );
}

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
  const [values, setValues] = useState<FormValues>({});
  const query = useApiQuery<PageData>(["platform", endpoint], `${endpoint}?limit=50`);

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body: Record<string, unknown> = {};
    for (const field of fields) {
      const raw = String(form.get(field.key) || "").trim();
      if (!raw && !field.required && field.type !== "id-list") continue;
      if (field.type === "number") {
        body[field.key] = Number(raw);
        continue;
      }
      if (field.type === "id-list" || field.type === "multi-select") {
        body[field.key] = raw.split(",").map((value) => value.trim()).filter(Boolean);
        continue;
      }
      body[field.key] = raw;
    }
    if (endpoint === "/admin/partners") {
      body.contact = { email: body.email, phone: body.phone };
    }
    try {
      await apiPost(endpoint, body);
      toast.success(`${title.replace(/s$/, "")} created`);
      setOpen(false);
      setValues({});
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
      <Dialog open={open} onOpenChange={(next) => {
        setOpen(next);
        if (!next) setValues({});
      }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add {title.replace(/s$/, "")}</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4">
            {fields.map((field) => (
              <div key={field.key} className="space-y-1.5">
                <Label htmlFor={field.key}>{field.label}</Label>
                {field.type === "select" ? (
                  <RelatedSelect
                    field={field}
                    value={typeof values[field.key] === "string" ? values[field.key] as string : undefined}
                    values={values}
                    onChange={(value) => setValues((current) => {
                      const next = { ...current, [field.key]: value };
                      for (const candidate of fields) {
                        if (candidate.dependsOn === field.key) delete next[candidate.key];
                      }
                      return next;
                    })}
                  />
                ) : field.type === "multi-select" ? (
                  <RelatedMultiSelect
                    field={field}
                    value={Array.isArray(values[field.key]) ? values[field.key] as string[] : []}
                    values={values}
                    onChange={(value) => setValues((current) => {
                      const next = { ...current, [field.key]: value };
                      for (const candidate of fields) {
                        if (candidate.dependsOn === field.key) delete next[candidate.key];
                      }
                      return next;
                    })}
                  />
                ) : (
                  <Input id={field.key} name={field.key} type={field.type === "id-list" ? "text" : field.type || "text"} required={field.required} />
                )}
              </div>
            ))}
            <DialogFooter><Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" className="bg-hook text-black hover:bg-hook/90">Create</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
