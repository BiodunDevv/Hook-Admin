"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function SearchInput({
  placeholder = "Search...",
  value,
  onChange,
  className,
}: SearchInputProps) {
  return (
    <div className={cn("relative", className)}>
      <Search
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
      />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        className="pl-9 h-9 border-zinc-200 bg-zinc-50 placeholder:text-zinc-400 text-sm"
      />
    </div>
  );
}
