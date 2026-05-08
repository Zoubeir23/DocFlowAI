'use client'

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  Plus, Trash2, Bot, Globe, Save, ExternalLink, Copy, Check,
  Code2, Palette, MessageSquare, Lightbulb, ChevronDown, ChevronUp,
  Sparkles, Activity,
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

const SUGGESTED_FAQS = [
  { question: 'What are your clinic hours?', answer: 'We are open Monday to Friday, 9:00 AM – 5:00 PM.' },
  { question: 'How do I book an appointment?', answer: 'You can book directly through this chat by telling me your preferred date and service.' },
  { question: 'Do you accept walk-ins?', answer: 'We prefer appointments but accept walk-ins based on availability.' },
  { question: 'What insurance plans do you accept?', answer: 'We accept most major insurance plans. Please contact us for specific inquiries.' },
  { question: 'How do I cancel or reschedule an appointment?', answer: 'You can cancel or reschedule through this chat at least 24 hours in advance.' },
  { question: 'Is parking available?', answer: 'Yes, free parking is available at our clinic.' },
  { question: 'How long does a consultation take?', answer: 'A general consultation typically takes 30 minutes. Specialist visits may take longer.' },
  { question: 'Do you offer video consultations?', answer: 'Yes, we offer video consultations. You can book one through this chat.' },
]

const PRESET_COLORS = [
  '#0d9488', '#0891b2', '#2563eb', '#7c3aed',
  '#db2777', '#dc2626', '#ea580c', '#16a34a',
]

async function fetchClinicData(): Promise<{ clinic_id: string; clinic: { slug: string } | null } | null> {
  const supabase = createClient() as any
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const { data: userData } = await supabase
    .from('users').select('clinic_id, clinic:clinics(slug)').eq('id', user.id).single()
  return userData as { clinic_id: string; clinic: { slug: string } | null } | null
}

export default function AISettingsPage() {
  const t = useTranslations('aiSettings')
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

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<ClinicSettingsInput>({
    resolver: zodResolver(clinicSettingsSchema),
    defaultValues: {
      widget_color: '#0d9488',
      welcome_message: "Hello! I'm your AI booking assistant. How can I help you today?",
      slot_duration_minutes: 15,
      tone: 'professional and friendly',
      booking_behavior: 'Guide patients through booking smoothly. Always suggest the nearest available slot.',
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
      <div className="p-6 space-y-4 max-w-[1400px]">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-28 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
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
    <div className="p-6 space-y-6 max-w-[1400px]">

      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-primary/10 text-primary flex items-center justify-center">
          <Bot className="w-4 h-4 text-foreground" />
        </div>
        <div>
          <h2 className="text-2xl font-medium text-foreground tracking-tight">{t('title')}</h2>
          <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
        </div>
      </div>

      {/* Widget URL banner */}
      {clinicSlug && (
        <>
          <div className="glass-card rounded-lg p-4">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                  <Globe className="w-4 h-4 text-foreground" />
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('widgetUrl')}</p>
                  <p className="text-sm text-teal-700 font-mono mt-0.5 break-all">{widgetUrl}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="rounded-lg border-border text-muted-foreground hover:bg-primary/[0.03] hover:border-primary/40 hover:text-teal-700 font-medium text-xs"
                  onClick={() => copyToClipboard(widgetUrl, 'url')}
                >
                  {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                  {copiedKey === 'url' ? t('copied') : t('copyUrl')}
                </Button>
                <a href={`/widget/${clinicSlug}`} target="_blank" rel="noopener noreferrer">
                  <Button size="sm" variant="outline" className="rounded-lg border-border text-muted-foreground hover:bg-primary/[0.03] hover:border-primary/40 hover:text-teal-700 font-medium text-xs">
                    <ExternalLink className="w-3.5 h-3.5 mr-1.5" />{t('preview')}
                  </Button>
                </a>
              </div>
            </div>
          </div>

          {/* Embed code card */}
          <div className="glass-card rounded-lg overflow-hidden">
            <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
              <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                <Code2 className="w-3.5 h-3.5 text-foreground" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{t('embedOnWebsite')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t('embedDescription')}{' '}
                  <code className="bg-muted px-1 rounded text-xs font-mono">&lt;/body&gt;</code> {t('tag')}
                </p>
              </div>
            </div>
            <div className="p-5 space-y-5">
              {/* Option 1 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {t('option1Title')}{' '}
                      <span className="text-xs font-medium text-teal-700 bg-teal-50 border border-border px-2 py-0.5 rounded-full ml-1">
                        {t('recommended')}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('option1Desc')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg border-border text-muted-foreground hover:bg-primary/[0.03] hover:text-teal-700 font-medium text-xs" onClick={() => copyToClipboard(iframeCode, 'iframe')}>
                    {copiedKey === 'iframe' ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copiedKey === 'iframe' ? t('copied') : t('copy')}
                  </Button>
                </div>
                <pre className="bg-muted/50 border border-border text-foreground text-xs rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono">
                  {iframeCode}
                </pre>
              </div>

              {/* Option 2 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t('option2Title')}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t('option2Desc')}</p>
                  </div>
                  <Button size="sm" variant="outline" className="rounded-lg border-border text-muted-foreground hover:bg-primary/[0.03] hover:text-teal-700 font-medium text-xs" onClick={() => copyToClipboard(scriptCode, 'script')}>
                    {copiedKey === 'script' ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
                    {copiedKey === 'script' ? t('copied') : t('copy')}
                  </Button>
                </div>
                <pre className="bg-muted/50 border border-border text-foreground text-xs rounded-lg p-4 overflow-x-auto whitespace-pre leading-relaxed font-mono">
                  {scriptCode}
                </pre>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-100 p-3 text-xs text-amber-700 flex items-start gap-2">
                <Sparkles className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-amber-500" />
                <span>
                  The widget is linked to your slug{' '}
                  <code className="bg-amber-100 px-1 rounded font-mono">{clinicSlug}</code>.
                  Update this code if you ever change your slug.
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Widget Appearance */}
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="flex items-center gap-2.5 px-6 py-4 border-b border-border">
            <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
              <Palette className="w-3.5 h-3.5 text-violet-600" />
            </div>
            <div>
              <h3 className="font-medium text-foreground text-sm">{t('widgetColor')}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{t('personalityDesc')}</p>
            </div>
          </div>
          <div className="p-6 space-y-6">

            {/* Color picker */}
            <div className="space-y-3">
              <Label className="text-sm font-medium text-foreground">{t('widgetColor')}</Label>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-lg flex-shrink-0  ring-4 ring-white"
                  style={{ backgroundColor: widgetColor || colorInput }}
                />
                <div className="flex-1 space-y-2.5">
                  <div className="flex gap-2.5">
                    <input
                      type="color"
                      value={colorInput}
                      onChange={(e) => handleColorChange(e.target.value)}
                      className="w-10 h-10 p-0.5 rounded-lg border border-border cursor-pointer bg-background"
                    />
                    <Input
                      value={colorInput}
                      onInput={(e) => handleColorChange((e.target as HTMLInputElement).value)}
                      placeholder="#0d9488"
                      className="flex-1 font-mono text-sm rounded-lg border-border focus:ring-primary focus:border-primary"
                      {...register('widget_color')}
                    />
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {PRESET_COLORS.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => handleColorChange(color)}
                        className="w-7 h-7 rounded-lg border-2 transition-all hover:scale-110"
                        style={{
                          backgroundColor: color,
                          borderColor: colorInput === color ? 'white' : 'transparent',
                          boxShadow: colorInput === color ? `0 0 0 2.5px ${color}` : 'none',
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Preview bubble */}
            <div className="space-y-2">
              <Label className="text-sm font-medium text-foreground">{t('preview')}</Label>
              <div className="relative h-20 bg-background rounded-lg border border-border overflow-hidden">
                <div
                  className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full text-foreground text-sm font-medium "
                  style={{ backgroundColor: widgetColor || colorInput }}
                >
                  <MessageSquare className="w-4 h-4" />
                  Book Appointment
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">{t('slotDuration')}</Label>
                <select
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  {...register('slot_duration_minutes', { valueAsNumber: true })}
                >
                  {[5, 10, 15, 20, 30, 45, 60].map((d) => (
                    <option key={d} value={d}>{d} {t('minutes')}</option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">Interval between available booking slots</p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm font-medium text-foreground">{t('tone')}</Label>
                <select
                  className="w-full h-10 px-3 text-sm border border-border rounded-lg bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-foreground"
                  {...register('tone')}
                >
                  <option value="professional and friendly">Professional & Friendly</option>
                  <option value="formal and clinical">Formal & Clinical</option>
                  <option value="warm and empathetic">Warm & Empathetic</option>
                  <option value="concise and efficient">Concise & Efficient</option>
                  <option value="casual and approachable">Casual & Approachable</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t('welcomeMessage')}</Label>
              <Textarea
                placeholder="Hello! I'm your AI booking assistant. How can I help you today?"
                rows={2}
                className="rounded-lg border-border focus:ring-primary focus:border-primary resize-none"
                {...register('welcome_message')}
              />
              <p className="text-xs text-muted-foreground">First message patients see when they open the widget</p>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-foreground">{t('behaviorInstructions')}</Label>
              <Textarea
                placeholder="Guide patients through booking smoothly. Always suggest the nearest available slot."
                rows={3}
                className="rounded-lg border-border focus:ring-primary focus:border-primary resize-none"
                {...register('booking_behavior')}
              />
              <p className="text-xs text-muted-foreground">Tell the AI how to handle bookings — e.g. ask reason of visit, offer nearest slot, etc.</p>
            </div>
          </div>
        </div>

        {/* FAQ Responses */}
        <div className="glass-card rounded-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-teal-50 flex items-center justify-center">
                <MessageSquare className="w-3.5 h-3.5 text-teal-600" />
              </div>
              <div>
                <h3 className="font-medium text-foreground text-sm">{t('faqTitle')}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{t('faqDesc')}</p>
              </div>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addFaq}
              className="rounded-lg border-border text-muted-foreground hover:bg-primary/[0.03] hover:border-primary/40 hover:text-teal-700 font-medium text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('addFaq')}
            </Button>
          </div>
          <div className="p-5 space-y-4">

            {/* Suggested FAQs */}
            <div className="rounded-lg border border-border bg-teal-50/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowSuggestions(!showSuggestions)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-teal-700 hover:text-teal-800 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-teal-500" />
                  {t('suggestedFaqs')}
                </span>
                {showSuggestions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
              {showSuggestions && (
                <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
                  {SUGGESTED_FAQS.map((faq, i) => {
                    const alreadyAdded = faqItems.some((f) => f.question === faq.question)
                    return (
                      <div
                        key={i}
                        className={`flex items-start justify-between gap-3 p-3 rounded-lg border bg-background transition-all ${alreadyAdded ? 'opacity-50 border-border' : 'border-border hover:border-primary/50 hover:'}`}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{faq.question}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 truncate">{faq.answer}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addSuggestedFaq(faq)}
                          disabled={alreadyAdded}
                          className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                            alreadyAdded
                              ? 'bg-muted text-muted-foreground cursor-not-allowed'
                              : 'gradient-brand text-foreground hover:opacity-90 '
                          }`}
                        >
                          {alreadyAdded ? 'Added' : '+ Add'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Current FAQs */}
            {faqItems.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="w-12 h-12 rounded-lg bg-background border border-border flex items-center justify-center mx-auto mb-3">
                  <MessageSquare className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">No FAQs added yet</p>
                <p className="text-xs mt-0.5">Use the suggestions above or click "Add FAQ"</p>
              </div>
            ) : (
              <div className="space-y-3">
                {faqItems.map((item, index) => (
                  <div key={index} className="p-4 border border-border rounded-lg space-y-3 bg-background/40 hover:bg-background transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">FAQ #{index + 1}</span>
                      <button
                        type="button"
                        onClick={() => removeFaq(index)}
                        className="text-xs text-red-400 hover:text-red-600 flex items-center gap-1 hover:bg-red-50 px-2 py-1 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> {t('removeFaq')}
                      </button>
                    </div>
                    <div className="space-y-2">
                      <Input
                        placeholder="Question (e.g. What are your hours?)"
                        value={item.question}
                        onChange={(e) => updateFaq(index, 'question', e.target.value)}
                        className="bg-background rounded-lg border-border focus:ring-primary focus:border-primary"
                      />
                      <Textarea
                        placeholder="Answer..."
                        rows={2}
                        value={item.answer}
                        onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                        className="bg-background rounded-lg border-border focus:ring-primary focus:border-primary resize-none"
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Save bar */}
        <div className="flex items-center justify-between pt-1">
          <p className="text-xs text-muted-foreground font-medium">
            {faqItems.length} FAQ{faqItems.length !== 1 ? 's' : ''} configured
          </p>
          <Button
            type="submit"
            className="bg-primary text-primary-foreground font-medium px-6"
            disabled={saveMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? t('saving') : t('saveSettings')}
          </Button>
        </div>
      </form>
    </div>
  )
}
