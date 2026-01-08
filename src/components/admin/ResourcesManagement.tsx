import { useState, useEffect, useRef, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
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
  XCircle,
  Locate,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Use the same Mapbox token as GlobalResourcesMap
mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

type JourneyStep = 'idea' | 'research' | 'mvp' | 'validation' | 'launch' | 'growth' | 'all';

const JOURNEY_STEPS: { value: JourneyStep; label: string }[] = [
  { value: 'idea', label: 'Idea Validation' },
  { value: 'research', label: 'Market Research' },
  { value: 'mvp', label: 'MVP Development' },
  { value: 'validation', label: 'User Validation' },
  { value: 'launch', label: 'Product Launch' },
  { value: 'growth', label: 'Growth & Funding' },
  { value: 'all', label: 'All Stages' },
];

interface Resource {
  id: string;
  title: string;
  description: string | null;
  resource_type: string;
  logo_url: string | null;
  website_url: string | null;
  contact_email: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  city: string | null;
  country: string | null;
  location_type: string | null;
  is_official_partner: boolean | null;
  is_flagship: boolean | null;
  is_verified: boolean | null;
  journey_steps: string[] | null;
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
  'event',
  'office',
  'other'
];

const LOCATION_TYPES = ['physical', 'online', 'hybrid'];

const ResourcesManagement = () => {
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [pendingResources, setPendingResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [journeyFilter, setJourneyFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'all' | 'pending'>('all');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editResource, setEditResource] = useState<Resource | null>(null);
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [newResource, setNewResource] = useState({
    title: '',
    description: '',
    resource_type: 'perk',
    logo_url: '',
    website_url: '',
    contact_email: '',
    address: '',
    city: '',
    country: '',
    latitude: null as number | null,
    longitude: null as number | null,
    location_type: 'physical',
    is_official_partner: false,
    is_flagship: false,
    journey_steps: [] as JourneyStep[]
  });

  // Map state
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);

  useEffect(() => {
    let isMounted = true;
    let debounceTimer: NodeJS.Timeout;
    
    const loadData = async () => {
      if (!isMounted) return;
      await fetchResources();
    };
    
    loadData();

    // Debounced fetch for realtime updates
    const debouncedFetch = () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        if (isMounted) fetchResources();
      }, 1000);
    };

    // Real-time subscription for resource submissions
    const channel = supabase
      .channel('admin-resources-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          if (payload.eventType === 'INSERT' && !(payload.new as any).is_verified) {
            toast({
              title: "New Resource Submission",
              description: `"${(payload.new as any).title}" is pending approval`
            });
          }
          debouncedFetch();
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      clearTimeout(debounceTimer);
      supabase.removeChannel(channel);
    };
  }, []);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
      projection: { name: 'globe' },
      zoom: 2,
      center: [-50, 30],
      pitch: 30,
      antialias: true,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('style.load', () => {
      if (!map.current) return;
      map.current.setFog({
        color: '#0f172a',
        'high-color': '#1e293b',
        'horizon-blend': 0.02,
        'space-color': '#020617',
        'star-intensity': 0.15
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update map markers when resources change
  useEffect(() => {
    if (!map.current) return;

    // Clear existing markers
    markers.current.forEach(m => m.remove());
    markers.current = [];

    // Add markers for all resources with coordinates
    const allResources = [...resources, ...pendingResources];
    allResources.forEach(resource => {
      if (!resource.latitude || !resource.longitude) return;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${resource.is_flagship ? '44px' : resource.is_official_partner ? '28px' : '24px'};
        height: ${resource.is_flagship ? '44px' : resource.is_official_partner ? '28px' : '24px'};
        border-radius: 50%;
        cursor: pointer;
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        ${resource.is_flagship 
          ? 'border: 3px solid gold; box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5);' 
          : resource.is_official_partner 
            ? 'border: 2px solid #fbbf24; box-shadow: 0 2px 8px rgba(0,0,0,0.3);'
            : 'border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.2);'
        }
        ${!resource.is_verified ? 'opacity: 0.6; border-color: #f97316;' : ''}
      `;

      if (resource.logo_url) {
        el.style.background = `url(${resource.logo_url}) center/cover`;
      } else {
        el.style.background = resource.is_verified ? '#3b82f6' : '#f97316';
      }

      // Add badge
      if (resource.is_flagship || resource.is_official_partner || !resource.is_verified) {
        const badge = document.createElement('span');
        badge.style.cssText = `
          position: absolute;
          top: -4px;
          right: -4px;
          font-size: 10px;
        `;
        badge.textContent = resource.is_flagship ? '👑' : resource.is_official_partner ? '⭐' : '⏳';
        el.appendChild(badge);
      }

      const marker = new mapboxgl.Marker({ element: el })
        .setLngLat([resource.longitude, resource.latitude])
        .addTo(map.current!);

      // Click to edit
      el.addEventListener('click', () => {
        setEditResource(resource);
        setShowEditDialog(true);
        map.current?.flyTo({
          center: [resource.longitude!, resource.latitude!],
          zoom: 8,
          duration: 1500
        });
      });

      markers.current.push(marker);
    });
  }, [resources, pendingResources]);

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

  // Geocode address using Mapbox
  const geocodeAddress = useCallback(async (address: string, isEdit: boolean = false) => {
    if (!address || address.length < 5) return;

    setIsGeocoding(true);
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxgl.accessToken}&types=address,place,poi&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const feature = data.features[0];
        const [lng, lat] = feature.center;
        
        // Extract city and country from context
        let city = '';
        let country = '';
        feature.context?.forEach((ctx: any) => {
          if (ctx.id.startsWith('place')) city = ctx.text;
          if (ctx.id.startsWith('country')) country = ctx.text;
        });

        if (isEdit && editResource) {
          setEditResource({
            ...editResource,
            latitude: lat,
            longitude: lng,
            city: city || editResource.city,
            country: country || editResource.country
          });
        } else {
          setNewResource(prev => ({
            ...prev,
            latitude: lat,
            longitude: lng,
            city: city || prev.city,
            country: country || prev.country
          }));
        }

        // Fly to location on map
        map.current?.flyTo({
          center: [lng, lat],
          zoom: 10,
          duration: 2000
        });

        toast({
          title: "Address geocoded",
          description: `Found: ${feature.place_name}`
        });
      } else {
        toast({
          title: "Address not found",
          description: "Please try a more specific address",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast({
        title: "Geocoding failed",
        description: "Unable to geocode address",
        variant: "destructive"
      });
    } finally {
      setIsGeocoding(false);
    }
  }, [editResource, toast]);

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

      if (error) {
        console.error('Approve error details:', error);
        throw error;
      }

      // Move from pending to verified
      setPendingResources(prev => prev.filter(r => r.id !== resource.id));
      setResources(prev => [{ ...resource, is_verified: true }, ...prev]);

      toast({
        title: "Approved",
        description: `"${resource.title}" has been approved and is now visible on the map`
      });
    } catch (error: any) {
      console.error('Error approving resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve resource",
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

      if (error) {
        console.error('Reject error details:', error);
        throw error;
      }

      setPendingResources(prev => prev.filter(r => r.id !== id));
      toast({
        title: "Rejected",
        description: `"${title}" has been rejected and removed`
      });
    } catch (error: any) {
      console.error('Error rejecting resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject resource",
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
          logo_url: editResource.logo_url,
          website_url: editResource.website_url,
          contact_email: editResource.contact_email,
          address: editResource.address,
          city: editResource.city,
          country: editResource.country,
          latitude: editResource.latitude,
          longitude: editResource.longitude,
          location_type: editResource.location_type,
          is_official_partner: editResource.is_official_partner,
          is_flagship: editResource.is_flagship,
          journey_steps: editResource.journey_steps || []
        })
        .eq('id', editResource.id);

      if (error) throw error;

      setResources(prev => prev.map(r => r.id === editResource.id ? editResource : r));
      setPendingResources(prev => prev.map(r => r.id === editResource.id ? editResource : r));
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
    if (!newResource.title?.trim()) {
      toast({
        title: "Validation Error",
        description: "Title is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('resources')
        .insert([{ 
          ...newResource, 
          is_verified: true 
        }]);

      if (error) {
        console.error('Insert error details:', error);
        throw error;
      }

      await fetchResources();
      setShowAddDialog(false);
      setNewResource({
        title: '',
        description: '',
        resource_type: 'perk',
        logo_url: '',
        website_url: '',
        contact_email: '',
        address: '',
        city: '',
        country: '',
        latitude: null,
        longitude: null,
        location_type: 'physical',
        is_official_partner: false,
        is_flagship: false,
        journey_steps: []
      });
      toast({
        title: "Added",
        description: "Resource has been added successfully"
      });
    } catch (error: any) {
      console.error('Error adding resource:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add resource. Check console for details.",
        variant: "destructive"
      });
    }
  };

  // Bulk categorize uncategorized resources based on their type
  const handleBulkCategorize = async () => {
    const uncategorizedResources = resources.filter(
      r => !r.journey_steps || r.journey_steps.length === 0
    );

    if (uncategorizedResources.length === 0) {
      toast({
        title: "All Categorized",
        description: "All resources already have journey steps assigned"
      });
      return;
    }

    const typeToJourneySteps: Record<string, JourneyStep[]> = {
      'accelerator_incubator': ['mvp', 'validation', 'launch', 'growth'],
      'coworking': ['all'],
      'lab': ['research', 'mvp'],
      'venue': ['launch', 'growth'],
      'perk': ['all'],
      'government_grant': ['idea', 'research', 'mvp'],
      'investor_network': ['growth'],
      'university': ['idea', 'research'],
      'technology_transfer': ['research', 'mvp'],
      'entrepreneur_center': ['idea', 'research', 'mvp'],
      'community': ['all'],
      'human_capital': ['all'],
      'office': ['mvp', 'validation', 'launch', 'growth'],
      'event': ['all'],
      'chamber_of_commerce': ['launch', 'growth']
    };

    try {
      let updatedCount = 0;
      for (const resource of uncategorizedResources) {
        const journeySteps = typeToJourneySteps[resource.resource_type] || ['all'];
        const { error } = await supabase
          .from('resources')
          .update({ journey_steps: journeySteps })
          .eq('id', resource.id);

        if (!error) updatedCount++;
      }

      await fetchResources();
      toast({
        title: "Bulk Categorization Complete",
        description: `Updated ${updatedCount} resources with journey steps`
      });
    } catch (error) {
      console.error('Error bulk categorizing:', error);
      toast({
        title: "Error",
        description: "Failed to bulk categorize resources",
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
    const matchesJourney = journeyFilter === 'all' || 
      (r.journey_steps && (r.journey_steps.includes(journeyFilter as JourneyStep) || r.journey_steps.includes('all')));
    return matchesSearch && matchesType && matchesJourney;
  });

  const partnerCount = resources.filter(r => r.is_official_partner).length;
  const flagshipCount = resources.filter(r => r.is_flagship).length;
  const uncategorizedCount = resources.filter(r => !r.journey_steps || r.journey_steps.length === 0).length;


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

      {/* Map Viewport */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Resource Map
            <Badge variant="outline" className="ml-2">Click markers to edit</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 relative">
          <div ref={mapContainer} className="h-[400px] rounded-b-lg" />
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/50 rounded-b-lg">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          )}
        </CardContent>
      </Card>

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
            <Select value={journeyFilter} onValueChange={setJourneyFilter}>
              <SelectTrigger className="w-[180px] tech-card border-0">
                <SelectValue placeholder="Journey Step" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Journey Steps</SelectItem>
                {JOURNEY_STEPS.map(step => (
                  <SelectItem key={step.value} value={step.value}>{step.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={() => setShowAddDialog(true)} className="tech-card border-0">
              <Plus className="h-4 w-4 mr-2" />
              Add Resource
            </Button>
            {uncategorizedCount > 0 && (
              <Button 
                variant="outline" 
                onClick={handleBulkCategorize} 
                className="tech-card border-0 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/30"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Categorize ({uncategorizedCount})
              </Button>
            )}
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
          <ScrollArea className="h-[400px]">
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
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline">{resource.resource_type?.replace(/_/g, ' ')}</Badge>
                        {resource.journey_steps && resource.journey_steps.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {resource.journey_steps.slice(0, 2).map(step => (
                              <Badge key={step} variant="secondary" className="text-xs">
                                {step}
                              </Badge>
                            ))}
                            {resource.journey_steps.length > 2 && (
                              <Badge variant="secondary" className="text-xs">+{resource.journey_steps.length - 2}</Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <span>{resource.city || resource.country ? `${resource.city || ''}, ${resource.country || ''}` : 'N/A'}</span>
                        {resource.location_type === 'physical' && (!resource.latitude || !resource.longitude) && (
                          <Badge variant="outline" className="text-orange-500 border-orange-500/50 text-xs w-fit">
                            No coordinates
                          </Badge>
                        )}
                        {resource.location_type === 'online' && (
                          <Badge variant="outline" className="text-blue-500 border-blue-500/50 text-xs w-fit">
                            Online
                          </Badge>
                        )}
                      </div>
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

      {/* Add Resource Dialog - Full Fields */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Resource</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={newResource.title}
                onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Type *</Label>
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
            <div className="md:col-span-2">
              <Label>Description</Label>
              <Textarea
                value={newResource.description}
                onChange={(e) => setNewResource({ ...newResource, description: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Logo URL</Label>
              <Input
                value={newResource.logo_url}
                onChange={(e) => setNewResource({ ...newResource, logo_url: e.target.value })}
                placeholder="https://..."
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Website URL</Label>
              <Input
                value={newResource.website_url}
                onChange={(e) => setNewResource({ ...newResource, website_url: e.target.value })}
                placeholder="https://..."
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
            <div>
              <Label>Location Type</Label>
              <Select value={newResource.location_type} onValueChange={(v) => setNewResource({ ...newResource, location_type: v })}>
                <SelectTrigger className="tech-card border-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCATION_TYPES.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label>Address</Label>
              <div className="flex gap-2">
                <Input
                  value={newResource.address}
                  onChange={(e) => setNewResource({ ...newResource, address: e.target.value })}
                  placeholder="Full address for geocoding..."
                  className="tech-card border-0 flex-1"
                />
                <Button 
                  variant="outline" 
                  onClick={() => geocodeAddress(newResource.address)}
                  disabled={isGeocoding}
                  className="tech-card border-0"
                >
                  {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>City</Label>
              <Input
                value={newResource.city}
                onChange={(e) => setNewResource({ ...newResource, city: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Country</Label>
              <Input
                value={newResource.country}
                onChange={(e) => setNewResource({ ...newResource, country: e.target.value })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Latitude</Label>
              <Input
                type="number"
                step="any"
                value={newResource.latitude || ''}
                onChange={(e) => setNewResource({ ...newResource, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                className="tech-card border-0"
              />
            </div>
            <div>
              <Label>Longitude</Label>
              <Input
                type="number"
                step="any"
                value={newResource.longitude || ''}
                onChange={(e) => setNewResource({ ...newResource, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                className="tech-card border-0"
              />
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newResource.is_official_partner}
                onCheckedChange={(v) => setNewResource({ ...newResource, is_official_partner: v })}
              />
              <Label>Official Partner ⭐</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={newResource.is_flagship}
                onCheckedChange={(v) => setNewResource({ ...newResource, is_flagship: v })}
              />
              <Label>Flagship Location 👑</Label>
            </div>
            <div className="md:col-span-2">
              <Label className="mb-2 block">Journey Steps</Label>
              <div className="flex flex-wrap gap-2">
                {JOURNEY_STEPS.map((step) => (
                  <div key={step.value} className="flex items-center space-x-2">
                    <Checkbox
                      id={`new-${step.value}`}
                      checked={newResource.journey_steps.includes(step.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewResource({ ...newResource, journey_steps: [...newResource.journey_steps, step.value] });
                        } else {
                          setNewResource({ ...newResource, journey_steps: newResource.journey_steps.filter(s => s !== step.value) });
                        }
                      }}
                    />
                    <Label htmlFor={`new-${step.value}`} className="text-sm font-normal cursor-pointer">
                      {step.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddResource} disabled={!newResource.title}>Add Resource</Button>
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
                  {selectedResource.is_official_partner && <Badge className="ml-2 bg-amber-500/20 text-amber-400">⭐ Partner</Badge>}
                  {selectedResource.is_flagship && <Badge className="ml-2 bg-yellow-500/20 text-yellow-400">👑 Flagship</Badge>}
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
                <div>
                  <p className="text-muted-foreground">Coordinates</p>
                  <p>{selectedResource.latitude?.toFixed(4)}, {selectedResource.longitude?.toFixed(4)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location Type</p>
                  <p>{selectedResource.location_type || 'physical'}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Resource Dialog - Full Fields */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="tech-card border-0 !transition-none max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Resource</DialogTitle>
          </DialogHeader>
          {editResource && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Title *</Label>
                <Input
                  value={editResource.title}
                  onChange={(e) => setEditResource({ ...editResource, title: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Type *</Label>
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
              <div className="md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={editResource.description || ''}
                  onChange={(e) => setEditResource({ ...editResource, description: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Logo URL</Label>
                <Input
                  value={editResource.logo_url || ''}
                  onChange={(e) => setEditResource({ ...editResource, logo_url: e.target.value })}
                  placeholder="https://..."
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Website URL</Label>
                <Input
                  value={editResource.website_url || ''}
                  onChange={(e) => setEditResource({ ...editResource, website_url: e.target.value })}
                  placeholder="https://..."
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
              <div>
                <Label>Location Type</Label>
                <Select value={editResource.location_type || 'physical'} onValueChange={(v) => setEditResource({ ...editResource, location_type: v })}>
                  <SelectTrigger className="tech-card border-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCATION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Label>Address</Label>
                <div className="flex gap-2">
                  <Input
                    value={editResource.address || ''}
                    onChange={(e) => setEditResource({ ...editResource, address: e.target.value })}
                    placeholder="Full address for geocoding..."
                    className="tech-card border-0 flex-1"
                  />
                  <Button 
                    variant="outline" 
                    onClick={() => geocodeAddress(editResource.address || '', true)}
                    disabled={isGeocoding}
                    className="tech-card border-0"
                  >
                    {isGeocoding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Locate className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div>
                <Label>City</Label>
                <Input
                  value={editResource.city || ''}
                  onChange={(e) => setEditResource({ ...editResource, city: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Country</Label>
                <Input
                  value={editResource.country || ''}
                  onChange={(e) => setEditResource({ ...editResource, country: e.target.value })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Latitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={editResource.latitude || ''}
                  onChange={(e) => setEditResource({ ...editResource, latitude: e.target.value ? parseFloat(e.target.value) : null })}
                  className="tech-card border-0"
                />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input
                  type="number"
                  step="any"
                  value={editResource.longitude || ''}
                  onChange={(e) => setEditResource({ ...editResource, longitude: e.target.value ? parseFloat(e.target.value) : null })}
                  className="tech-card border-0"
                />
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editResource.is_official_partner || false}
                  onCheckedChange={(v) => setEditResource({ ...editResource, is_official_partner: v })}
                />
                <Label>Official Partner ⭐</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={editResource.is_flagship || false}
                  onCheckedChange={(v) => setEditResource({ ...editResource, is_flagship: v })}
                />
                <Label>Flagship Location 👑</Label>
              </div>
              <div className="md:col-span-2">
                <Label className="mb-2 block">Journey Steps</Label>
                <div className="flex flex-wrap gap-2">
                  {JOURNEY_STEPS.map((step) => (
                    <div key={step.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={`edit-${step.value}`}
                        checked={(editResource.journey_steps || []).includes(step.value)}
                        onCheckedChange={(checked) => {
                          const currentSteps = editResource.journey_steps || [];
                          if (checked) {
                            setEditResource({ ...editResource, journey_steps: [...currentSteps, step.value] });
                          } else {
                            setEditResource({ ...editResource, journey_steps: currentSteps.filter(s => s !== step.value) });
                          }
                        }}
                      />
                      <Label htmlFor={`edit-${step.value}`} className="text-sm font-normal cursor-pointer">
                        {step.label}
                      </Label>
                    </div>
                  ))}
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
