import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { Plus, Building2, Pencil, Trash2, ExternalLink, TrendingUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const INDUSTRIES = ['Technology', 'Healthcare', 'Finance', 'Education', 'E-commerce', 'SaaS', 'AI/ML', 'Blockchain', 'FinTech', 'CleanTech', 'Other'];
const STAGES = ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C+', 'Growth', 'IPO'];
const EXIT_STATUS = ['active', 'acquired', 'ipo', 'closed'];

interface PortfolioCompany {
  id: string;
  company_name: string;
  company_logo_url?: string;
  industry?: string;
  stage?: string;
  investment_amount?: number;
  investment_year?: number;
  exit_status: string;
  website?: string;
  description?: string;
}

export default function PortfolioManager() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [portfolio, setPortfolio] = useState<PortfolioCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<PortfolioCompany | null>(null);
  
  const [formData, setFormData] = useState({
    company_name: '',
    company_logo_url: '',
    industry: '',
    stage: '',
    investment_amount: '',
    investment_year: '',
    exit_status: 'active',
    website: '',
    description: '',
  });

  useEffect(() => {
    if (user) {
      fetchPortfolio();
    }
  }, [user]);

  const fetchPortfolio = async () => {
    if (!user) return;

    setLoading(true);
    const { data, error } = await supabase
      .from('portfolio_companies')
      .select('*')
      .eq('investor_id', user.id)
      .order('investment_year', { ascending: false });

    if (!error && data) {
      setPortfolio(data);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !formData.company_name) return;

    const portfolioData = {
      investor_id: user.id,
      company_name: formData.company_name,
      company_logo_url: formData.company_logo_url || null,
      industry: formData.industry || null,
      stage: formData.stage || null,
      investment_amount: formData.investment_amount ? parseInt(formData.investment_amount) : null,
      investment_year: formData.investment_year ? parseInt(formData.investment_year) : null,
      exit_status: formData.exit_status,
      website: formData.website || null,
      description: formData.description || null,
    };

    if (editingCompany) {
      const { error } = await supabase
        .from('portfolio_companies')
        .update(portfolioData)
        .eq('id', editingCompany.id);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update portfolio company.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Updated!',
        description: 'Portfolio company updated successfully.',
      });
    } else {
      const { error } = await supabase
        .from('portfolio_companies')
        .insert(portfolioData);

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to add portfolio company.',
          variant: 'destructive',
        });
        return;
      }

      toast({
        title: 'Added!',
        description: 'Portfolio company added successfully.',
      });
    }

    resetForm();
    setDialogOpen(false);
    fetchPortfolio();
  };

  const handleEdit = (company: PortfolioCompany) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.company_name,
      company_logo_url: company.company_logo_url || '',
      industry: company.industry || '',
      stage: company.stage || '',
      investment_amount: company.investment_amount?.toString() || '',
      investment_year: company.investment_year?.toString() || '',
      exit_status: company.exit_status,
      website: company.website || '',
      description: company.description || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this company from your portfolio?')) return;

    const { error } = await supabase
      .from('portfolio_companies')
      .delete()
      .eq('id', id);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete portfolio company.',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Removed',
      description: 'Portfolio company removed successfully.',
    });

    fetchPortfolio();
  };

  const resetForm = () => {
    setFormData({
      company_name: '',
      company_logo_url: '',
      industry: '',
      stage: '',
      investment_amount: '',
      investment_year: '',
      exit_status: 'active',
      website: '',
      description: '',
    });
    setEditingCompany(null);
  };

  const getExitStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500/10 text-green-500 border-green-500/20',
      acquired: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      ipo: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      closed: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
    };
    return colors[status] || colors.active;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Portfolio Companies
            </CardTitle>
            <CardDescription>
              Showcase your investment portfolio including past investments
            </CardDescription>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Company
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingCompany ? 'Edit Portfolio Company' : 'Add Portfolio Company'}
                </DialogTitle>
              </DialogHeader>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="company_name">Company Name *</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name}
                      onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="company_logo_url">Logo URL</Label>
                    <Input
                      id="company_logo_url"
                      type="url"
                      value={formData.company_logo_url}
                      onChange={(e) => setFormData({ ...formData, company_logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="industry">Industry</Label>
                    <Select
                      value={formData.industry}
                      onValueChange={(value) => setFormData({ ...formData, industry: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind}>{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="stage">Stage</Label>
                    <Select
                      value={formData.stage}
                      onValueChange={(value) => setFormData({ ...formData, stage: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {STAGES.map((stg) => (
                          <SelectItem key={stg} value={stg}>{stg}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="investment_amount">Investment Amount ($)</Label>
                    <Input
                      id="investment_amount"
                      type="number"
                      value={formData.investment_amount}
                      onChange={(e) => setFormData({ ...formData, investment_amount: e.target.value })}
                      placeholder="500000"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="investment_year">Year</Label>
                    <Input
                      id="investment_year"
                      type="number"
                      value={formData.investment_year}
                      onChange={(e) => setFormData({ ...formData, investment_year: e.target.value })}
                      placeholder="2023"
                      min="1900"
                      max={new Date().getFullYear()}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="exit_status">Status</Label>
                    <Select
                      value={formData.exit_status}
                      onValueChange={(value) => setFormData({ ...formData, exit_status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {EXIT_STATUS.map((status) => (
                          <SelectItem key={status} value={status}>
                            {status.charAt(0).toUpperCase() + status.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    placeholder="https://company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the company..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setDialogOpen(false);
                      resetForm();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingCompany ? 'Update' : 'Add'} Company
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      
      <CardContent>
        {loading ? (
          <p className="text-center text-muted-foreground py-8">Loading portfolio...</p>
        ) : portfolio.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No portfolio companies yet</p>
            <p className="text-sm text-muted-foreground">
              Add your past investments to showcase your portfolio
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {portfolio.map((company) => (
              <Card key={company.id} className="relative group">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      <Avatar className="h-12 w-12">
                        {company.company_logo_url ? (
                          <AvatarImage src={company.company_logo_url} alt={company.company_name} />
                        ) : (
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {company.company_name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold truncate">{company.company_name}</h4>
                        {company.investment_year && (
                          <p className="text-xs text-muted-foreground">
                            Invested {company.investment_year}
                          </p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => handleEdit(company)}
                      >
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(company.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {company.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {company.description}
                      </p>
                    )}
                    
                    <div className="flex flex-wrap gap-1">
                      {company.industry && (
                        <Badge variant="secondary" className="text-xs">
                          {company.industry}
                        </Badge>
                      )}
                      {company.stage && (
                        <Badge variant="outline" className="text-xs">
                          {company.stage}
                        </Badge>
                      )}
                      <Badge className={`text-xs ${getExitStatusBadge(company.exit_status)}`}>
                        {company.exit_status.charAt(0).toUpperCase() + company.exit_status.slice(1)}
                      </Badge>
                    </div>
                    
                    {company.investment_amount && (
                      <div className="flex items-center gap-1 text-sm text-green-600">
                        <TrendingUp className="h-3 w-3" />
                        <span className="font-semibold">
                          ${(company.investment_amount / 1000000).toFixed(1)}M
                        </span>
                      </div>
                    )}
                    
                    {company.website && (
                      <a
                        href={company.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Visit Website
                      </a>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
