"use client";

import { useState } from "react";
import { TemplatePicker } from "./template-picker";
import { WebsiteEditor } from "./website-editor";
import { WebsitePreview } from "./website-preview";
import { Copy, ExternalLink, PanelRightClose, PanelRightOpen } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function WebsiteBuilderClient({ initialWebsite, clinic }: { initialWebsite: any, clinic: any }) {
  const [website, setWebsite] = useState(initialWebsite);
  const [editorOpen, setEditorOpen] = useState(true);

  if (!website) {
    return <TemplatePicker onComplete={(newWebsite) => setWebsite(newWebsite)} />;
  }

  const handleUpdate = (updates: any) => {
    setWebsite({ ...website, ...updates });
  };

  return (
    <div className="flex h-full overflow-hidden bg-muted/10 relative">
      {/* Sidebar Editor */}
      <div 
        className={cn(
          "h-full transition-all duration-300 ease-in-out shrink-0",
          editorOpen ? "w-[400px] border-r border-border" : "w-0 overflow-hidden"
        )}
      >
        <div className="w-[400px] h-full">
          <WebsiteEditor 
            website={website} 
            onChange={handleUpdate}
            onPublishToggle={() => handleUpdate({ is_published: !website.is_published })}
          />
        </div>
      </div>

      {/* Main Preview Area */}
      <div className="flex-1 flex flex-col h-full relative">
        <div className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setEditorOpen(!editorOpen)}
              className="p-2 hover:bg-muted rounded-md transition-colors"
            >
              {editorOpen ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
            </button>
            <div className="h-4 w-px bg-border" />
            <span className="text-sm font-medium">Preview Mode</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-2 h-2 rounded-full", website.is_published ? "bg-green-500" : "bg-yellow-500")} />
              <span className="text-sm text-muted-foreground">
                {website.is_published ? "Published" : "Draft"}
              </span>
            </div>
            
            {website.is_published && (
              <div className="flex items-center gap-2 ml-4">
                <a 
                  href={`/clinique/${clinic.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  View Live <ExternalLink className="w-4 h-4" />
                </a>
                <div className="h-4 w-px bg-border mx-1" />
                <button 
                  onClick={() => {
                    const url = `${window.location.origin}/clinique/${clinic.slug}`;
                    navigator.clipboard.writeText(url);
                    toast.success("Public link copied to clipboard!");
                  }}
                  className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Copy Link <Copy className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 p-4 lg:p-8 overflow-hidden flex justify-center items-start">
          <div className="w-full max-w-[1200px] h-[85vh] shadow-2xl rounded-tl-2xl rounded-tr-2xl ring-1 ring-border">
            <WebsitePreview website={website} />
          </div>
        </div>
      </div>
    </div>
  );
}
