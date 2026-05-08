"use client";

import { useState } from "react";
import { updateClinicWebsite } from "@/actions/website";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { ChevronDown, Globe, Layout, Palette, Settings, Type } from "lucide-react";
import { cn } from "@/lib/utils";

export function WebsiteEditor({ 
  website, 
  onChange,
  onPublishToggle
}: { 
  website: any; 
  onChange: (updates: any) => void;
  onPublishToggle: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"content" | "style" | "settings">("content");
  const [isSaving, setIsSaving] = useState(false);

  // Helper to handle nested updates safely
  const updateNested = (section: string, field: string, value: any) => {
    const updatedSection = { ...website[section], [field]: value };
    onChange({ [section]: updatedSection });
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      const res = await updateClinicWebsite(website);
      if (res.success) {
        toast.success("Changes saved successfully!");
      } else {
        throw new Error(res.error || "Failed to save");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-card border-r border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold flex items-center gap-2">
          <Globe className="w-5 h-5 text-primary" />
          Website Editor
        </h2>
        <Button onClick={handleSave} disabled={isSaving} size="sm">
          {isSaving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <div className="flex border-b border-border p-2 gap-1 bg-muted/30">
        <button
          onClick={() => setActiveTab("content")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors",
            activeTab === "content" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Layout className="w-4 h-4" />
          Content
        </button>
        <button
          onClick={() => setActiveTab("style")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors",
            activeTab === "style" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Palette className="w-4 h-4" />
          Style
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium rounded-md transition-colors",
            activeTab === "settings" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Settings className="w-4 h-4" />
          Settings
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {activeTab === "content" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            {/* Hero Section Editor */}
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2">
                <Type className="w-4 h-4" /> Hero Section
              </h3>
              
              <div className="space-y-2">
                <Label>Main Title</Label>
                <Input 
                  value={website.hero_data.title || ""} 
                  onChange={(e) => updateNested("hero_data", "title", e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Subtitle / Description</Label>
                <Textarea 
                  value={website.hero_data.subtitle || ""} 
                  onChange={(e) => updateNested("hero_data", "subtitle", e.target.value)}
                  className="resize-none"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Primary Button</Label>
                  <Input 
                    value={website.hero_data.ctaPrimary || ""} 
                    onChange={(e) => updateNested("hero_data", "ctaPrimary", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Secondary Button</Label>
                  <Input 
                    value={website.hero_data.ctaSecondary || ""} 
                    onChange={(e) => updateNested("hero_data", "ctaSecondary", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Background Image URL</Label>
                <Input 
                  value={website.hero_data.bgImage || ""} 
                  onChange={(e) => updateNested("hero_data", "bgImage", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>

            {/* About Section Editor */}
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                About The Doctor
              </h3>
              
              <div className="space-y-2">
                <Label>Biography</Label>
                <Textarea 
                  value={website.about_data.bio || ""} 
                  onChange={(e) => updateNested("about_data", "bio", e.target.value)}
                  className="resize-none"
                  rows={4}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Avatar Image URL</Label>
                <Input 
                  value={website.about_data.avatar || ""} 
                  onChange={(e) => updateNested("about_data", "avatar", e.target.value)}
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Colors
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={website.style_config.primary || "#2563eb"} 
                      onChange={(e) => updateNested("style_config", "primary", e.target.value)}
                      className="w-12 p-1 h-9"
                    />
                    <Input 
                      value={website.style_config.primary || "#2563eb"} 
                      onChange={(e) => updateNested("style_config", "primary", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Accent Color</Label>
                  <div className="flex gap-2">
                    <Input 
                      type="color" 
                      value={website.style_config.accent || "#10b981"} 
                      onChange={(e) => updateNested("style_config", "accent", e.target.value)}
                      className="w-12 p-1 h-9"
                    />
                    <Input 
                      value={website.style_config.accent || "#10b981"} 
                      onChange={(e) => updateNested("style_config", "accent", e.target.value)}
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Design System
              </h3>
              
              <div className="space-y-2">
                <Label>Border Radius</Label>
                <select 
                  value={website.style_config.radius || "0.75rem"}
                  onChange={(e) => updateNested("style_config", "radius", e.target.value)}
                  className="w-full h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors"
                >
                  <option value="0rem">Square (0px)</option>
                  <option value="0.5rem">Small (8px)</option>
                  <option value="0.75rem">Medium (12px)</option>
                  <option value="1.5rem">Large (24px)</option>
                  <option value="9999px">Pill (Fully rounded)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Features
              </h3>
              
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Chat Widget</Label>
                  <p className="text-xs text-muted-foreground">Enable the AI booking assistant on your site</p>
                </div>
                <Switch 
                  checked={website.show_chat_widget} 
                  onCheckedChange={(checked) => onChange({ show_chat_widget: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Show Services</Label>
                  <p className="text-xs text-muted-foreground">Automatically import services from your dashboard</p>
                </div>
                <Switch 
                  checked={website.show_services} 
                  onCheckedChange={(checked) => onChange({ show_services: checked })}
                />
              </div>
            </div>

            <div className="space-y-4 rounded-xl border border-border bg-muted/20 p-4">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground mb-3">
                Publication
              </h3>
              
              <div className="flex items-center justify-between p-3 rounded-lg border border-primary/20 bg-primary/5">
                <div className="space-y-0.5">
                  <Label className="font-semibold text-primary">Published Status</Label>
                  <p className="text-xs text-muted-foreground">Make your site visible to the world</p>
                </div>
                <Switch 
                  checked={website.is_published} 
                  onCheckedChange={onPublishToggle}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
