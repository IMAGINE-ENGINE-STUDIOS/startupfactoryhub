import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Building2, Mail, Phone, Globe, CheckCircle2, XCircle, Clock, Star, Eye, Search } from "lucide-react";
import { format } from "date-fns";

interface CorporatePartner {
  id: string;
  company_name: string;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  company_website: string | null;
  company_size: string | null;
  partnership_type: string;
  partnership_interests: string[] | null;
  message: string | null;
  status: string;
  is_featured: boolean;
  notes: string | null;
  created_at: string;
}

export default function CorporatePartnersManagement() {
  const { toast } = useToast();
  const [partners, setPartners] = useState<CorporatePartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedPartner, setSelectedPartner] = useState<CorporatePartner | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    fetchPartners();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('corporate-partners-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'corporate_partners'
        },
        () => {
          fetchPartners();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchPartners = async () => {
    try {
      const { data, error } = await supabase
        .from('corporate_partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPartners(data || []);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: "Error",
        description: "Failed to fetch partner applications",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const updatePartnerStatus = async (id: string, status: string) => {
    try {
      const { error } = await supabase
        .from('corporate_partners')
        .update({ 
          status,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Partner application marked as ${status}`,
      });

      fetchPartners();
    } catch (error) {
      console.error('Error updating partner:', error);
      toast({
        title: "Error",
        description: "Failed to update partner status",
        variant: "destructive"
      });
    }
  };

  const toggleFeatured = async (id: string, isFeatured: boolean) => {
    try {
      const { error } = await supabase
        .from('corporate_partners')
        .update({ is_featured: isFeatured })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: isFeatured ? "Partner Featured" : "Partner Unfeatured",
        description: isFeatured 
          ? "Partner will now appear on the public page" 
          : "Partner removed from featured list",
      });

      fetchPartners();
    } catch (error) {
      console.error('Error toggling featured:', error);
      toast({
        title: "Error",
        description: "Failed to update featured status",
        variant: "destructive"
      });
    }
  };

  const saveNotes = async () => {
    if (!selectedPartner) return;

    try {
      const { error } = await supabase
        .from('corporate_partners')
        .update({ notes })
        .eq('id', selectedPartner.id);

      if (error) throw error;

      toast({
        title: "Notes Saved",
        description: "Partner notes have been updated",
      });

      setIsDialogOpen(false);
      fetchPartners();
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: "Error",
        description: "Failed to save notes",
        variant: "destructive"
      });
    }
  };

  const openPartnerDetails = (partner: CorporatePartner) => {
    setSelectedPartner(partner);
    setNotes(partner.notes || "");
    setIsDialogOpen(true);
  };

  const filteredPartners = partners.filter(partner => {
    const matchesSearch = 
      partner.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      partner.contact_email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || partner.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500/10 text-green-500"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
    }
  };

  const stats = {
    total: partners.length,
    pending: partners.filter(p => p.status === 'pending').length,
    approved: partners.filter(p => p.status === 'approved').length,
    featured: partners.filter(p => p.is_featured).length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">Total Applications</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
            <p className="text-sm text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-500">{stats.approved}</div>
            <p className="text-sm text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-primary">{stats.featured}</div>
            <p className="text-sm text-muted-foreground">Featured</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Corporate Partner Applications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by company, contact, or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredPartners.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No partner applications found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Featured</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPartners.map((partner) => (
                    <TableRow key={partner.id}>
                      <TableCell>
                        <div className="font-medium">{partner.company_name}</div>
                        {partner.company_website && (
                          <a 
                            href={partner.company_website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline"
                          >
                            {partner.company_website}
                          </a>
                        )}
                      </TableCell>
                      <TableCell>
                        <div>{partner.contact_name}</div>
                        <div className="text-xs text-muted-foreground">{partner.contact_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {partner.partnership_type}
                        </Badge>
                      </TableCell>
                      <TableCell>{getStatusBadge(partner.status)}</TableCell>
                      <TableCell>
                        <Switch
                          checked={partner.is_featured}
                          onCheckedChange={(checked) => toggleFeatured(partner.id, checked)}
                          disabled={partner.status !== 'approved'}
                        />
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {format(new Date(partner.created_at), 'MMM d, yyyy')}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => openPartnerDetails(partner)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {partner.status === 'pending' && (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-green-500 hover:text-green-600"
                                onClick={() => updatePartnerStatus(partner.id, 'approved')}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost"
                                className="text-red-500 hover:text-red-600"
                                onClick={() => updatePartnerStatus(partner.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Partner Details Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedPartner?.company_name}
            </DialogTitle>
          </DialogHeader>
          
          {selectedPartner && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Contact Name</Label>
                  <p className="font-medium">{selectedPartner.contact_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Partnership Type</Label>
                  <p className="font-medium capitalize">{selectedPartner.partnership_type}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <a href={`mailto:${selectedPartner.contact_email}`} className="text-primary hover:underline">
                    {selectedPartner.contact_email}
                  </a>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Phone className="h-3 w-3" /> Phone
                  </Label>
                  <p>{selectedPartner.contact_phone || 'Not provided'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground flex items-center gap-1">
                    <Globe className="h-3 w-3" /> Website
                  </Label>
                  {selectedPartner.company_website ? (
                    <a 
                      href={selectedPartner.company_website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline"
                    >
                      {selectedPartner.company_website}
                    </a>
                  ) : (
                    <p>Not provided</p>
                  )}
                </div>
                <div>
                  <Label className="text-muted-foreground">Company Size</Label>
                  <p>{selectedPartner.company_size || 'Not provided'}</p>
                </div>
              </div>

              {selectedPartner.partnership_interests && selectedPartner.partnership_interests.length > 0 && (
                <div>
                  <Label className="text-muted-foreground">Interest Areas</Label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {selectedPartner.partnership_interests.map(interest => (
                      <Badge key={interest} variant="secondary">{interest}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedPartner.message && (
                <div>
                  <Label className="text-muted-foreground">Message</Label>
                  <p className="bg-muted p-3 rounded-lg mt-1 text-sm">{selectedPartner.message}</p>
                </div>
              )}

              <div>
                <Label htmlFor="notes">Admin Notes</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add internal notes about this partner..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveNotes}>
              Save Notes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
