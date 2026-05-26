"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, X, ActivitySquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { IcfCode } from "@/types";

interface IcfSearchFieldProps {
  selectedCodes: IcfCode[];
  onAdd: (code: IcfCode) => void;
  onRemove: (codeId: string) => void;
  placeholder?: string;
}

export function IcfSearchField({
  selectedCodes,
  onAdd,
  onRemove,
  placeholder = "Rechercher une limitation fonctionnelle (ICF)...",
}: IcfSearchFieldProps) {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<IcfCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  function handleInputChange(inputValue: string) {
    setQuery(inputValue);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.length < 2) {
      setOptions([]);
      setOpen(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/icf/search?q=${encodeURIComponent(inputValue)}`);
        const data: { results: IcfCode[] } = await response.json();
        const filtered = (data.results ?? []).filter(
          (result) => !selectedCodes.some((selected) => selected.id === result.id)
        );
        setOptions(filtered);
        setOpen(filtered.length > 0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(code: IcfCode) {
    onAdd(code);
    setQuery("");
    setOptions([]);
    setOpen(false);
  }

  return (
    <div className="space-y-2">
      {/* Selected ICF codes */}
      {selectedCodes.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedCodes.map((icfCode) => (
            <span
              key={icfCode.id}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-teal-50 border border-teal-200 text-teal-800 text-xs font-medium max-w-full"
            >
              <span className="font-mono font-bold text-teal-600">{icfCode.code || "ICF"}</span>
              <span className="truncate max-w-[200px]">{icfCode.title}</span>
              <button
                type="button"
                onClick={() => onRemove(icfCode.id)}
                className="text-teal-500 hover:text-teal-800 transition-colors flex-shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div className="relative">
          <ActivitySquare className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500 pointer-events-none" />
          <Input
            value={query}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={placeholder}
            className="rounded-xl border-border text-sm pl-9 pr-8"
            autoComplete="off"
          />
          {loading && (
            <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
          )}
        </div>

        {open && options.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-64 overflow-y-auto">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => handleSelect(option)}
                className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
              >
                <ActivitySquare className="w-3.5 h-3.5 text-teal-600 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{option.title}</p>
                  {option.code && (
                    <p className="text-[10px] font-mono text-teal-600 mt-0.5">{option.code}</p>
                  )}
                  {option.definition && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{option.definition}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Codes ICF — Classification internationale du fonctionnement (OMS). Ex: b730, d450, s710...
      </p>
    </div>
  );
}
