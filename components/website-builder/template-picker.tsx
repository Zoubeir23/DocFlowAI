"use client";

import { useState } from "react";
import { clinicTemplates } from "@/data/clinic-templates";
import { Check, Globe, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { initializeClinicWebsite } from "@/actions/website";

export function TemplatePicker({ onComplete }: { onComplete: (website: any) => void }) {
  const [selectedId, setSelectedId] = useState(clinicTemplates[0].id);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    try {
      setIsCreating(true);
      const res = await initializeClinicWebsite(selectedId);
      if (res.success && res.data) {
        toast.success("Website created successfully!");
        onComplete(res.data);
      } else {
        throw new Error(res.error || "Failed to create website");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="p-8 max-w-[1200px] mx-auto space-y-8 animate-in fade-in-0 duration-300">
      <div className="text-center space-y-3">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-2">
          <Globe className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-bold tracking-tight">Choose a Design Template</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
          Select a template for your clinic's public website. You can customize the colors, text, and images later.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {clinicTemplates.map((template) => (
          <div
            key={template.id}
            onClick={() => setSelectedId(template.id)}
            className={cn(
              "group relative overflow-hidden rounded-2xl border-2 transition-all duration-200 cursor-pointer bg-background hover:shadow-xl hover:-translate-y-1",
              selectedId === template.id
                ? "border-primary shadow-lg ring-4 ring-primary/10"
                : "border-border hover:border-primary/50"
            )}
          >
            {/* Selected indicator */}
            {selectedId === template.id && (
              <div className="absolute top-4 right-4 z-10 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-5 h-5" />
              </div>
            )}
            
            {/* Image container */}
            <div className="aspect-[4/3] w-full overflow-hidden relative border-b border-border">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className={cn(
                  "w-full h-full object-cover transition-transform duration-500",
                  selectedId === template.id ? "scale-105" : "group-hover:scale-105"
                )}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* Info */}
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary bg-primary/10 px-2 py-1 rounded-md">
                  {template.category}
                </span>
              </div>
              <h3 className="text-xl font-bold mb-2">{template.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {template.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-center pt-8 border-t border-border mt-8">
        <button
          onClick={handleCreate}
          disabled={isCreating}
          className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground hover:bg-primary/90 font-semibold rounded-xl transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? (
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Sparkles className="w-5 h-5" />
          )}
          Create My Website
        </button>
      </div>
    </div>
  );
}
