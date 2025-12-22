import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign, Users, Percent, X, CreditCard, Clock, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CreateCohortDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreateCohort: (cohort: any) => Promise<any>;
}

const INDUSTRIES = [
  'AI/ML', 'Biotech', 'CleanTech', 'Cybersecurity', 'EdTech', 
  'FinTech', 'HealthTech', 'SaaS', 'Hardware', 'E-commerce',
  'Space Tech', 'Robotics', 'Quantum Computing', 'Other'
];

const DURATION_OPTIONS = [
  { value: '1', label: '1 month' },
  { value: '3', label: '3 months' },
  { value: '6', label: '6 months' },
  { value: '12', label: '12 months' },
];

const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

export const CreateCohortDialog = ({ open, onOpenChange, onCreateCohort }: CreateCohortDialogProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    application_deadline: '',
    max_startups: 20,
    funding_per_startup: '',
    equity_percentage: '',
    enrollment_fee: '',
    focus_industries: [] as string[],
    status: 'upcoming',
    payment_type: 'one_time' as 'one_time' | 'monthly',
    payment_duration_months: '3'
  });
  const { toast } = useToast();

  // Calculate fee breakdown
  const feeBreakdown = useMemo(() => {
    const feeAmount = formData.enrollment_fee ? parseFloat(formData.enrollment_fee) : 0;
    if (feeAmount <= 0) return null;

    const isMonthly = formData.payment_type === 'monthly';
    const durationMonths = isMonthly ? parseInt(formData.payment_duration_months) : 1;
    
    const totalAmount = isMonthly ? feeAmount * durationMonths : feeAmount;
    const platformFee = totalAmount * PLATFORM_FEE_PERCENTAGE;
    const acceleratorReceives = totalAmount - platformFee;

    return {
      monthlyAmount: feeAmount,
      durationMonths,
      totalAmount,
      platformFee,
      acceleratorReceives,
      isMonthly
    };
  }, [formData.enrollment_fee, formData.payment_type, formData.payment_duration_months]);

  const handleSubmit = async () => {
    if (!formData.name) {
      toast({
        title: 'Name required',
        description: 'Please enter a cohort name.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      await onCreateCohort({
        name: formData.name,
        description: formData.description || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        application_deadline: formData.application_deadline || null,
        max_startups: formData.max_startups,
        funding_per_startup: formData.funding_per_startup ? parseInt(formData.funding_per_startup) * 1000 : null,
        equity_percentage: formData.equity_percentage ? parseFloat(formData.equity_percentage) : null,
        enrollment_fee: formData.enrollment_fee ? parseInt(formData.enrollment_fee) * 100 : 0, // Convert to cents
        focus_industries: formData.focus_industries.length > 0 ? formData.focus_industries : null,
        status: formData.status,
        payment_type: formData.payment_type,
        payment_duration_months: formData.payment_type === 'monthly' ? parseInt(formData.payment_duration_months) : null
      });

      toast({
        title: 'Cohort created!',
        description: `${formData.name} has been created successfully.`
      });

      // Reset form
      setFormData({
        name: '',
        description: '',
        start_date: '',
        end_date: '',
        application_deadline: '',
        max_startups: 20,
        funding_per_startup: '',
        equity_percentage: '',
        enrollment_fee: '',
        focus_industries: [],
        status: 'upcoming',
        payment_type: 'one_time',
        payment_duration_months: '3'
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create cohort',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleIndustry = (industry: string) => {
    setFormData(prev => ({
      ...prev,
      focus_industries: prev.focus_industries.includes(industry)
        ? prev.focus_industries.filter(i => i !== industry)
        : [...prev.focus_industries, industry]
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-morphism border-border/50 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Create New Cohort</DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Basic Info */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Cohort Name *</Label>
              <Input
                id="name"
                placeholder="e.g., W2024, Batch 15, Spring Cohort"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe this cohort's focus and goals..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="mt-1.5"
                rows={3}
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Application Deadline
              </Label>
              <Input
                type="date"
                value={formData.application_deadline}
                onChange={(e) => setFormData(prev => ({ ...prev, application_deadline: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Program Start</Label>
              <Input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label>Program End</Label>
              <Input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Capacity & Funding */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                Max Startups
              </Label>
              <Input
                type="number"
                min={1}
                value={formData.max_startups}
                onChange={(e) => setFormData(prev => ({ ...prev, max_startups: parseInt(e.target.value) || 20 }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Funding per Startup (K)
              </Label>
              <Input
                type="number"
                min={0}
                placeholder="e.g., 150"
                value={formData.funding_per_startup}
                onChange={(e) => setFormData(prev => ({ ...prev, funding_per_startup: e.target.value }))}
                className="mt-1.5"
              />
            </div>
            <div>
              <Label className="flex items-center gap-2">
                <Percent className="w-4 h-4" />
                Equity (%)
              </Label>
              <Input
                type="number"
                min={0}
                max={100}
                step={0.5}
                placeholder="e.g., 7"
                value={formData.equity_percentage}
                onChange={(e) => setFormData(prev => ({ ...prev, equity_percentage: e.target.value }))}
                className="mt-1.5"
              />
            </div>
          </div>

          {/* Payment Configuration */}
          <div className="space-y-4 p-4 rounded-lg border border-border/50 bg-muted/30">
            <div className="flex items-center gap-2 text-sm font-medium">
              <CreditCard className="w-4 h-4" />
              Payment Configuration
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Payment Type</Label>
                <Select 
                  value={formData.payment_type} 
                  onValueChange={(value: 'one_time' | 'monthly') => setFormData(prev => ({ ...prev, payment_type: value }))}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="one_time">One-Time Payment</SelectItem>
                    <SelectItem value="monthly">Monthly Subscription</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {formData.payment_type === 'monthly' && (
                <div>
                  <Label className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Duration
                  </Label>
                  <Select 
                    value={formData.payment_duration_months} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, payment_duration_months: value }))}
                  >
                    <SelectTrigger className="mt-1.5">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DURATION_OPTIONS.map(option => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label className="flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                {formData.payment_type === 'monthly' ? 'Monthly Fee ($)' : 'Enrollment Fee ($)'}
              </Label>
              <Input
                type="number"
                min={0}
                placeholder={formData.payment_type === 'monthly' ? 'e.g., 500 per month' : 'e.g., 500 (leave empty for free)'}
                value={formData.enrollment_fee}
                onChange={(e) => setFormData(prev => ({ ...prev, enrollment_fee: e.target.value }))}
                className="mt-1.5"
              />
            </div>

            {/* Fee Breakdown */}
            {feeBreakdown && (
              <div className="mt-4 p-3 rounded-md bg-background/50 border border-border/30 space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <Info className="w-4 h-4" />
                  Payment Summary
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {feeBreakdown.isMonthly && (
                    <>
                      <span className="text-muted-foreground">Monthly Amount:</span>
                      <span className="text-right font-medium">${feeBreakdown.monthlyAmount.toLocaleString()}</span>
                      <span className="text-muted-foreground">Duration:</span>
                      <span className="text-right font-medium">{feeBreakdown.durationMonths} months</span>
                    </>
                  )}
                  <span className="text-muted-foreground">Total Amount:</span>
                  <span className="text-right font-medium">${feeBreakdown.totalAmount.toLocaleString()}</span>
                  <span className="text-muted-foreground">Platform Fee (10%):</span>
                  <span className="text-right font-medium text-amber-500">-${feeBreakdown.platformFee.toLocaleString()}</span>
                  <span className="text-muted-foreground font-medium">You Receive:</span>
                  <span className="text-right font-bold text-emerald-500">${feeBreakdown.acceleratorReceives.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <Label>Initial Status</Label>
            <Select 
              value={formData.status} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
            >
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="upcoming">Upcoming</SelectItem>
                <SelectItem value="applications_open">Applications Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Focus Industries */}
          <div>
            <Label>Focus Industries</Label>
            <p className="text-sm text-muted-foreground mb-3">
              Select the industries this cohort will focus on
            </p>
            <div className="flex flex-wrap gap-2">
              {INDUSTRIES.map((industry) => (
                <Badge
                  key={industry}
                  variant={formData.focus_industries.includes(industry) ? 'default' : 'outline'}
                  className={`cursor-pointer transition-all ${
                    formData.focus_industries.includes(industry)
                      ? 'bg-emerald-500 hover:bg-emerald-600'
                      : 'hover:border-emerald-500/50'
                  }`}
                  onClick={() => toggleIndustry(industry)}
                >
                  {industry}
                  {formData.focus_industries.includes(industry) && (
                    <X className="w-3 h-3 ml-1" />
                  )}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading}
            className="bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            {loading ? 'Creating...' : 'Create Cohort'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};