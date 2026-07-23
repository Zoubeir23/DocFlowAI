'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Plus, Trash2, Save, ExternalLink, Copy, Check,
  Code2, Palette, MessageSquare, Lightbulb, ChevronDown, ChevronUp,
  Sparkles, Wand2
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { getClinicSettings, updateClinicSettings } from '@/actions/settings'
import { clinicSettingsSchema, type ClinicSettingsInput } from '@/lib/validations'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Skeleton } from '@/components/ui/skeleton'
import { useTranslations } from 'next-intl'

// SUGGESTED_FAQS moved inside component

const PRESET_COLORS = [
  '#0d9488', '#0891b2', '#2563eb', '#7c3aed',
  '#db2777', '#dc2626', '#ea580c', '#16a34a',
]

async function fetchClinicData(): Promise<{ clinic_id: string; clinic: { slug: string } | null } | null> {
  const supabase = createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userData } = await supabase
    .from('users').select('clinic_id, clinic:clinics(slug)').eq('id', user.id).maybeSingle()
  return userData as { clinic_id: string; clinic: { slug: string } | null } | null
}

export default function AISettingsPage() {
  const t = useTranslations('aiSettings')
  
  const SUGGESTED_FAQS = [
    { question: t('faq1Q'), answer: t('faq1A') },
    { question: t('faq2Q'), answer: t('faq2A') },
    { question: t('faq3Q'), answer: t('faq3A') },
    { question: t('faq4Q'), answer: t('faq4A') },
    { question: t('faq5Q'), answer: t('faq5A') },
    { question: t('faq6Q'), answer: t('faq6A') },
    { question: t('faq7Q'), answer: t('faq7A') },
    { question: t('faq8Q'), answer: t('faq8A') },
  ]

  const queryClient = useQueryClient()
  const [faqItems, setFaqItems] = useState<Array<{ question: string; answer: string }>>([])
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [colorInput, setColorInput] = useState('#0d9488')

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const { data: clinicData } = useQuery({ queryKey: ['clinicData'], queryFn: fetchClinicData })
  const clinicId = clinicData?.clinic_id
  const clinicSlug = clinicData?.clinic?.slug

  const { data: settings, isLoading } = useQuery({
    queryKey: ['clinic-settings', clinicId],
    queryFn: () => getClinicSettings(clinicId!),
    enabled: !!clinicId,
  })

  const { register, handleSubmit, setValue, watch } = useForm<ClinicSettingsInput>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: {
      widget_color: '#0d9488',
      welcome_message: t('defaultWelcomeMessage'),
      slot_duration_minutes: 15,
      tone: 'professional and friendly',
      booking_behavior: t('defaultBookingBehavior'),
      faq: [],
    },
  })

  const widgetColor = watch('widget_color')

  useEffect(() => {
    if (settings) {
      setValue('widget_color', settings.widget_color)
      setColorInput(settings.widget_color)
      setValue('welcome_message', settings.welcome_message)
      setValue('slot_duration_minutes', settings.slot_duration_minutes)
      setValue('tone', settings.tone)
      setValue('booking_behavior', settings.booking_behavior)
      setFaqItems((settings.faq as Array<{ question: string; answer: string }>) || [])
    }
  }, [settings, setValue])

  const saveMutation = useMutation({
    mutationFn: (data: ClinicSettingsInput) =>
      updateClinicSettings(clinicId!, { ...data, faq: faqItems }),
    onSuccess: (result) => {
      if (result.success) {
        toast.success(t('settingsSaved'))
        queryClient.invalidateQueries({ queryKey: ['clinic-settings'] })
      } else {
        toast.error(result.error || t('failedToSave'))
      }
    },
  })

  const onSubmit = (data: ClinicSettingsInput) => saveMutation.mutate({ ...data, faq: faqItems })
  const addFaq = () => setFaqItems([...faqItems, { question: '', answer: '' }])
  const removeFaq = (i: number) => setFaqItems(faqItems.filter((_, idx) => idx !== i))
  const updateFaq = (i: number, field: 'question' | 'answer', value: string) => {
    const updated = [...faqItems]
    updated[i] = { ...updated[i], [field]: value }
    setFaqItems(updated)
  }
  const addSuggestedFaq = (faq: { question: string; answer: string }) => {
    const exists = faqItems.some((f) => f.question === faq.question)
    if (!exists) setFaqItems([...faqItems, { ...faq }])
    else toast.info(t('alreadyAdded'))
  }
  const handleColorChange = (color: string) => {
    setColorInput(color)
    setValue('widget_color', color)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-10 space-y-6">
        <Skeleton className="h-16 w-1/3 rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    )
  }

  const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://yourdomain.com'
  const widgetUrl = `${appUrl}/widget/${clinicSlug}`

  const iframeCode = `<!-- DocFlow IA Widget -->
<iframe
  src="${widgetUrl}"
  style="position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:9999;background:transparent;"
  allow="clipboard-write"
></iframe>`

  const scriptCode = `<!-- DocFlow IA Widget -->
<script>
  (function() {
    var iframe = document.createElement('iframe');
    iframe.src = '${widgetUrl}';
    iframe.style.cssText = 'position:fixed;bottom:0;right:0;width:420px;height:680px;border:none;z-index:9999;background:transparent;';
    iframe.allow = 'clipboard-write';
    document.body.appendChild(iframe);
  })();
</script>`

  return (
    <div className="min-h-screen bg-background pb-20">

      {/* ── BOLD HERO HEADER ─────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-card border-b border-border px-6 py-12 lg:px-10 lg:py-16 fade-in-up">
        {/* Subtle background decoration */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-7xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-4 bg-primary/10 px-3 py-1.5 rounded-full border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={2} />
              <span className="font-bold text-xs text-primary uppercase tracking-[0.2em]">{t('title')}</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 text-foreground">
              {t('title')}
            </h1>
            <p className="text-lg text-muted-foreground font-medium">
              {t('subtitle')}
            </p>
          </div>
          
          <Button
            onClick={handleSubmit(onSubmit)}
            disabled={saveMutation.isPending}
            className="btn-primary flex items-center gap-2 flex-shrink-0 bg-primary hover:bg-primary/90 text-primary-foreground border-none"
          >
            <Save className="w-5 h-5" />
            {saveMutation.isPending ? t('saving') : t('saveSettings')}
          </Button>
        </div>
      </div>

      <div className="p-6 lg:p-10 max-w-7xl mx-auto space-y-10 fade-in-up" style={{ animationDelay: '0.1s' }}>
        
        {/* Integration Code Card */}
        {clinicSlug && (
          <div className="card-panel">
            <div className="card-panel-header">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-lg">{t('embedOnWebsite')}</h3>
                  <p className="text-sm text-muted-foreground">{t('embedDescription')} <code className="bg-muted px-1.5 py-0.5 rounded-lg text-xs font-mono">&lt;/body&gt;</code> {t('tag')}</p>
                </div>
              </div>
              <a href={`/widget/${clinicSlug}`} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="h-10 rounded-xl border-border font-bold">
                  <ExternalLink className="w-4 h-4 mr-2" />{t('preview')}
                </Button>
              </a>
            </div>
            
            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Option 1 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground flex items-center gap-2">
                      {t('option1Title')}
                      <span className="text-[10px] font-bold text-primary bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                        {t('recommended')}
                      </span>
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">{t('option1Desc')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg border-border" onClick={() => copyToClipboard(iframeCode, 'iframe')}>
                    {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <pre className="bg-muted/30 border border-border text-foreground text-xs rounded-2xl p-5 overflow-x-auto whitespace-pre font-mono shadow-inner">
                  {iframeCode}
                </pre>
              </div>

              {/* Option 2 */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-foreground">{t('option2Title')}</h4>
                    <p className="text-xs text-muted-foreground mt-1">{t('option2Desc')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-8 rounded-lg border-border" onClick={() => copyToClipboard(scriptCode, 'script')}>
                    {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <pre className="bg-muted/30 border border-border text-foreground text-xs rounded-2xl p-5 overflow-x-auto whitespace-pre font-mono shadow-inner">
                  {scriptCode}
                </pre>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* Main settings column */}
          <div className="xl:col-span-2 space-y-8">
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Wand2 className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{t('chatbotPersonality')}</h3>
                    <p className="text-sm text-muted-foreground">{t('personalityDesc')}</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-8">
                
                {/* Tone & Duration Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-foreground">{t('slotDuration')}</Label>
                    <select
                      className="w-full h-12 px-4 text-base font-medium border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground shadow-sm"
                      {...register('slot_duration_minutes', { valueAsNumber: true })}
                    >
                      {[5, 10, 15, 20, 30, 45, 60].map((d) => (
                        <option key={d} value={d}>{d} {t('minutes')}</option>
                      ))}
                    </select>
                    <p className="text-xs text-muted-foreground font-medium">{t('intervalDesc')}</p>
                  </div>
                  <div className="space-y-3">
                    <Label className="text-sm font-bold text-foreground">{t('tone')}</Label>
                    <select
                      className="w-full h-12 px-4 text-base font-medium border border-border rounded-xl bg-card focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground shadow-sm"
                      {...register('tone')}
                    >
                      <option value="professional and friendly">{t('tones.professional')} & {t('tones.friendly')}</option>
                      <option value="formal and clinical">{t('tones.formal')} & Clinical</option>
                      <option value="warm and empathetic">Warm & Empathetic</option>
                      <option value="concise and efficient">Concise & Efficient</option>
                      <option value="casual and approachable">{t('tones.casual')} & Approachable</option>
                    </select>
                    <p className="text-xs text-muted-foreground font-medium">{t('toneDesc')}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground">{t('welcomeMessage')}</Label>
                  <Textarea
                    placeholder={t('defaultWelcomeMessage')}
                    rows={2}
                    className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none font-medium text-base shadow-sm p-4"
                    {...register('welcome_message')}
                  />
                  <p className="text-xs text-muted-foreground font-medium">{t('welcomeDesc')}</p>
                </div>

                <div className="space-y-3">
                  <Label className="text-sm font-bold text-foreground">{t('behaviorInstructions')}</Label>
                  <Textarea
                    placeholder={t('defaultBookingBehavior')}
                    rows={4}
                    className="rounded-xl border-border focus:ring-primary focus:border-primary resize-none font-medium text-base shadow-sm p-4"
                    {...register('booking_behavior')}
                  />
                  <p className="text-xs text-muted-foreground font-medium">{t('behaviorDesc')}</p>
                </div>
              </div>
            </div>

            {/* FAQs */}
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-lg">{t('faqTitle')}</h3>
                    <p className="text-sm text-muted-foreground">{t('faqDesc')}</p>
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={addFaq}
                  className="h-10 btn-secondary font-bold"
                >
                  <Plus className="w-4 h-4 mr-2" /> {t('addFaq')}
                </Button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Suggested FAQs */}
                <div className="rounded-2xl border border-primary/20 bg-primary/5 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowSuggestions(!showSuggestions)}
                    className="w-full flex items-center justify-between px-6 py-4 text-sm font-bold text-primary hover:text-primary/80 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Lightbulb className="w-4 h-4" />
                      {t('suggestedFaqs')}
                    </span>
                    {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  {showSuggestions && (
                    <div className="px-6 pb-6 space-y-3 border-t border-primary/10 pt-4">
                      {SUGGESTED_FAQS.map((faq, i) => {
                        const alreadyAdded = faqItems.some((f) => f.question === faq.question)
                        return (
                          <div
                            key={i}
                            className={`flex items-start justify-between gap-4 p-4 rounded-xl border bg-card transition-all ${alreadyAdded ? 'opacity-50 border-border' : 'border-border shadow-sm'}`}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-foreground">{faq.question}</p>
                              <p className="text-xs font-medium text-muted-foreground mt-1 truncate">{faq.answer}</p>
                            </div>
                            <Button
                              type="button"
                              onClick={() => addSuggestedFaq(faq)}
                              disabled={alreadyAdded}
                              size="sm"
                              className={`flex-shrink-0 h-8 text-xs font-bold rounded-lg ${
                                alreadyAdded ? 'bg-muted text-muted-foreground border-none' : 'bg-primary text-primary-foreground'
                              }`}
                            >
                              {alreadyAdded ? t('addedBtn') : `+ ${t('addBtn')}`}
                            </Button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>

                {/* Current FAQs */}
                {faqItems.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed border-border rounded-2xl">
                    <div className="w-16 h-16 rounded-2xl bg-muted border border-border flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <p className="text-lg font-bold text-foreground mb-1">{t('faqTitle')}</p>
                    <p className="text-sm text-muted-foreground font-medium">{t('faqDesc')}</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={index} className="p-5 border border-border rounded-2xl space-y-4 bg-muted/10">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-primary bg-primary/10 border border-primary/20 px-3 py-1 rounded-full uppercase tracking-wider">FAQ #{index + 1}</span>
                          <button
                            type="button"
                            onClick={() => removeFaq(index)}
                            className="text-xs font-bold text-destructive hover:bg-destructive/10 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> {t('removeFaq')}
                          </button>
                        </div>
                        <div className="space-y-3">
                          <Input
                            placeholder={t('question')}
                            value={item.question}
                            onChange={(e) => updateFaq(index, 'question', e.target.value)}
                            className="h-12 bg-card rounded-xl border-border focus:ring-primary focus:border-primary font-medium text-base shadow-sm"
                          />
                          <Textarea
                            placeholder={t('answer')}
                            rows={3}
                            value={item.answer}
                            onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                            className="bg-card rounded-xl border-border focus:ring-primary focus:border-primary resize-none font-medium text-base shadow-sm p-4"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="card-panel">
              <div className="card-panel-header">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-lg">{t('widgetColor')}</h3>
                </div>
              </div>
              <div className="p-6 space-y-6">
                
                {/* Preview bubble */}
                <div className="relative h-32 bg-muted/30 rounded-2xl border border-border overflow-hidden mb-6">
                  <div
                    className="absolute bottom-4 right-4 flex items-center gap-2 px-5 py-3 rounded-full text-white text-sm font-bold shadow-lg transform hover:scale-105 transition-transform"
                    style={{ backgroundColor: widgetColor || colorInput }}
                  >
                    <MessageSquare className="w-5 h-5" />
                    Chat
                  </div>
                </div>

                <div className="space-y-4">
                  <Label className="text-sm font-bold text-foreground">{t('brandColor')}</Label>
                  <div className="flex items-center gap-4">
                    <div
                      className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-inner border border-border"
                      style={{ backgroundColor: widgetColor || colorInput }}
                    />
                    <div className="flex-1 space-y-3">
                      <div className="flex gap-3">
                        <input
                          type="color"
                          value={colorInput}
                          onChange={(e) => handleColorChange(e.target.value)}
                          className="w-12 h-12 p-0.5 rounded-xl border border-border cursor-pointer bg-card"
                        />
                        <Input
                          value={colorInput}
                          onInput={(e) => handleColorChange((e.target as HTMLInputElement).value)}
                          placeholder="#0d9488"
                          className="flex-1 h-12 font-mono text-base font-bold rounded-xl border-border focus:ring-primary focus:border-primary shadow-sm"
                          {...register('widget_color')}
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-border">
                    <Label className="text-sm font-bold text-foreground block mb-3">{t('presetColors')}</Label>
                    <div className="flex gap-2 flex-wrap">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => handleColorChange(color)}
                          className="w-10 h-10 rounded-xl transition-all hover:scale-110 shadow-sm"
                          style={{
                            backgroundColor: color,
                            border: colorInput === color ? '3px solid white' : '1px solid rgba(0,0,0,0.1)',
                            boxShadow: colorInput === color ? `0 0 0 3px ${color}` : 'none',
                          }}
                          title={color}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <Button
              type="submit"
              className="w-full h-14 btn-primary text-base"
              disabled={saveMutation.isPending}
            >
              <Save className="w-5 h-5 mr-2" />
              {saveMutation.isPending ? t('saving') : t('saveSettings')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
