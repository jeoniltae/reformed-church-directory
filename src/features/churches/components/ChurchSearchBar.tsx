"use client";
// 교회 검색 입력 — 값은 부모(ChurchDirectory)가 들고 여기서는 입력만 받는다

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface ChurchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChurchSearchBar({ value, onChange }: ChurchSearchBarProps) {
  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="교회 검색"
        placeholder="교회명·주소·담임목사"
        className="h-10 bg-muted pl-9 text-t5"
      />
    </div>
  );
}
