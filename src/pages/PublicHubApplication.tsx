import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Globe, Building2, Rocket, Users, Shield, Award, CheckCircle2 } from 'lucide-react';
import sfhLogo from '@/assets/sfh-logo-sphere.png';

const ROLE_OPTIONS = [
  'Founder / Entrepreneur',
  'Investor / VC / Angel',
  'Government / Public Sector',
  'University / Research Institution',
  'Corporate Innovation / Executive',
  'Accelerator / Ecosystem Builder',
  'Other',
];

const EXPERIENCE_OPTIONS = ['0–3', '4–7', '8–15', '15+'];

const ECOSYSTEM_OPTIONS = [
  'Very strong — active network of founders, investors, and institutions',
  'Strong — regular engagement with ecosystem leaders',
  'Moderate — relationships developing',
  'Early — limited connections',
];

const STAKEHOLDER_OPTIONS = [
  'Government agencies',
  'Universities or research labs',
  'Angel investors or venture capital',
  'Corporations or industry groups',
  'Founder communities',
  'None yet',
];

const STARTUP_ESTIMATE_OPTIONS = ['0–10', '10–25', '25–50', '50+'];
const TIMELINE_OPTIONS = ['0–3 months', '3–6 months', '6–12 months', '12+ months'];

const TEAM_OPTIONS = [
  'Established leadership team ready',
  'One or two committed partners',
  'Recruiting in progress',
  'Solo leader at this stage',
];

const MOTIVATION_OPTIONS = [
  'Build a leading innovation ecosystem in my region',
  'Support founders and entrepreneurship',
  'Create venture and investment opportunities',
  'Partner with government or institutions',
  'Expand existing innovation initiatives',
  'Other',
];

const AMBITION_OPTIONS = [
  'City-level impact',
  'National innovation leadership',
  'Regional multi-country expansion',
  'Global ecosystem leadership',
];

const FRAMEWORK_OPTIONS = [
  'Fully prepared to proceed if selected',
  'Open to reviewing full terms during the interview stage',
  'Not ready at this time',
];

const LEADERSHIP_STYLE_OPTIONS = [
  'Builder — execution focused',
  'Connector — partnership driven',
  'Strategist — ecosystem and long-term vision',
  'Operator — program and team management',
  'Hybrid leadership approach',
];

const STRENGTH_OPTIONS = [
  'Capital or investor access',
  'Government or institutional relationships',
  'Founder community leadership',
  'Operational execution capability',
  'Corporate or industry network',
];

const ONBOARDING_OPTIONS = ['Immediately', 'Within 30 days', 'Within 90 days', 'Later than 90 days'];
const COMMITMENT_OPTIONS = ['Yes', 'No', 'Unsure'];

export default function PublicHubApplication() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentSection, setCurrentSection] = useState(0);

  const [form, setForm] = useState({
    full_name: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    linkedin_url: '',
    primary_role: '',
    years_experience: '',
    ecosystem_strength: '',
    stakeholders: [] as string[],
    estimated_startups: '',
    launch_timeline: '',
    team_status: '',
    primary_motivation: '',
    long_term_ambition: '',
    global_framework_readiness: '',
    leadership_style: '',
    greatest_strength: '',
    onboarding_timeline: '',
    three_year_commitment: '',
    digital_signature: '',
    declaration_accepted: false,
  });

  const sections = [
    { title: 'Applicant Profile', icon: Users, number: 1 },
    { title: 'Ecosystem Access', icon: Globe, number: 2 },
    { title: 'Operational Readiness', icon: Building2, number: 3 },
    { title: 'Strategic Alignment', icon: Rocket, number: 4 },
    { title: 'Global Structure', icon: Shield, number: 5 },
    { title: 'Leadership Readiness', icon: Award, number: 6 },
    { title: 'Final Commitment', icon: CheckCircle2, number: 7 },
  ];

  const handleStakeholderToggle = (value: string) => {
    setForm(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.includes(value)
        ? prev.stakeholders.filter(s => s !== value)
        : [...prev.stakeholders, value],
    }));
  };

  const handleSubmit = async () => {
    if (!form.declaration_accepted) {
      toast({ title: 'Please accept the declaration', variant: 'destructive' });
      return;
    }
    if (!form.digital_signature.trim()) {
      toast({ title: 'Please provide your digital signature', variant: 'destructive' });
      return;
    }

    setLoading(true);
    try {
      const { declaration_accepted, ...submitData } = form;
      const { error } = await supabase.from('hub_applications' as any).insert(submitData as any);

      if (error) throw error;

      setSubmitted(true);
      toast({ title: 'Application submitted successfully!' });
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast({ title: 'Failed to submit application', description: error.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (currentSection) {
      case 0:
        return form.full_name && form.email && form.phone && form.city && form.country && form.linkedin_url && form.primary_role && form.years_experience;
      case 1:
        return form.ecosystem_strength && form.estimated_startups;
      case 2:
        return form.launch_timeline && form.team_status;
      case 3:
        return form.primary_motivation && form.long_term_ambition;
      case 4:
        return form.global_framework_readiness;
      case 5:
        return form.leadership_style && form.greatest_strength;
      case 6:
        return form.onboarding_timeline && form.three_year_commitment && form.digital_signature && form.declaration_accepted;
      default:
        return false;
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-lg text-center space-y-6">
          <div className="h-20 w-20 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
          </div>
          <h1 className="text-3xl font-bold">Application Submitted</h1>
          <p className="text-muted-foreground">
            Thank you for your interest in becoming a Startup Factory Hub Chapter Leader. Selected applicants will be invited to a leadership interview, regional ecosystem evaluation, and licensing review.
          </p>
          <Button onClick={() => window.location.href = '/'} variant="outline">
            Return to Homepage
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-background via-primary/5 to-background border-b border-border">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, hsl(var(--primary)) 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center relative z-10">
          <img src={sfhLogo} alt="Startup Factory Hub" className="h-16 w-16 mx-auto mb-6 rounded-full" />
          <h1 className="text-3xl md:text-4xl font-bold mb-2">STARTUP FACTORY HUB</h1>
          <p className="text-lg text-primary font-semibold mb-4">GLOBAL HUB OWNER / CHAPTER LEADER APPLICATION</p>
          <p className="text-muted-foreground max-w-2xl mx-auto text-sm leading-relaxed">
            Startup Factory Hub is expanding internationally through a selective network of licensed Hub Owners and Chapter Leaders committed to building world-class innovation ecosystems in their regions.
          </p>
          <div className="mt-6 p-4 rounded-lg bg-primary/5 border border-primary/10 max-w-xl mx-auto">
            <p className="text-xs text-muted-foreground">
              Completion of this application does not guarantee selection. Only a limited number of leaders are approved per region.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Progress */}
        <div className="flex items-center justify-between mb-10 overflow-x-auto pb-2">
          {sections.map((s, i) => (
            <button
              key={i}
              onClick={() => i <= currentSection && setCurrentSection(i)}
              className={`flex flex-col items-center gap-1 min-w-[70px] transition-all ${
                i === currentSection ? 'opacity-100' : i < currentSection ? 'opacity-70 cursor-pointer' : 'opacity-30 cursor-not-allowed'
              }`}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i < currentSection ? 'bg-emerald-500 text-white' : i === currentSection ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
              }`}>
                {i < currentSection ? '✓' : s.number}
              </div>
              <span className="text-[10px] text-muted-foreground text-center leading-tight hidden sm:block">{s.title}</span>
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="rounded-xl border border-border bg-card p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3 mb-2">
            {(() => { const Icon = sections[currentSection].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
            <h2 className="text-xl font-bold">Section {sections[currentSection].number} — {sections[currentSection].title}</h2>
          </div>

          {/* Section 1 - Applicant Profile */}
          {currentSection === 0 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Full Name *</Label>
                  <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                </div>
                <div className="space-y-2">
                  <Label>Email Address *</Label>
                  <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="your@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Phone Number *</Label>
                  <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+1 (555) 000-0000" />
                </div>
                <div className="space-y-2">
                  <Label>LinkedIn Profile URL *</Label>
                  <Input value={form.linkedin_url} onChange={e => setForm(p => ({ ...p, linkedin_url: e.target.value }))} placeholder="https://linkedin.com/in/..." />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City of Proposed Hub *</Label>
                  <Input value={form.city} onChange={e => setForm(p => ({ ...p, city: e.target.value }))} placeholder="City name" />
                </div>
                <div className="space-y-2">
                  <Label>Country *</Label>
                  <Input value={form.country} onChange={e => setForm(p => ({ ...p, country: e.target.value }))} placeholder="Country" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">Applications without a valid LinkedIn profile will not be reviewed.</p>

              <div className="space-y-3">
                <Label>Current Primary Role *</Label>
                <RadioGroup value={form.primary_role} onValueChange={v => setForm(p => ({ ...p, primary_role: v }))}>
                  {ROLE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`role-${opt}`} />
                      <Label htmlFor={`role-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Years of Leadership or Professional Experience *</Label>
                <RadioGroup value={form.years_experience} onValueChange={v => setForm(p => ({ ...p, years_experience: v }))}>
                  {EXPERIENCE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`exp-${opt}`} />
                      <Label htmlFor={`exp-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 2 - Ecosystem Access */}
          {currentSection === 1 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>Strength of your connection to the local startup ecosystem *</Label>
                <RadioGroup value={form.ecosystem_strength} onValueChange={v => setForm(p => ({ ...p, ecosystem_strength: v }))}>
                  {ECOSYSTEM_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`eco-${opt}`} />
                      <Label htmlFor={`eco-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Stakeholders you can directly engage within 90 days (select all that apply)</Label>
                {STAKEHOLDER_OPTIONS.map(opt => (
                  <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={form.stakeholders.includes(opt)}
                      onCheckedChange={() => handleStakeholderToggle(opt)}
                      id={`stake-${opt}`}
                    />
                    <Label htmlFor={`stake-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                  </div>
                ))}
              </div>

              <div className="space-y-3">
                <Label>Estimated number of startups you could activate in the first 12 months *</Label>
                <RadioGroup value={form.estimated_startups} onValueChange={v => setForm(p => ({ ...p, estimated_startups: v }))}>
                  {STARTUP_ESTIMATE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`startups-${opt}`} />
                      <Label htmlFor={`startups-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 3 - Operational Readiness */}
          {currentSection === 2 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>Expected timeline to launch your local chapter after approval *</Label>
                <RadioGroup value={form.launch_timeline} onValueChange={v => setForm(p => ({ ...p, launch_timeline: v }))}>
                  {TIMELINE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`tl-${opt}`} />
                      <Label htmlFor={`tl-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Local leadership or support team status *</Label>
                <RadioGroup value={form.team_status} onValueChange={v => setForm(p => ({ ...p, team_status: v }))}>
                  {TEAM_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`team-${opt}`} />
                      <Label htmlFor={`team-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 4 - Strategic Alignment */}
          {currentSection === 3 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>Primary motivation to launch a Startup Factory Hub *</Label>
                <RadioGroup value={form.primary_motivation} onValueChange={v => setForm(p => ({ ...p, primary_motivation: v }))}>
                  {MOTIVATION_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`mot-${opt}`} />
                      <Label htmlFor={`mot-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Long-term ambition for your Hub *</Label>
                <RadioGroup value={form.long_term_ambition} onValueChange={v => setForm(p => ({ ...p, long_term_ambition: v }))}>
                  {AMBITION_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`amb-${opt}`} />
                      <Label htmlFor={`amb-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 5 - Global Structure */}
          {currentSection === 4 && (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-muted/50 border border-border space-y-2">
                <p className="text-sm font-medium">Startup Factory Hub chapters operate under a licensed global structure that includes:</p>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc pl-5">
                  <li>Official chapter registration under the Startup Factory Hub brand</li>
                  <li>Access to the global software platform and operating system</li>
                  <li>Ongoing brand, program, and ecosystem support</li>
                  <li>Revenue-sharing alignment with the global network</li>
                  <li>Long-term leadership commitment to regional ecosystem growth</li>
                </ul>
              </div>

              <div className="space-y-3">
                <Label>Please indicate your readiness to operate within this licensed global framework *</Label>
                <RadioGroup value={form.global_framework_readiness} onValueChange={v => setForm(p => ({ ...p, global_framework_readiness: v }))}>
                  {FRAMEWORK_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`fw-${opt}`} />
                      <Label htmlFor={`fw-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 6 - Leadership Readiness */}
          {currentSection === 5 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>Leadership style that best describes you *</Label>
                <RadioGroup value={form.leadership_style} onValueChange={v => setForm(p => ({ ...p, leadership_style: v }))}>
                  {LEADERSHIP_STYLE_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`ls-${opt}`} />
                      <Label htmlFor={`ls-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Greatest strength you bring to launching a regional hub *</Label>
                <RadioGroup value={form.greatest_strength} onValueChange={v => setForm(p => ({ ...p, greatest_strength: v }))}>
                  {STRENGTH_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`str-${opt}`} />
                      <Label htmlFor={`str-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Section 7 - Final Commitment */}
          {currentSection === 6 && (
            <div className="space-y-5">
              <div className="space-y-3">
                <Label>If selected, when could you begin onboarding? *</Label>
                <RadioGroup value={form.onboarding_timeline} onValueChange={v => setForm(p => ({ ...p, onboarding_timeline: v }))}>
                  {ONBOARDING_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`ob-${opt}`} />
                      <Label htmlFor={`ob-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="space-y-3">
                <Label>Are you prepared to lead your chapter for a minimum of three years? *</Label>
                <RadioGroup value={form.three_year_commitment} onValueChange={v => setForm(p => ({ ...p, three_year_commitment: v }))}>
                  {COMMITMENT_OPTIONS.map(opt => (
                    <div key={opt} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                      <RadioGroupItem value={opt} id={`com-${opt}`} />
                      <Label htmlFor={`com-${opt}`} className="cursor-pointer text-sm">{opt}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5 space-y-3">
                <h3 className="font-semibold text-sm">DECLARATION</h3>
                <p className="text-xs text-muted-foreground">By submitting this application, I confirm that:</p>
                <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-5">
                  <li>All information provided is accurate</li>
                  <li>I am applying to become an official Startup Factory Hub Chapter Leader</li>
                  <li>I understand that selection is competitive and limited by region</li>
                  <li>Final approval is subject to interview and licensing review</li>
                </ul>
                <div className="flex items-center gap-3 pt-2">
                  <Checkbox
                    checked={form.declaration_accepted}
                    onCheckedChange={(c) => setForm(p => ({ ...p, declaration_accepted: c as boolean }))}
                    id="declaration"
                  />
                  <Label htmlFor="declaration" className="cursor-pointer text-sm">I accept the above declaration</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Digital Signature *</Label>
                <Input value={form.digital_signature} onChange={e => setForm(p => ({ ...p, digital_signature: e.target.value }))} placeholder="Type your full name as digital signature" />
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <Button
              variant="outline"
              onClick={() => setCurrentSection(s => s - 1)}
              disabled={currentSection === 0}
            >
              Previous
            </Button>
            {currentSection < sections.length - 1 ? (
              <Button onClick={() => setCurrentSection(s => s + 1)} disabled={!canProceed()}>
                Next Section
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={loading || !canProceed()}>
                {loading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Submitting...</> : 'Submit Application'}
              </Button>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="mt-10 p-6 rounded-xl border border-border bg-card">
          <h3 className="font-semibold mb-3">Next Step in the Selection Process</h3>
          <p className="text-sm text-muted-foreground mb-3">Selected applicants will be invited to:</p>
          <ol className="text-sm text-muted-foreground space-y-1 list-decimal pl-5">
            <li>Leadership interview</li>
            <li>Regional ecosystem evaluation</li>
            <li>Licensing and onboarding review</li>
            <li>Official chapter launch preparation</li>
          </ol>
          <p className="text-xs text-muted-foreground mt-4 italic">
            We appreciate your commitment to building the future of global innovation.
          </p>
        </div>
      </div>
    </div>
  );
}
