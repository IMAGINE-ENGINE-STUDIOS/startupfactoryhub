import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { CalendarIcon, Search, Loader2, Building2, Globe, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddStartupToPortfolioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cohorts: { id: string; name: string }[];
  onStartupAdded?: () => void;
  isAlumniMode?: boolean;
}

interface Company {
  id: string;
  name: string;
  industry: string | null;
  stage: string | null;
  logo_url: string | null;
}

const INDUSTRIES = [
  'Technology', 'Healthcare', 'Finance', 'E-commerce', 'SaaS',
  'AI/ML', 'Biotech', 'Clean Energy', 'Real Estate', 'Education',
  'Consumer', 'Enterprise', 'Other'
];

const STAGES = ['onboarding', 'active', 'graduated'];

export default function AddStartupToPortfolioDialog({ 
  open, 
  onOpenChange,
  cohorts,
  onStartupAdded,
  isAlumniMode = false
}: AddStartupToPortfolioDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [companyType, setCompanyType] = useState<'platform' | 'external'>('platform');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showCompanySearch, setShowCompanySearch] = useState(true);
  
  // External company fields
  const [externalCompanyName, setExternalCompanyName] = useState('');
  const [externalCompanyIndustry, setExternalCompanyIndustry] = useState('');
  const [externalCompanyWebsite, setExternalCompanyWebsite] = useState('');
  const [externalCompanyLogo, setExternalCompanyLogo] = useState('');
  
  // Common fields
  const [selectedCohort, setSelectedCohort] = useState('');
  const [fundingReceived, setFundingReceived] = useState('');
  const [equityGiven, setEquityGiven] = useState('');
  const [graduationDate, setGraduationDate] = useState<Date>();
  const [graduationYear, setGraduationYear] = useState('');
  const [currentStage, setCurrentStage] = useState(isAlumniMode ? 'graduated' : 'active');
  const [notes, setNotes] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (open) {
      fetchCompanies();
      if (isAlumniMode) {
        setCurrentStage('graduated');
      }
    }
  }, [open, isAlumniMode]);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.length >= 2) {
        searchCompanies(searchQuery);
      } else {
        fetchCompanies();
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  const fetchCompanies = async () => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, stage, logo_url')
      .limit(20);

    if (!error && data) {
      setCompanies(data);
    }
    setIsSearching(false);
  };

  const searchCompanies = async (query: string) => {
    setIsSearching(true);
    const { data, error } = await supabase
      .from('companies')
      .select('id, name, industry, stage, logo_url')
      .ilike('name', `%${query}%`)
      .limit(20);

    if (!error && data) {
      setCompanies(data);
    }
    setIsSearching(false);
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    setShowCompanySearch(false);
  };

  const handleSubmit = async () => {
    if (!user || !selectedCohort) {
      toast({
        title: "Missing Information",
        description: "Please select a cohort.",
        variant: "destructive",
      });
      return;
    }

    if (companyType === 'platform' && !selectedCompany) {
      toast({
        title: "Missing Company",
        description: "Please select a company from the platform.",
        variant: "destructive",
      });
      return;
    }

    if (companyType === 'external' && !externalCompanyName.trim()) {
      toast({
        title: "Missing Company Name",
        description: "Please enter the company name.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const startupData: any = {
        cohort_id: selectedCohort,
        current_stage: currentStage,
        funding_received: fundingReceived ? parseFloat(fundingReceived) : null,
        equity_given: equityGiven ? parseFloat(equityGiven) : null,
        graduation_date: graduationDate ? format(graduationDate, 'yyyy-MM-dd') : null,
        notes: notes || null,
      };

      if (companyType === 'platform' && selectedCompany) {
        startupData.company_id = selectedCompany.id;
        startupData.is_manual_entry = false;
      } else {
        // For external companies, we need a placeholder company_id
        // We'll use a UUID that doesn't exist but set is_manual_entry to true
        startupData.company_id = crypto.randomUUID();
        startupData.is_manual_entry = true;
        startupData.external_company_name = externalCompanyName.trim();
        startupData.external_company_industry = externalCompanyIndustry || null;
        startupData.external_company_website = externalCompanyWebsite || null;
        startupData.external_company_logo = externalCompanyLogo || null;
        startupData.graduation_year = graduationYear ? parseInt(graduationYear) : null;
      }

      const { error: insertError } = await supabase
        .from('cohort_startups')
        .insert(startupData);

      if (insertError) throw insertError;

      const displayName = companyType === 'platform' ? selectedCompany?.name : externalCompanyName;
      toast({
        title: isAlumniMode ? "Alumni Added" : "Startup Added",
        description: `Successfully added ${displayName} to portfolio.`,
      });

      resetForm();
      onOpenChange(false);
      onStartupAdded?.();
    } catch (error: any) {
      console.error('Error adding startup:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add startup to portfolio.",
        variant: "destructive",
      });
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setCompanyType('platform');
    setSelectedCompany(null);
    setShowCompanySearch(true);
    setSearchQuery('');
    setExternalCompanyName('');
    setExternalCompanyIndustry('');
    setExternalCompanyWebsite('');
    setExternalCompanyLogo('');
    setSelectedCohort('');
    setFundingReceived('');
    setEquityGiven('');
    setGraduationDate(undefined);
    setGraduationYear('');
    setCurrentStage(isAlumniMode ? 'graduated' : 'active');
    setNotes('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto glass-morphism">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            {isAlumniMode ? 'Add Alumni' : 'Add Startup to Portfolio'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Company Type Selection */}
          <Tabs value={companyType} onValueChange={(v) => setCompanyType(v as 'platform' | 'external')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="platform" className="gap-2">
                <Building2 className="h-4 w-4" />
                Platform Company
              </TabsTrigger>
              <TabsTrigger value="external" className="gap-2">
                <Globe className="h-4 w-4" />
                External Company
              </TabsTrigger>
            </TabsList>

            <TabsContent value="platform" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>Company *</Label>
                {showCompanySearch ? (
                  <div className="space-y-2">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search companies..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <div className="border rounded-lg max-h-48 overflow-y-auto">
                      {isSearching ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <Loader2 className="h-4 w-4 animate-spin mx-auto" />
                        </div>
                      ) : companies.length === 0 ? (
                        <div className="p-4 text-center text-muted-foreground">
                          <p>No companies found</p>
                          <Button 
                            variant="link" 
                            className="mt-2"
                            onClick={() => setCompanyType('external')}
                          >
                            Add an external company instead
                          </Button>
                        </div>
                      ) : (
                        companies.map((company) => (
                          <button
                            key={company.id}
                            onClick={() => handleSelectCompany(company)}
                            className="w-full p-3 text-left hover:bg-accent flex items-center gap-3 border-b last:border-b-0"
                          >
                            {company.logo_url ? (
                              <img src={company.logo_url} alt="" className="h-8 w-8 rounded object-cover" />
                            ) : (
                              <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                                <Building2 className="h-4 w-4" />
                              </div>
                            )}
                            <div>
                              <div className="font-medium">{company.name}</div>
                              <div className="text-sm text-muted-foreground">
                                {company.industry} {company.stage && `• ${company.stage}`}
                              </div>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-3 border rounded-lg bg-accent/50">
                    {selectedCompany?.logo_url ? (
                      <img src={selectedCompany.logo_url} alt="" className="h-10 w-10 rounded object-cover" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Building2 className="h-5 w-5" />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="font-medium">{selectedCompany?.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {selectedCompany?.industry} {selectedCompany?.stage && `• ${selectedCompany.stage}`}
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setShowCompanySearch(true)}>
                      Change
                    </Button>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="external" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="externalName">Company Name *</Label>
                  <Input
                    id="externalName"
                    placeholder="Enter company name"
                    value={externalCompanyName}
                    onChange={(e) => setExternalCompanyName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Industry</Label>
                    <Select value={externalCompanyIndustry} onValueChange={setExternalCompanyIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((industry) => (
                          <SelectItem key={industry} value={industry}>{industry}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="externalWebsite">Website</Label>
                    <Input
                      id="externalWebsite"
                      placeholder="https://example.com"
                      value={externalCompanyWebsite}
                      onChange={(e) => setExternalCompanyWebsite(e.target.value)}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="externalLogo">Logo URL</Label>
                    <Input
                      id="externalLogo"
                      placeholder="https://example.com/logo.png"
                      value={externalCompanyLogo}
                      onChange={(e) => setExternalCompanyLogo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="graduationYear">Graduation Year</Label>
                    <Input
                      id="graduationYear"
                      type="number"
                      placeholder="2024"
                      value={graduationYear}
                      onChange={(e) => setGraduationYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Common Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Cohort *</Label>
              <Select value={selectedCohort} onValueChange={setSelectedCohort}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cohort" />
                </SelectTrigger>
                <SelectContent>
                  {cohorts.map((cohort) => (
                    <SelectItem key={cohort.id} value={cohort.id}>{cohort.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={currentStage} onValueChange={setCurrentStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {stage.charAt(0).toUpperCase() + stage.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fundingReceived">Funding Received ($)</Label>
              <Input
                id="fundingReceived"
                type="number"
                placeholder="100000"
                value={fundingReceived}
                onChange={(e) => setFundingReceived(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equityGiven">Equity Given (%)</Label>
              <Input
                id="equityGiven"
                type="number"
                step="0.01"
                placeholder="7.0"
                value={equityGiven}
                onChange={(e) => setEquityGiven(e.target.value)}
              />
            </div>
          </div>

          {companyType === 'platform' && (
            <div className="space-y-2">
              <Label>Graduation Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !graduationDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {graduationDate ? format(graduationDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={graduationDate}
                    onSelect={setGraduationDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Add any additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isAlumniMode ? 'Add Alumni' : 'Add Startup'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
