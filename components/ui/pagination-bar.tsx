"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationBarProps {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export function PaginationBar({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
}: PaginationBarProps) {
  if (totalPages <= 1) return null;

  const from = (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="flex items-center justify-between px-1 py-3 border-t border-border">
      <span className="text-xs text-muted-foreground">
        {from}–{to} sur {total}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page précédente"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <span className="px-3 py-1 text-xs font-semibold text-foreground">
          {page} / {totalPages}
        </span>

        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="p-1.5 rounded-lg border border-border bg-card text-foreground hover:bg-accent disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          aria-label="Page suivante"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
