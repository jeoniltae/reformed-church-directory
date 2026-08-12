"use client";
// 교회 검색 입력 — 값은 부모(ChurchDirectory)가 들고 여기서는 입력만 받는다

import { Search, X } from "lucide-react";
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ChurchSearchBarProps {
  value: string;
  onChange: (value: string) => void;
}

export function ChurchSearchBar({ value, onChange }: ChurchSearchBarProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="relative">
      <Search
        aria-hidden
        className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label="교회 검색"
        placeholder="교회명·주소·담임목사"
        className="h-10 bg-muted pr-11 pl-9 text-t5"
      />
      {/*
        지우기 버튼을 직접 그린다. type="search"의 기본 버튼은 브라우저 UA 스타일시트가
        그리는 것이라 데스크톱에만 나타나고 모바일에는 없다 (globals.css에서 숨긴다).
        모바일 우선 화면이라 손가락 크기를 고려해 입력 높이에 가깝게 키웠다.
      */}
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          aria-label="검색어 지우기"
          onClick={() => {
            onChange("");
            inputRef.current?.focus();
          }}
          className="absolute top-1/2 right-1 size-9 -translate-y-1/2 text-muted-foreground"
        >
          <X aria-hidden />
        </Button>
      )}
    </div>
  );
}
