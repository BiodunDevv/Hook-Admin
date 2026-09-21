"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, ChevronRight, FolderTree, Search } from "lucide-react";
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { CategoryOption } from "@/lib/category-attributes";

/**
 * Tree category choice. Parents expand to show their sub-categories; products
 * live in a leaf, so only a leaf (a sub-category, or a category with no
 * children such as Wigs) can be selected. Search opens every matching branch.
 */
export function CategoryPicker({
  categories,
  value,
  onChange,
  label = "Category",
}: {
  categories: CategoryOption[];
  /** The selected leaf's id. */
  value: string;
  onChange: (leafId: string) => void;
  label?: string;
  /** Kept for backwards compatibility; a category is always required. */
  required?: boolean;
}) {
  const active = useMemo(() => categories.filter((category) => category.isActive !== false), [categories]);
  const roots = useMemo(() => active.filter((category) => !category.parentId), [active]);
  const childrenOf = (id: string) => active.filter((category) => category.parentId === id);
  const found = active.find((category) => category.id === value || (Boolean(value) && category.publicId === value));
  // A parent that has sub-categories is not a valid choice (products live in a leaf), e.g. a legacy value.
  const selected = found && !childrenOf(found.id).length ? found : undefined;
  const parentOfSelected = selected?.parentId ? active.find((category) => category.id === selected.parentId) : undefined;

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const term = query.trim().toLowerCase();
  const matches = (name: string) => !term || name.toLowerCase().includes(term);
  const visibleRoots = roots.filter((root) => matches(root.name) || childrenOf(root.id).some((child) => matches(child.name)));
  const isOpen = (id: string) => Boolean(term) || expanded.has(id) || parentOfSelected?.id === id;

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function choose(id: string) {
    onChange(id);
    setOpen(false);
    setQuery("");
  }

  return (
    <Field className="sm:col-span-2 md:col-span-2">
      <FieldLabel>{label}</FieldLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-xs hover:bg-zinc-50"
            aria-haspopup="tree"
            aria-expanded={open}
          >
            <span className="flex min-w-0 items-center gap-2">
              <FolderTree size={15} className="shrink-0 text-zinc-400" />
              {selected ? (
                <span className="truncate">
                  {parentOfSelected ? <span className="text-zinc-400">{parentOfSelected.name} › </span> : null}
                  <span className="font-medium text-zinc-900">{selected.name}</span>
                </span>
              ) : (
                <span className="text-zinc-400">Select a category</span>
              )}
            </span>
            <ChevronDown size={14} className="shrink-0 text-zinc-400" />
          </button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-[--radix-popover-trigger-width] min-w-72 p-0">
          <div className="relative border-b p-2">
            <Search size={14} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              autoFocus
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories"
              className="h-8 w-full rounded-md bg-zinc-50 pl-8 pr-2 text-sm outline-none focus:ring-2 focus:ring-zinc-200"
            />
          </div>
          <ul role="tree" className="max-h-72 overflow-y-auto p-1.5">
            {visibleRoots.length === 0 ? <li className="px-3 py-6 text-center text-sm text-zinc-400">No categories match</li> : null}
            {visibleRoots.map((root) => {
              const children = childrenOf(root.id).filter((child) => matches(child.name) || matches(root.name));
              const isLeaf = childrenOf(root.id).length === 0;
              return (
                <li key={root.id} role="treeitem" aria-expanded={isLeaf ? undefined : isOpen(root.id)} aria-selected={root.id === selected?.id}>
                  <button
                    type="button"
                    onClick={() => (isLeaf ? choose(root.id) : toggle(root.id))}
                    className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100", root.id === selected?.id && "bg-amber-50")}
                  >
                    {isLeaf ? <span className="size-4" /> : isOpen(root.id) ? <ChevronDown size={14} className="text-zinc-500" /> : <ChevronRight size={14} className="text-zinc-500" />}
                    <span className="flex-1 font-medium text-zinc-800">{root.name}</span>
                    {isLeaf ? (root.id === selected?.id ? <Check size={14} className="text-amber-600" /> : <span className="text-[10px] uppercase text-zinc-400">Holds products</span>) : <span className="text-xs text-zinc-400">{childrenOf(root.id).length}</span>}
                  </button>
                  {!isLeaf && isOpen(root.id) ? (
                    <ul role="group" className="ml-4 border-l border-zinc-200 pl-1">
                      {children.map((child) => (
                        <li key={child.id} role="treeitem" aria-selected={child.id === selected?.id}>
                          <button
                            type="button"
                            onClick={() => choose(child.id)}
                            className={cn("flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-zinc-100", child.id === selected?.id && "bg-amber-50")}
                          >
                            <span className="flex-1 text-zinc-700">{child.name}</span>
                            {child.id === selected?.id ? <Check size={14} className="text-amber-600" /> : null}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </PopoverContent>
      </Popover>
      <FieldDescription>Pick a sub-category. Products are filed at the last level so customers can find them.</FieldDescription>
    </Field>
  );
}
