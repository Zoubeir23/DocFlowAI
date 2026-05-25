"use client";

import { useState, useCallback, useRef } from "react";
import { Search, X, Plus, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { IcdCode } from "@/types";

interface IcdSearchFieldProps {
  selectedCodes: IcdCode[];
  onCodesChange: (codes: IcdCode[]) => void;
}

interface IcdSearchResult {
  id: string;
  title: string;
  theCode?: string;
}

export function IcdSearchField({ selectedCodes, onCodesChange }: IcdSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IcdSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchIcd = useCallback(async (searchQuery: string) => {
    if (searchQuery.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        `/api/icd/search?q=${encodeURIComponent(searchQuery)}&lang=fr&limit=8`
      );
      const responseData = await response.json() as { results: IcdSearchResult[] };
      setResults(responseData.results ?? []);
      setIsOpen(true);
    } catch {
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => searchIcd(value), 350);
  }

  function addCode(result: IcdSearchResult) {
    const alreadyAdded = selectedCodes.some((code) => code.id === result.id);
    if (alreadyAdded) return;

    const newCode: IcdCode = {
      id: result.id,
      code: result.theCode ?? "",
      title: result.title,
    };

    onCodesChange([...selectedCodes, newCode]);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function removeCode(codeId: string) {
    onCodesChange(selectedCodes.filter((code) => code.id !== codeId));
  }

  return (
    <div className="space-y-3">
      {/* Selected codes */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedCodes.map((code) => (
            <div
              key={code.id}
              className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary/10 border border-primary/20 rounded-lg text-xs"
            >
              {code.code && (
                <span className="font-mono font-bold text-primary text-[11px]">
                  {code.code}
                </span>
              )}
              <span className="text-foreground max-w-[180px] truncate">{code.title}</span>
              <button
                type="button"
                onClick={() => removeCode(code.id)}
                className="ml-0.5 text-muted-foreground hover:text-destructive transition-colors"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onFocus={() => results.length > 0 && setIsOpen(true)}
            onBlur={() => setTimeout(() => setIsOpen(false), 150)}
            placeholder="Rechercher un diagnostic ICD-11 (ex: diabète, hypertension...)"
            className="pl-10 h-10 rounded-xl border-border bg-card focus:ring-primary focus:border-primary text-sm"
          />
          {isLoading && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          )}
        </div>

        {/* Dropdown results */}
        {isOpen && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-card border border-border rounded-xl shadow-lg overflow-hidden">
            {results.map((result) => {
              const isAlreadyAdded = selectedCodes.some((code) => code.id === result.id);
              return (
                <button
                  key={result.id}
                  type="button"
                  onMouseDown={() => addCode(result)}
                  disabled={isAlreadyAdded}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-accent transition-colors text-left border-b border-border last:border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isAlreadyAdded ? (
                      <Tag className="w-4 h-4 text-primary" />
                    ) : (
                      <Plus className="w-4 h-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {result.theCode && (
                        <span className="font-mono text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded flex-shrink-0">
                          {result.theCode}
                        </span>
                      )}
                      <span className="text-sm text-foreground truncate">{result.title}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
