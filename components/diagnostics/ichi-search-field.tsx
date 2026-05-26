"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { Input } from "@/components/ui/input";

interface IchiResult {
  id: string;
  title: string;
  theCode?: string;
}

interface IchiSearchFieldProps {
  value: string;
  ichiCode: string;
  onSelect: (title: string, code: string) => void;
  placeholder?: string;
}

export function IchiSearchField({ value, ichiCode, onSelect, placeholder = "Rechercher un acte médical..." }: IchiSearchFieldProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<IchiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setQuery(value); }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleChange(inputValue: string) {
    setQuery(inputValue);
    onSelect(inputValue, "");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.length < 2) { setOptions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/ichi/search?q=${encodeURIComponent(inputValue)}`);
        const data: IchiResult[] = await res.json();
        setOptions(data);
        setOpen(data.length > 0);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          value={query}
          onChange={(e) => handleChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-xl border-border text-sm pr-8"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-muted-foreground" />
        )}
      </div>

      {ichiCode && (
        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-violet-50 text-violet-700 border border-violet-200">
          ICHI {ichiCode}
        </span>
      )}

      {open && options.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => { onSelect(option.title, option.theCode ?? ""); setQuery(option.title); setOpen(false); }}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
            >
              <Stethoscope className="w-3.5 h-3.5 text-violet-600 mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">{option.title}</p>
                {option.theCode && (
                  <p className="text-[10px] font-mono text-violet-600 mt-0.5">{option.theCode}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
