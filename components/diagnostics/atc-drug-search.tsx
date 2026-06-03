"use client";

import { useState, useRef, useEffect } from "react";
import { Loader2, Pill, PlusCircle } from "lucide-react";
import { Input } from "@/components/ui/input";

export interface AtcDrugOption {
  rxcui: string;
  name: string;
  atcCode: string | null;
  atcName: string | null;
}

interface AtcDrugSearchProps {
  value: string;
  atcCode: string;
  onSelect: (name: string, atcCode: string, rxcui: string) => void;
  placeholder?: string;
}

export function AtcDrugSearch({ value, atcCode, onSelect, placeholder = "Nom commercial ou DCI" }: AtcDrugSearchProps) {
  const [query, setQuery] = useState(value);
  const [options, setOptions] = useState<AtcDrugOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [savingCustom, setSavingCustom] = useState(false);
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
    onSelect(inputValue, "", "");

    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (inputValue.length < 2) { setOptions([]); setOpen(false); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/drugs/search?q=${encodeURIComponent(inputValue)}`);
        const data: AtcDrugOption[] = await res.json();
        setOptions(data);
        setOpen(true);
      } catch {
        setOptions([]);
      } finally {
        setLoading(false);
      }
    }, 400);
  }

  function handleSelect(option: AtcDrugOption) {
    setQuery(option.name);
    onSelect(option.name, option.atcCode ?? "", option.rxcui);
    setOpen(false);
  }

  async function handleSaveCustomDrug() {
    const name = query.trim();
    if (!name) return;
    setSavingCustom(true);
    try {
      const res = await fetch("/api/drugs/custom", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (res.ok) {
        onSelect(name, "", `custom_${name}`);
        setOpen(false);
      }
    } finally {
      setSavingCustom(false);
    }
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

      {atcCode && (
        <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
          ATC {atcCode}
        </span>
      )}

      {open && (options.length > 0 || (query.trim().length >= 2 && !loading)) && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-xl shadow-xl overflow-hidden">
          {options.map((option) => (
            <button
              key={option.rxcui}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full flex items-start gap-3 px-3 py-2.5 hover:bg-accent text-left transition-colors"
            >
              <Pill className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{option.name}</p>
                {option.atcCode && (
                  <p className="text-[10px] font-mono text-blue-600 mt-0.5">
                    {option.atcCode} — {option.atcName}
                  </p>
                )}
              </div>
            </button>
          ))}
          {options.length === 0 && query.trim().length >= 2 && !loading && (
            <div className="px-3 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">"{query}" introuvable dans la base de données.</p>
              <button
                type="button"
                onClick={handleSaveCustomDrug}
                disabled={savingCustom}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
              >
                {savingCustom ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <PlusCircle className="w-3.5 h-3.5" />
                )}
                Ajouter "{query}" à ma pharmacopée
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
