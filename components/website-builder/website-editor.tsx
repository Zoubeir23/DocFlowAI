"use client";

import { useState } from "react";
import { updateClinicWebsite } from "@/actions/website";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Globe, Layout, Palette, Settings, Type, User, Share, Link2, MapPin, Phone, Clock, Shield, ExternalLink } from "lucide-react";
import { ImageInputField } from "./image-input-field";
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
    <div className="flex flex-col h-full bg-background border-r border-border">
      
      {/* Premium Header */}
      <div className="p-6 border-b border-border bg-card">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground text-lg leading-tight">Website Builder</h2>
            <p className="text-xs text-muted-foreground font-medium">Customize your public presence</p>
          </div>
        </div>
        
        <Button 
          onClick={handleSave} 
          disabled={isSaving} 
          className="w-full h-11 btn-primary text-sm font-bold shadow-md"
        >
          {isSaving ? "Saving Changes..." : "Save All Changes"}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex px-4 pt-4 border-b border-border bg-card">
        {[
          { id: "content", label: "Content", icon: Layout },
          { id: "style", label: "Style", icon: Palette },
          { id: "settings", label: "Settings", icon: Settings }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 pb-3 text-sm font-bold border-b-2 transition-all",
              activeTab === tab.id 
                ? "border-primary text-primary" 
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-6 scrollbar-hide">
        {activeTab === "content" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            
            {/* Hero Section */}
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Type className="w-4 h-4 text-primary" /> Hero Section
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Main Title</Label>
                  <Input 
                    value={website.hero_data.title || ""} 
                    onChange={(e) => updateNested("hero_data", "title", e.target.value)}
                    className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    placeholder="E.g. Cabinet Médical Dr. Dupont"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Subtitle</Label>
                  <Textarea 
                    value={website.hero_data.subtitle || ""} 
                    onChange={(e) => updateNested("hero_data", "subtitle", e.target.value)}
                    className="resize-none bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium p-3"
                    rows={3}
                    placeholder="Brief description of your clinic..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary CTA</Label>
                    <Input 
                      value={website.hero_data.ctaPrimary || ""} 
                      onChange={(e) => updateNested("hero_data", "ctaPrimary", e.target.value)}
                      className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Secondary CTA</Label>
                    <Input 
                      value={website.hero_data.ctaSecondary || ""} 
                      onChange={(e) => updateNested("hero_data", "ctaSecondary", e.target.value)}
                      className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    />
                  </div>
                </div>

                <ImageInputField
                  label="Image de fond (Hero)"
                  value={website.hero_data.bgImage || ""}
                  onChange={(url) => updateNested("hero_data", "bgImage", url)}
                  folder="hero-backgrounds"
                  hint="Apparaît en arrière-plan de la section principale."
                />
              </div>
            </div>

            {/* About Section */}
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <User className="w-4 h-4 text-primary" /> About Section
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Biography</Label>
                  <Textarea
                    value={website.about_data.bio || ""}
                    onChange={(e) => updateNested("about_data", "bio", e.target.value)}
                    className="resize-none bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium p-3"
                    rows={5}
                  />
                </div>

                <ImageInputField
                  label="Photo du médecin"
                  value={website.about_data.avatar || ""}
                  onChange={(url) => updateNested("about_data", "avatar", url)}
                  folder="doctor-photos"
                  hint="Photo portrait affichée dans la section Hero et À propos."
                />
              </div>
            </div>

            {/* Contact Section */}
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" /> Informations de contact
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3 h-3" /> Adresse
                  </Label>
                  <Input
                    value={website.contact_data?.address || ""}
                    onChange={(e) => updateNested("contact_data", "address", e.target.value)}
                    className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    placeholder="123 rue de la Santé, 75014 Paris"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Phone className="w-3 h-3" /> Téléphone
                  </Label>
                  <Input
                    value={website.contact_data?.phone || ""}
                    onChange={(e) => updateNested("contact_data", "phone", e.target.value)}
                    className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    placeholder="+33 1 23 45 67 89"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Horaires d'ouverture
                  </Label>
                  <Textarea
                    value={website.contact_data?.schedule || ""}
                    onChange={(e) => updateNested("contact_data", "schedule", e.target.value)}
                    className="resize-none bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium p-3"
                    rows={3}
                    placeholder={"Lundi – Vendredi · 8h – 19h\nSamedi · 9h – 13h"}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3 h-3" /> Couverture & mutuelle
                  </Label>
                  <Input
                    value={website.contact_data?.insurance_info || ""}
                    onChange={(e) => updateNested("contact_data", "insurance_info", e.target.value)}
                    className="h-10 bg-muted/50 border-border focus:ring-primary focus:border-primary font-medium"
                    placeholder="Conventionné secteur 1 · Remboursé AM"
                  />
                </div>
              </div>
            </div>

            {/* Services Section */}
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" /> Services & Spécialités
                </h3>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Les services affichés sur votre site proviennent de votre catalogue de soins. Activez le toggle &quot;Services Catalog&quot; dans l&apos;onglet Settings pour les afficher.
                </p>
                <a
                  href="/app/services"
                  target="_blank"
                  className="flex items-center justify-between w-full h-10 px-4 rounded-xl border border-border bg-muted/50 text-sm font-semibold text-foreground hover:bg-muted transition-colors group"
                >
                  <span>Gérer mes services</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
                </a>
              </div>
            </div>
          </div>
        )}

        {activeTab === "style" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Palette className="w-4 h-4 text-primary" /> Brand Colors
                </h3>
              </div>
              <div className="p-4 space-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Primary Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-border shadow-sm flex-shrink-0">
                      <input 
                        type="color" 
                        value={website.style_config.primary || "#2563eb"} 
                        onChange={(e) => updateNested("style_config", "primary", e.target.value)}
                        className="absolute -inset-4 w-20 h-20 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={website.style_config.primary || "#2563eb"} 
                      onChange={(e) => updateNested("style_config", "primary", e.target.value)}
                      className="h-11 font-mono text-base font-bold bg-muted/50 border-border focus:ring-primary focus:border-primary uppercase"
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accent Color</Label>
                  <div className="flex items-center gap-3">
                    <div className="relative w-12 h-12 rounded-xl overflow-hidden border-2 border-border shadow-sm flex-shrink-0">
                      <input 
                        type="color" 
                        value={website.style_config.accent || "#10b981"} 
                        onChange={(e) => updateNested("style_config", "accent", e.target.value)}
                        className="absolute -inset-4 w-20 h-20 cursor-pointer"
                      />
                    </div>
                    <Input 
                      value={website.style_config.accent || "#10b981"} 
                      onChange={(e) => updateNested("style_config", "accent", e.target.value)}
                      className="h-11 font-mono text-base font-bold bg-muted/50 border-border focus:ring-primary focus:border-primary uppercase"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Layout className="w-4 h-4 text-primary" /> Structure
                </h3>
              </div>
              <div className="p-4 space-y-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Border Radius</Label>
                  <select 
                    value={website.style_config.radius || "0.75rem"}
                    onChange={(e) => updateNested("style_config", "radius", e.target.value)}
                    className="w-full h-11 px-4 text-sm font-medium border border-border rounded-xl bg-muted/50 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground shadow-sm"
                  >
                    <option value="0rem">Square (0px)</option>
                    <option value="0.5rem">Subtle (8px)</option>
                    <option value="0.75rem">Modern (12px)</option>
                    <option value="1.5rem">Soft (24px)</option>
                    <option value="9999px">Pill (Fully rounded)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 animate-in slide-in-from-left-2 duration-200">
            
            <div className="card-panel">
              <div className="card-panel-header px-4 py-3 bg-muted/30">
                <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-primary" /> Modules
                </h3>
              </div>
              <div className="p-4 space-y-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">AI Chat Widget</Label>
                    <p className="text-xs text-muted-foreground font-medium">Embed the AI assistant to handle bookings on your public site automatically.</p>
                  </div>
                  <Switch 
                    checked={website.show_chat_widget} 
                    onCheckedChange={(checked) => onChange({ show_chat_widget: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
                
                <div className="h-px bg-border w-full" />
                
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1">
                    <Label className="text-sm font-bold text-foreground">Services Catalog</Label>
                    <p className="text-xs text-muted-foreground font-medium">Display your active services and prices in a beautiful grid layout.</p>
                  </div>
                  <Switch 
                    checked={website.show_services} 
                    onCheckedChange={(checked) => onChange({ show_services: checked })}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </div>

            <div className="card-panel overflow-hidden border-primary/20">
              <div className="card-panel-header px-4 py-3 bg-primary/5">
                <h3 className="font-bold text-sm text-primary flex items-center gap-2">
                  <Share className="w-4 h-4" /> Publication
                </h3>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-bold text-foreground">Live Status</Label>
                    <p className="text-xs text-muted-foreground font-medium">Make your website public and accessible via your custom link.</p>
                  </div>
                  <Switch 
                    checked={website.is_published} 
                    onCheckedChange={onPublishToggle}
                    className="data-[state=checked]:bg-emerald-500 scale-110"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
