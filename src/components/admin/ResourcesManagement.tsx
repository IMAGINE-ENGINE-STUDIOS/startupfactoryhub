import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Eye, 
  Edit,
  Trash2,
  Globe,
  RefreshCw,
  MoreVertical,
  MapPin,
  Star,
  Plus,
  Crown,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  is_official_partner: boolean | null;
  is_flagship?: boolean | null;
  is_verified: boolean | null;
  author_id: string | null;
  created_at: string;
}

const RESOURCE_TYPES = [
  'accelerator_incubator',
  'coworking',
  'lab',
  'venue',
  'perk',
  'chamber_of_commerce',
  'technology_transfer',
  'community',
  'government_grant',
  'entrepreneur_center',
  'university',
  'investor_network',
  'human_capital',
  'event'
];

const ResourcesManagement = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'pending'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resource_type: 'perk',
    website_url: '',
    contact_email: '',
    is_official_partner: false
  });

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    setLoading(true);
    try {
      // Fetch verified resources
      const { data: verifiedData, error: verifiedError } = await supabase
        .from('resources')
        .select('*')
        .eq('is_verified', true)
        .order('created_at', { ascending: false });

      if (verifiedError) throw verifiedError;

      // Fetch pending resources (unverified)
      const { data: pendingData, error: pendingError } = await supabase
        .from('resources')
        .select('*')
        .eq('is_verified', false)
        .order('created_at', { ascending: false });

      if (pendingError) throw pendingError;

      setResources(verifiedData || []);
      setPendingResources(pendingData || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
      toast({
        title: "Error",
        description: "Failed to fetch resources",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePartner = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_official_partner: !resource.is_official_partner })
        .eq('id', resource.id);

      if (error) throw error;

      setResources(prev => prev.map(r => 
        r.id === resource.id ? { ...r, is_official_partner: !r.is_official_partner } : r
      ));

      toast({
        title: "Updated",
        description: `Partner status ${!resource.is_official_partner ? 'enabled' : 'disabled'}`
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive"
      });
    }
  };

  const handleDeleteResource = async (id: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setResources(prev => prev.filter(r => r.id !== id));
      setPendingResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Deleted",
        description: "Resource has been deleted"
      });
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource",
        variant: "destructive"
      });
    }
  };

  const handleApproveResource = async (resource: Resource) => {
    try {
      const { error } = await supabase
        .from('resources')
        .update({ is_verified: true })
        .eq('id', resource.id);

      if (error) throw error;

      // Move from pending to verified
      setPendingResources(prev => prev.filter(r => r.id !== resource.id));
      setResources(prev => [{ ...resource, is_verified: true }, ...prev]);

      toast({
        title: "Approved",
        description: `"${resource.title}" has been approved and is now visible on the map`
      });
    } catch (error) {
      console.error('Error approving resource:', error);
      toast({
        title: "Error",
        description: "Failed to approve resource",
        variant: "destructive"
      });
    }
  };

  const handleRejectResource = async (id: string, title: string) => {
    try {
      const { error } = await supabase
        .from('resources')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setPendingResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Rejected",
        description: `"${title}" has been rejected and removed`
      });
    } catch (error) {
      console.error('Error rejecting resource:', error);
      toast({
        title: "Error",
        description: "Failed to reject resource",
        variant: "destructive"
      });
    }
  };

  const handleEditResource = async () => {
    if (!editResource) return;
    try {
      const { error } = await supabase
        .from('resources')
        .update({
          title: editResource.title,
          description: editResource.description,
          resource_type: editResource.resource_type,
          website_url: editResource.website_url,
          contact_email: editResource.contact_email,
          is_official_partner: editResource.is_official_partner,
          is_flagship: editResource.is_flagship
        })
        .eq('id', editResource.id);

      if (error) throw error;

      setResources(prev => prev.map(r => r.id === editResource.id ? editResource : r));
      setShowEditDialog(false);
      setEditResource(null);
      toast({
        title: "Updated",
        description: "Resource has been updated"
      });
    } catch (error) {
      console.error('Error updating resource:', error);
      toast({
        title: "Error",
        description: "Failed to update resource",
        variant: "destructive"
      });
    }
  };

  const handleAddResource = async () => {
    try {
      const { error } = await supabase
        .from('resources')
        .insert([{ ...newResource, is_verified: true }]); // Admin-added resources are auto-verified

      if (error) throw error;

      fetchResources();
      setShowAddDialog(false);
      setNewResource({
        title: '',
        description: '',
        resource_type: 'perk',
        website_url: '',
        contact_email: '',
        is_official_partner: false
      });
      toast({
        title: "Added",
        description: "Resource has been added"
      });
    } catch (error) {
      console.error('Error adding resource:', error);
      toast({
        title: "Error",
        description: "Failed to add resource",
        variant: "destructive"
      });
    }
  };

  const currentResources = viewMode === 'pending' ? pendingResources : resources;
  
  const filteredResources = currentResources.filter(r => {
    const matchesSearch = !searchQuery || 
      r.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.city?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || r.resource_type === typeFilter;
    return matchesSearch && matchesType;
  });

  const partnerCount = resources.filter(r => r.is_official_partner).length;
  const flagshipCount = resources.filter(r => r.is_flagship).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Globe className="h-5 w-5 text-blue-400 mb-2" />
            <p className="text-2xl font-bold">{resources.length}</p>
            <p className="text-xs text-muted-foreground">Total Resources</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0 cursor-pointer" onClick={() => setViewMode('pending')}>
          <CardContent className="p-4">
            <RefreshCw className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">{pendingResources.length}</p>
            <p className="text-xs text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Star className="h-5 w-5 text-amber-400 mb-2" />
            <p className="text-2xl font-bold">{partnerCount}</p>
            <p className="text-xs text-muted-foreground">Official Partners</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <Crown className="h-5 w-5 text-yellow-400 mb-2" />
            <p className="text-2xl font-bold">{flagshipCount}</p>
            <p className="text-xs text-muted-foreground">Flagship Locations</p>
          </CardContent>
        </Card>
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <MapPin className="h-5 w-5 text-rose-400 mb-2" />
            <p className="text-2xl font-bold">
              {resources.filter(r => r.latitude && r.longitude).length}
            </p>
            <p className="text-xs text-muted-foreground">With Locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="tech-card border-0">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 tech-card border-0"
              />
            </div>
            <Select value={viewMode} onValueChange={(v: 'all' | 'pending') => setViewMode(v)}>
              <SelectTrigger className="w-[180px] tech-card border-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Verified Resources</SelectItem>
                <SelectItem value="pending">Pending Approval ({pendingResources.length})</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px] tech-card border-0">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {RESOURCE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDialog(true)} className="tech-card border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
            <Button variant="outline" onClick={fetchResources} className="tech-card border-0">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resources Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            {viewMode === 'pending' ? 'Pending Approval' : 'Resources'} ({filteredResources.length})
            {viewMode === 'pending' && pendingResources.length > 0 && (
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                Requires Review
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Resource</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Location</TableHead>
                  {viewMode === 'all' && <TableHead>Partner</TableHead>}
                  {viewMode === 'all' && <TableHead>Flagship</TableHead>}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredResources.map((resource) => (
                  <TableRow key={resource.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={resource.logo_url || ''} />
                          <AvatarFallback>{resource.title?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{resource.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{resource.description}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{resource.resource_type?.replace(/_/g, ' ')}</Badge>
                    </TableCell>
                    <TableCell>
                      {resource.city || resource.country ? `${resource.city || ''}, ${resource.country || ''}` : 'N/A'}
                    </TableCell>
                    {viewMode === 'all' && (
                      <TableCell>
                        <Switch
                          checked={resource.is_official_partner || false}
                          onCheckedChange={() => handleTogglePartner(resource)}
                        />
                      </TableCell>
                    )}
                    {viewMode === 'all' && (
                      <TableCell>
                        {resource.is_flagship && (
                          <Crown className="h-4 w-4 text-yellow-400" />
                        )}
                      </TableCell>
                    )}
                    <TableCell className="text-right">
                      {viewMode === 'pending' ? (
                        <div className="flex items-center gap-2 justify-end">
                          <Button 
                            size="sm" 
                            className="bg-green-500/20 text-green-400 hover:bg-green-500/30"
                            onClick={() => handleApproveResource(resource)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            onClick={() => handleRejectResource(resource.id, resource.title)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </Button>
                        </div>
                      ) : (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => {
                              setSelectedResource(resource);
                              setShowDialog(true);
                            }}>
                              <Eye className="h-4 w-4 mr-2" />
                              View
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setEditResource(resource);
                              setShowEditDialog(true);
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteResource(resource.id)} className="text-red-500">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Add Resource Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newResource.resource_type} onValueChange={(v) => setNewResource({ ...newResource, resource_type: v })}>
                <SelectTrigger className="tech-card border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RESOURCE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={newResource.website_url}
                onChange={(e) => setNewResource({ ...newResource, website_url: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Contact Email</Label>
              <Input
                value={newResource.contact_email}
                onChange={(e) => setNewResource({ ...newResource, contact_email: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newResource.is_official_partner}
                onCheckedChange={(v) => setNewResource({ ...newResource, is_official_partner: v })}
              />
              <Label>Official Partner</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddResource}>Add Resource</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Resource Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>Resource Details</DialogTitle>
          </DialogHeader>
          {selectedResource && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedResource.logo_url || ''} />
                  <AvatarFallback>{selectedResource.title?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedResource.title}</h3>
                  <Badge variant="outline">{selectedResource.resource_type?.replace(/_/g, ' ')}</Badge>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{selectedResource.description}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p>{selectedResource.city}, {selectedResource.country}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Contact</p>
                  <p>{selectedResource.contact_email || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="tech-card border-0 !transition-none">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editResource && (
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input
                  value={editResource.title}
                  onChange={(e) => setEditResource({ ...editResource, title: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editResource.description || ''}
                  onChange={(e) => setEditResource({ ...editResource, description: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={editResource.resource_type} onValueChange={(v) => setEditResource({ ...editResource, resource_type: v })}>
                  <SelectTrigger className="tech-card border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RESOURCE_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={editResource.website_url || ''}
                  onChange={(e) => setEditResource({ ...editResource, website_url: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Contact Email</Label>
                <Input
                  value={editResource.contact_email || ''}
                  onChange={(e) => setEditResource({ ...editResource, contact_email: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editResource.is_official_partner || false}
                    onCheckedChange={(v) => setEditResource({ ...editResource, is_official_partner: v })}
                  />
                  <Label>Official Partner</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={editResource.is_flagship || false}
                    onCheckedChange={(v) => setEditResource({ ...editResource, is_flagship: v })}
                  />
                  <Label>Flagship Location</Label>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>Cancel</Button>
            <Button onClick={handleEditResource}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ResourcesManagement;