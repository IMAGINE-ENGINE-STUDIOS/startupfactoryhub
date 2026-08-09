import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building, Users, TrendingUp, DollarSign, Edit, Plus, Globe, MapPin, FileText, Briefcase, Presentation, UserSquare2, Image as ImageIcon, CalendarCheck, CreditCard, Wallet, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import PitchDeckUpload from './PitchDeckUpload';
import CompanyLogoUpload from './CompanyLogoUpload';
import MyBookings from './MyBookings';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import AvatarUpload from './AvatarUpload';
import { useUserRole } from '@/hooks/useUserRole';
import { INDUSTRIES, getIndustryLabel, normalizeIndustry } from '@/lib/constants';
import { useRealtime } from '@/hooks/useRealtime';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';
import ProfilePayoutsTab from './ProfilePayoutsTab';
import ProfilePostsMosaic from './ProfilePostsMosaic';
import TeamRequestsManager from './startup/TeamRequestsManager';
import { DangerZoneCard } from "@/components/DangerZoneCard";

export default function CompanyProfileManager() {
  const { isSubscribed } = useMembershipStatus();
  const [company, setCompany] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    industry: '',
    stage: '',
    website: '',
    location: '',
    team_size: '',
    founded_year: '',
    looking_for: [] as string[],
  });
  const [profileFormData, setProfileFormData] = useState({
    full_name: '',
    bio: '',
    linkedin_url: '',
  });
  const { user } = useAuth();
  const { toast } = useToast();
  const { role } = useUserRole();

  // Real-time sync for company updates (e.g., when funding changes from investments)
  useRealtime({
    table: 'companies',
    filter: user ? `user_id=eq.${user.id}` : undefined,
    onUpdate: () => fetchCompany(),
  });

  useEffect(() => {
    if (user) {
      fetchUserProfile();
      if (user) {
        fetchCompany();
      }
    }
  }, [user]);

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUserProfile(data);
      setProfileFormData({
        full_name: data.full_name || '',
        bio: data.bio || '',
        linkedin_url: data.linkedin_url || '',
      });
    }
  };

  const fetchCompany = async () => {
    if (!user) return;

    // Get the OLDEST company for consistency - prevents issues with duplicates
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error fetching company:', error);
      return;
    }

    if (data) {
      setCompany(data);
      setFormData({
        name: data.name || '',
        description: data.description || '',
        industry: normalizeIndustry(data.industry),
        stage: data.stage || '',
        website: data.website || '',
        location: data.location || '',
        team_size: data.team_size?.toString() || '',
        founded_year: data.founded_year?.toString() || '',
        looking_for: data.looking_for || [],
      });
    }
  };

  const saveCompany = async () => {
    if (!user) return;

    // Update user profile first
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        full_name: profileFormData.full_name,
        bio: profileFormData.bio,
        linkedin_url: profileFormData.linkedin_url,
      })
      .eq('user_id', user.id);

    if (profileError) {
      toast({
        title: "Error",
        description: "Failed to save profile",
        variant: "destructive",
      });
      return;
    }

    const companyData = {
      name: formData.name,
      description: formData.description,
      industry: formData.industry,
      stage: formData.stage as 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale',
      website: formData.website,
      location: formData.location,
      team_size: formData.team_size ? parseInt(formData.team_size) : null,
      founded_year: formData.founded_year ? parseInt(formData.founded_year) : null,
      looking_for: formData.looking_for,
      user_id: user.id
    };

    let error;
    if (company) {
      ({ error } = await supabase
        .from('companies')
        .update(companyData)
        .eq('id', company.id));
    } else {
      ({ error } = await supabase
        .from('companies')
        .insert([companyData]));
    }

    if (error) {
      toast({
        title: "Error",
        description: "Failed to save company profile",
        variant: "destructive",
      });
      return;
    }

    setIsEditing(false);
    await fetchUserProfile();
    await fetchCompany();
    toast({
      title: "Success",
      description: "Profile saved successfully!",
    });
  };

  const getStageColor = (stage: string) => {
    const colors = {
      'pre-seed': 'bg-yellow-500/10 border-yellow-500/20 text-yellow-600',
      'seed': 'bg-green-500/10 border-green-500/20 text-green-600',
      'series-a': 'bg-blue-500/10 border-blue-500/20 text-blue-600',
      'series-b': 'bg-purple-500/10 border-purple-500/20 text-purple-600',
      'series-c': 'bg-red-500/10 border-red-500/20 text-red-600',
      'ipo': 'bg-orange-500/10 border-orange-500/20 text-orange-600'
    };
    return colors[stage as keyof typeof colors] || 'bg-gray-500/10 border-gray-500/20 text-gray-600';
  };

  const profileTitle = 'Company Profile';
  const entityName = company?.name || 'Your Company';

  if (!company && !isEditing) {
    return (
      <Card className="tech-card border-0 text-center p-12">
        <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Create Your {profileTitle}</h3>
        <p className="text-muted-foreground mb-6">
          Showcase your startup to investors, mentors, and potential team members
        </p>
        <Button onClick={() => setIsEditing(true)} className="pulse-primary">
          <Plus className="h-4 w-4 mr-2" />
          Create {profileTitle}
        </Button>
      </Card>
    );
  }

  if (isEditing) {
    const sectionClass = "relative overflow-hidden rounded-2xl tech-card border-0 p-5 md:p-6";
    const sectionTitle = (Icon: any, title: string, hint?: string) => (
      <div className="flex items-center gap-3 mb-5">
        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-1 ring-primary/20">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
      </div>
    );
    const inputClass = "mt-1.5 h-11 rounded-xl bg-background/40 backdrop-blur-xl border-border/60 focus-visible:ring-primary/40 focus-visible:border-primary/40";
    const labelClass = "text-xs font-semibold uppercase tracking-wider text-muted-foreground";

    return (
      <div className="space-y-5 pb-24">
        {/* Hero header */}
        <div className="relative overflow-hidden rounded-3xl tech-card border-0 p-6 md:p-7">
          <div className="absolute inset-0 pointer-events-none opacity-70">
            <div className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
            <div className="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
            <div className="absolute inset-0 [background:radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.08)_1px,transparent_0)] [background-size:18px_18px] opacity-50" />
          </div>
          <div className="relative flex items-center gap-4">
            <div className="relative h-14 w-14 shrink-0 rounded-2xl bg-gradient-to-br from-primary/30 via-primary/10 to-accent/30 flex items-center justify-center ring-1 ring-primary/30">
              <Edit className="h-6 w-6 text-primary" />
              <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-xl md:text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  {company ? 'Edit' : 'Create'} {profileTitle}
                </h2>
                <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20">
                  <Sparkles className="h-3 w-3" />
                  STUDIO
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground">
                Craft an identity that resonates — investors and mentors see this first.
              </p>
            </div>
          </div>
        </div>

        {/* Identity */}
        <div className={sectionClass}>
          {sectionTitle(UserSquare2, 'Identity', 'Your avatar, name and company logo')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="rounded-2xl bg-background/30 backdrop-blur-xl border border-border/60 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Your Profile</p>
                <Badge variant="outline" className="text-[10px]">Founder</Badge>
              </div>
              <div className="flex justify-center">
                <AvatarUpload
                  currentAvatarUrl={userProfile?.avatar_url}
                  onUploadComplete={() => {
                    fetchUserProfile();
                    toast({ title: "Profile Updated", description: "Your avatar has been updated successfully." });
                  }}
                  size="lg"
                  userRole={role}
                />
              </div>
              <div className="space-y-3">
                <div>
                  <label className={labelClass}>Your Name *</label>
                  <Input
                    value={profileFormData.full_name}
                    onChange={(e) => setProfileFormData({ ...profileFormData, full_name: e.target.value })}
                    placeholder="Your full name"
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Your Bio</label>
                  <Textarea
                    value={profileFormData.bio}
                    onChange={(e) => setProfileFormData({ ...profileFormData, bio: e.target.value })}
                    placeholder="Tell us about yourself..."
                    className="mt-1.5 rounded-xl bg-background/40 backdrop-blur-xl border-border/60 focus-visible:ring-primary/40"
                    rows={2}
                  />
                </div>
                <div>
                  <label className={labelClass}>LinkedIn URL</label>
                  <Input
                    value={profileFormData.linkedin_url}
                    onChange={(e) => setProfileFormData({ ...profileFormData, linkedin_url: e.target.value })}
                    placeholder="https://linkedin.com/in/yourprofile"
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-background/30 backdrop-blur-xl border border-border/60 p-5 flex flex-col items-center justify-center text-center min-h-[280px]">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">Company Logo</p>
              <CompanyLogoUpload
                currentLogoUrl={company?.logo_url}
                companyId={company?.id}
                onUploadComplete={() => { fetchCompany(); }}
              />
              {company?.name && (
                <p className="text-sm font-semibold text-foreground mt-4">{company.name}</p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">PNG or SVG · 512×512 recommended</p>
            </div>
          </div>
        </div>

        {/* Company essentials */}
        <div className={sectionClass}>
          {sectionTitle(Building, 'Company Essentials', 'Name, industry, mission')}
          <div className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Company Name *</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter company name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Industry *</label>
                <Select
                  value={formData.industry}
                  onValueChange={(value) => setFormData({ ...formData, industry: value })}
                >
                  <SelectTrigger className={inputClass}>
                    <SelectValue placeholder="Select industry" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDUSTRIES.map((ind) => (
                      <SelectItem key={ind.value} value={ind.value}>
                        {ind.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className={labelClass}>Description *</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe what your company does..."
                className="mt-1.5 min-h-[110px] rounded-xl bg-background/40 backdrop-blur-xl border-border/60 focus-visible:ring-primary/40"
              />
              <p className="text-[11px] text-muted-foreground mt-1.5">{formData.description.length}/280 characters · keep it punchy</p>
            </div>

            <div>
              <label className={labelClass}>Stage</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {[
                  { v: 'idea', l: 'Idea' },
                  { v: 'prototype', l: 'Prototype' },
                  { v: 'mvp', l: 'MVP' },
                  { v: 'growth', l: 'Growth' },
                  { v: 'scale', l: 'Scale' },
                ].map(s => {
                  const active = formData.stage === s.v;
                  return (
                    <button
                      key={s.v}
                      type="button"
                      onClick={() => setFormData({ ...formData, stage: s.v })}
                      className={`h-9 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                        active
                          ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] scale-[1.03]'
                          : 'border border-border/60 bg-background/40 backdrop-blur-xl text-muted-foreground hover:text-foreground hover:border-primary/40'
                      }`}
                    >
                      {s.l}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Location & links */}
        <div className={sectionClass}>
          {sectionTitle(Globe, 'Presence', 'Where you are and how to find you')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Website</label>
              <Input
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                placeholder="https://yourcompany.com"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Location</label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="e.g., San Francisco, CA"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Team Size</label>
              <Input
                type="number"
                value={formData.team_size}
                onChange={(e) => setFormData({ ...formData, team_size: e.target.value })}
                placeholder="e.g., 5"
                className={inputClass}
                min={1}
              />
            </div>
            <div>
              <label className={labelClass}>Founded Year</label>
              <Input
                type="number"
                value={formData.founded_year}
                onChange={(e) => setFormData({ ...formData, founded_year: e.target.value })}
                placeholder="e.g., 2023"
                className={inputClass}
                min={1900}
                max={new Date().getFullYear()}
              />
            </div>
          </div>
        </div>

        {/* Looking for */}
        <div className={sectionClass}>
          {sectionTitle(Sparkles, 'Looking For', 'What your startup is actively seeking')}
          <div className="flex flex-wrap gap-2">
            {['Funding', 'Mentorship', 'Co-founders', 'Employees', 'Advisors', 'Customers', 'Partners', 'Office Space'].map(item => {
              const active = formData.looking_for.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setFormData(prev => ({
                      ...prev,
                      looking_for: prev.looking_for.includes(item)
                        ? prev.looking_for.filter(i => i !== item)
                        : [...prev.looking_for, item]
                    }));
                  }}
                  className={`h-9 px-4 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                    active
                      ? 'bg-gradient-to-br from-accent to-primary text-primary-foreground shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)] scale-[1.03]'
                      : 'border border-border/60 bg-background/40 backdrop-blur-xl text-muted-foreground hover:text-foreground hover:border-primary/40'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-4 z-10 flex items-center justify-between gap-3 rounded-2xl tech-card border-0 p-3 md:p-4 backdrop-blur-xl">
          <p className="text-xs text-muted-foreground hidden sm:block">Changes are saved to your live profile.</p>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => setIsEditing(false)} className="h-10 rounded-xl">
              Cancel
            </Button>
            <Button
              onClick={saveCompany}
              className="h-10 px-5 rounded-xl gap-2 bg-gradient-to-br from-primary to-primary/70 hover:opacity-90 shadow-[0_8px_24px_-8px_hsl(var(--primary)/0.6)]"
            >
              <Sparkles className="h-4 w-4" />
              {company ? 'Save Changes' : 'Create Profile'}
            </Button>
          </div>
        </div>
      </div>
    );
  }


  const profileTabs = [
    { value: 'about', label: 'About', icon: FileText },
    { value: 'details', label: 'Details', icon: Briefcase },
    { value: 'deck', label: 'Pitch Deck', icon: Presentation },
    { value: 'team', label: 'Team', icon: UserSquare2 },
    { value: 'investor-qa', label: 'Investor Q&A', icon: HelpCircle },
    { value: 'posts', label: 'Posts', icon: ImageIcon },
    ...(isSubscribed ? [{ value: 'bookings', label: 'Bookings', icon: CalendarCheck }] : []),
    { value: 'subscription', label: 'Subscription', icon: CreditCard },
    { value: 'payouts', label: 'Payouts', icon: Wallet },
  ];

  return (
    <div className="space-y-6">
      {/* Hero header — cover + overlapping identity */}
      <div className="relative overflow-hidden rounded-3xl tech-card border-0">
        {/* Cover gradient + ambient orbs */}
        <div className="relative h-40 md:h-48 bg-gradient-to-br from-primary/30 via-accent/20 to-primary/10 overflow-hidden">
          <div className="absolute -top-20 -left-10 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-accent/30 blur-3xl" />
          <div className="absolute inset-0 [background:radial-gradient(circle_at_1px_1px,hsl(var(--foreground)/0.08)_1px,transparent_0)] [background-size:18px_18px] opacity-50" />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setIsEditing(true)}
            className="absolute top-4 right-4 gap-2 h-9 rounded-xl bg-background/70 backdrop-blur-xl border border-border/60 hover:bg-background"
          >
            <Edit className="h-3.5 w-3.5" />
            Edit Profile
          </Button>
        </div>

        {/* Identity row */}
        <div className="px-5 md:px-8 pb-6 -mt-12 md:-mt-14 relative">
          <div className="flex flex-col md:flex-row md:items-end gap-4 md:gap-6">
            <div className="flex items-end gap-3 shrink-0">
              <Avatar className="h-24 w-24 md:h-28 md:w-28 ring-4 ring-background shadow-xl rounded-2xl">
                <AvatarImage src={company.logo_url} alt={company.name} className="object-cover" />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground text-3xl font-bold rounded-2xl">
                  {company.name?.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <Avatar className="h-12 w-12 ring-2 ring-background shadow-md -ml-5 mb-1">
                <AvatarImage src={userProfile?.avatar_url} alt={userProfile?.full_name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm">
                  {userProfile?.full_name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>

            <div className="flex-1 min-w-0 md:pb-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent truncate">
                  {company.name}
                </h1>
                <Badge variant="secondary" className="text-[10px] gap-1 bg-primary/10 text-primary border-primary/20 capitalize">
                  <Sparkles className="h-3 w-3" />
                  {role || 'Founder'}
                </Badge>
              </div>
              <p className="text-xs md:text-sm text-muted-foreground mb-2">
                Founded by <span className="font-medium text-foreground/80">{userProfile?.full_name || 'You'}</span>
              </p>
              <p className="text-sm text-muted-foreground/90 line-clamp-2 max-w-2xl">
                {company.description || 'Add a short description to tell the world what you build.'}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                {company.stage && (
                  <Badge className={getStageColor(company.stage)} variant="outline">
                    {company.stage?.replace('-', ' ').charAt(0).toUpperCase() + company.stage?.slice(1)}
                  </Badge>
                )}
                {company.industry && (
                  <Badge variant="secondary" className="text-xs">{company.industry}</Badge>
                )}
                {company.location && (
                  <span className="inline-flex items-center text-xs text-muted-foreground gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {company.location}
                  </span>
                )}
                {company.website && (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-xs text-muted-foreground hover:text-primary transition-colors gap-1"
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats — sleek glass tiles */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Stage', value: company.stage?.replace('-', ' ') || 'N/A', icon: TrendingUp, color: 'from-primary to-accent' },
          { label: 'Team Size', value: company.team_size || '—', icon: Users, color: 'from-blue-500 to-cyan-500' },
          { label: 'Funding', value: company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : '—', icon: DollarSign, color: 'from-emerald-500 to-teal-500' },
          { label: 'Industry', value: company.industry || 'N/A', icon: Building, color: 'from-fuchsia-500 to-pink-500' },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl tech-card border-0 p-4 md:p-5 transition-all duration-300 hover:-translate-y-0.5"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
              <div className="relative flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg md:text-xl font-bold text-foreground capitalize truncate mt-1">{stat.value}</p>
                </div>
                <div className={`h-9 w-9 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon className="h-4 w-4 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Details */}
      <Tabs defaultValue="about" className="space-y-5">
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          <TabsList className="bg-transparent p-0 h-auto gap-2 flex">
            {profileTabs.map((t) => {
              const Icon = t.icon;
              return (
                <TabsTrigger
                  key={t.value}
                  value={t.value}
                  className="shrink-0 h-10 px-4 rounded-2xl gap-2 border border-white/[0.08] bg-white/[0.04] backdrop-blur-xl text-muted-foreground hover:text-foreground hover:bg-white/[0.08] transition-all data-[state=active]:bg-white/[0.12] data-[state=active]:text-foreground data-[state=active]:shadow-[0_0_20px_hsl(var(--primary)/0.15)] data-[state=active]:border-white/[0.12]"
                >
                  <Icon className="h-4 w-4" />
                  <span className="text-xs font-semibold tracking-wide">{t.label}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </div>


        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {company.description || 'No description provided yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Industry</p>
                  <p className="text-foreground">{company.industry}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Stage</p>
                  <p className="text-foreground capitalize">{company.stage?.replace('-', ' ')}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Location</p>
                  <p className="text-foreground">{company.location || 'Not specified'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Website</p>
                  {company.website ? (
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                      {company.website}
                    </a>
                  ) : (
                    <p className="text-foreground">Not specified</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deck" className="space-y-4">
          <PitchDeckUpload 
            companyId={company.id}
            currentDeckUrl={company.pitch_deck_url}
            onUploadComplete={(url) => {
              setCompany({ ...company, pitch_deck_url: url });
              toast({
                title: 'Success!',
                description: 'Pitch deck updated successfully.',
              });
            }}
          />
        </TabsContent>

        <TabsContent value="team" className="space-y-4">
          <TeamRequestsManager companyId={company.id} />
        </TabsContent>

        <TabsContent value="posts" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Your Posts</CardTitle>
            </CardHeader>
            <CardContent>
              <ProfilePostsMosaic userId={company?.user_id || ''} isOwnProfile={true} />
            </CardContent>
          </Card>
        </TabsContent>

        {isSubscribed && (
          <TabsContent value="bookings" className="space-y-4">
            <MyBookings />
          </TabsContent>
        )}

        <TabsContent value="subscription" className="space-y-4">
          <ProfileSubscriptionTab />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <ProfilePayoutsTab />
        </TabsContent>
      </Tabs>

      <DangerZoneCard className="mt-8" />
    </div>
  );
}