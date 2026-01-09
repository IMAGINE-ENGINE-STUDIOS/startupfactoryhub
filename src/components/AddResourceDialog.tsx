import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { useCreateResource, ResourceType, LocationType, JOURNEY_STEPS, JourneyStep } from '@/hooks/useResources';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ImagePlus, Loader2, X } from 'lucide-react';

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AddResourceDialog = ({ open, onOpenChange }: AddResourceDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [resourceType, setResourceType] = useState<ResourceType>('other');
  const [locationType, setLocationType] = useState<LocationType>('physical');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isGeocoding, setIsGeocoding] = useState(false);
  const [journeySteps, setJourneySteps] = useState<JourneyStep[]>([]);
  
  // Logo upload state
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const createResource = useCreateResource();

  // Handle logo file selection
  const handleLogoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be less than 2MB');
      return;
    }

    setLogoFile(file);
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setLogoPreview(previewUrl);
  };

  // Upload logo to Supabase storage
  const uploadLogo = async (): Promise<string | null> => {
    if (!logoFile) return logoUrl;

    setIsUploadingLogo(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = logoFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('resource-assets')
        .upload(fileName, logoFile, { upsert: true });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('resource-assets')
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (error: any) {
      console.error('Logo upload error:', error);
      toast.error('Failed to upload logo: ' + error.message);
      return null;
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Remove selected logo
  const removeLogo = () => {
    setLogoFile(null);
    setLogoUrl(null);
    if (logoPreview) {
      URL.revokeObjectURL(logoPreview);
      setLogoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const geocodeAddress = async () => {
    // Skip geocoding for online-only resources
    if (!address || locationType === 'online') return { lat: null, lng: null };

    setIsGeocoding(true);
    try {
      const fullAddress = `${address}, ${city}, ${country}`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ&types=address,place,poi&limit=1`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng };
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      toast.error('Could not find location coordinates');
    } finally {
      setIsGeocoding(false);
    }
    
    return { lat: null, lng: null };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !resourceType) {
      toast.error('Please fill in all required fields');
      return;
    }

    let coordinates = { lat: null, lng: null };
    // Geocode for both physical and hybrid resources
    if ((locationType === 'physical' || locationType === 'hybrid') && address) {
      coordinates = await geocodeAddress();
    }

    // Upload logo if selected
    let uploadedLogoUrl: string | null = null;
    if (logoFile) {
      uploadedLogoUrl = await uploadLogo();
      if (!uploadedLogoUrl && logoFile) {
        // Upload failed but file was selected - don't submit without logo
        return;
      }
    }

    createResource.mutate(
      {
        title,
        description,
        resource_type: resourceType,
        location_type: locationType,
        address: locationType === 'physical' ? address : null,
        city: locationType === 'physical' ? city : null,
        country: locationType === 'physical' ? country : null,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
        website_url: websiteUrl || null,
        contact_email: contactEmail || null,
        journey_steps: journeySteps.length > 0 ? journeySteps : null,
        logo_url: uploadedLogoUrl,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          // Reset form
          setTitle('');
          setDescription('');
          setResourceType('other');
          setLocationType('physical');
          setAddress('');
          setCity('');
          setCountry('');
          setWebsiteUrl('');
          setContactEmail('');
          setJourneySteps([]);
          removeLogo();
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Submit a New Resource</DialogTitle>
          <DialogDescription>
            Add a global resource to help the startup community. Your submission will be reviewed before appearing on the map.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Resource Name *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., NASA Tech Transfer Office"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the resource..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resourceType">Resource Type *</Label>
            <Select value={resourceType} onValueChange={(value) => setResourceType(value as ResourceType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="office">Office</SelectItem>
                <SelectItem value="lab">Laboratory</SelectItem>
                <SelectItem value="venue">Venue</SelectItem>
                <SelectItem value="perk">Perk</SelectItem>
                <SelectItem value="chamber_of_commerce">Chamber of Commerce</SelectItem>
                <SelectItem value="technology_transfer">Technology Transfer</SelectItem>
                <SelectItem value="community">Community</SelectItem>
                <SelectItem value="government_grant">Government Grant</SelectItem>
                <SelectItem value="accelerator_incubator">Accelerator/Incubator</SelectItem>
                <SelectItem value="entrepreneur_center">Entrepreneur Center</SelectItem>
                <SelectItem value="university">University</SelectItem>
                <SelectItem value="coworking">Coworking Space</SelectItem>
                <SelectItem value="investor_network">Investor Network</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Logo Upload Section */}
          <div className="space-y-2">
            <Label>Logo / Icon (for map marker)</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              {logoPreview ? (
                <div className="relative">
                  <img 
                    src={logoPreview} 
                    alt="Logo preview" 
                    className="w-20 h-20 rounded-xl object-cover border-2 border-border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={removeLogo}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <div 
                  className="w-20 h-20 rounded-xl border-2 border-dashed border-muted-foreground/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors bg-muted/20"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {isUploadingLogo ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <ImagePlus className="h-6 w-6 text-muted-foreground" />
                  )}
                </div>
              )}
              
              <div className="flex-1 space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoSelect}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploadingLogo}
                >
                  {logoPreview ? 'Change Logo' : 'Upload Logo'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Recommended: Square image, max 2MB. This will appear as your marker on the map.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Location Type *</Label>
            <RadioGroup value={locationType} onValueChange={(value) => setLocationType(value as LocationType)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="physical" id="physical" />
                <Label htmlFor="physical" className="font-normal">Physical Location</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="online" id="online" />
                <Label htmlFor="online" className="font-normal">Online Only</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="hybrid" id="hybrid" />
                <Label htmlFor="hybrid" className="font-normal">Hybrid (Physical + Online)</Label>
              </div>
            </RadioGroup>
          </div>

          {(locationType === 'physical' || locationType === 'hybrid') && (
            <>
              <div className="space-y-2">
                <Label htmlFor="address">Street Address</Label>
                <Input
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123 Main Street"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    placeholder="United States"
                  />
                </div>
              </div>
            </>
          )}

          <div className="space-y-2">
            <Label htmlFor="website">Website URL</Label>
            <Input
              id="website"
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://example.com"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Contact Email</Label>
            <Input
              id="email"
              type="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="contact@example.com"
            />
          </div>

          <div className="space-y-2">
            <Label>Journey Steps (when is this resource most useful?)</Label>
            <div className="flex flex-wrap gap-3">
              {JOURNEY_STEPS.map((step) => (
                <div key={step.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={`add-${step.value}`}
                    checked={journeySteps.includes(step.value)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setJourneySteps([...journeySteps, step.value]);
                      } else {
                        setJourneySteps(journeySteps.filter(s => s !== step.value));
                      }
                    }}
                  />
                  <Label htmlFor={`add-${step.value}`} className="text-sm font-normal cursor-pointer">
                    {step.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={createResource.isPending || isGeocoding || isUploadingLogo}>
              {isUploadingLogo ? 'Uploading Logo...' : (createResource.isPending || isGeocoding) ? 'Submitting...' : 'Submit Resource'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
