import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const TARGET_COUNTRIES = ['Japan', 'USA', 'Europe', 'Chile', 'Venezuela'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isCorporate: boolean;
  onSuccess: (data: any) => void;
}

export default function SoftLandingRequestDialog({ open, onOpenChange, isCorporate, onSuccess }: Props) {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    target_country: '',
    company_name: '',
    company_industry: '',
    company_website: '',
    company_description: '',
    business_registration_number: '',
    number_of_employees: '',
    annual_revenue: '',
    expansion_goals: '',
    additional_notes: '',
  });

  const price = isCorporate ? 500000 : 750000;
  const priceLabel = isCorporate ? '$5,000' : '$7,500';

  const handleSubmit = async () => {
    if (!user) return;
    if (!form.target_country || !form.company_name) {
      toast.error('Please fill in the required fields (country and company name).');
      return;
    }
    setSubmitting(true);
    const { data, error } = await supabase
      .from('soft_landing_requests')
      .insert({
        user_id: user.id,
        ...form,
        is_corporate_subscriber: isCorporate,
        price_cents: price,
      })
      .select()
      .single();

    if (error) {
      toast.error(error.message);
    } else {
      toast.success('Soft Landing request submitted successfully!');
      onSuccess(data);
      onOpenChange(false);
    }
    setSubmitting(false);
  };

  const updateField = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-violet-500" />
            Soft Landing Program — {priceLabel}
          </DialogTitle>
          <DialogDescription>
            Expand your business internationally. Includes corporate registration, legal address, corporate documents & legal advice.
            {isCorporate && <span className="text-green-600 font-medium"> Corporate discount applied.</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <Label>Target Country *</Label>
            <Select value={form.target_country} onValueChange={(v) => updateField('target_country', v)}>
              <SelectTrigger><SelectValue placeholder="Select a country" /></SelectTrigger>
              <SelectContent>
                {TARGET_COUNTRIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Company Name *</Label>
            <Input value={form.company_name} onChange={(e) => updateField('company_name', e.target.value)} placeholder="Your company name" />
          </div>

          <div>
            <Label>Industry</Label>
            <Input value={form.company_industry} onChange={(e) => updateField('company_industry', e.target.value)} placeholder="e.g. SaaS, Fintech, E-commerce" />
          </div>

          <div>
            <Label>Company Website</Label>
            <Input value={form.company_website} onChange={(e) => updateField('company_website', e.target.value)} placeholder="https://..." />
          </div>

          <div>
            <Label>Company Description</Label>
            <Textarea value={form.company_description} onChange={(e) => updateField('company_description', e.target.value)} placeholder="Brief description of your business" rows={3} />
          </div>

          <div>
            <Label>Business Registration Number</Label>
            <Input value={form.business_registration_number} onChange={(e) => updateField('business_registration_number', e.target.value)} placeholder="Current registration number (if any)" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Number of Employees</Label>
              <Input value={form.number_of_employees} onChange={(e) => updateField('number_of_employees', e.target.value)} placeholder="e.g. 1-10" />
            </div>
            <div>
              <Label>Annual Revenue</Label>
              <Input value={form.annual_revenue} onChange={(e) => updateField('annual_revenue', e.target.value)} placeholder="e.g. $100K-$500K" />
            </div>
          </div>

          <div>
            <Label>Expansion Goals</Label>
            <Textarea value={form.expansion_goals} onChange={(e) => updateField('expansion_goals', e.target.value)} placeholder="What are your goals for expanding to this country?" rows={3} />
          </div>

          <div>
            <Label>Additional Notes</Label>
            <Textarea value={form.additional_notes} onChange={(e) => updateField('additional_notes', e.target.value)} placeholder="Any other relevant information" rows={2} />
          </div>

          <div className="flex items-center justify-between pt-2 border-t">
            <div>
              <p className="text-sm font-semibold">Total: {priceLabel}</p>
              <p className="text-[10px] text-muted-foreground">One country per request</p>
            </div>
            <Button onClick={handleSubmit} disabled={submitting} className="bg-violet-600 hover:bg-violet-700">
              {submitting ? 'Submitting...' : 'Submit Request'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
