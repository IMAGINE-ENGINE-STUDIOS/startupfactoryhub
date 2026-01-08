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
import { Upload, X, Loader2, Image as ImageIcon } from 'lucide-react';

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
  
  // File upload states
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const logoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const createResource = useCreateResource();

  const isPhysicalOrHybrid = locationType === 'physical' || locationType === 'hybrid';

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setLogoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setBannerFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setBannerPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${folder}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('resource-assets')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    const { data: urlData } = supabase.storage
      .from('resource-assets')
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  };

  const geocodeAddress = async () => {
    const searchQuery = address || city || country;
    if (!searchQuery || locationType === 'online') return { lat: null, lng: null };

    setIsGeocoding(true);
    try {
      const fullAddress = address ? `${address}, ${city}, ${country}` : `${city}, ${country}`;
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(fullAddress)}.json?access_token=pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ`
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

    // Validate city is required for physical/hybrid
    if (isPhysicalOrHybrid && !city.trim()) {
      toast.error('City is required for physical or hybrid resources');
      return;
    }

    setIsUploading(true);
    
    try {
      // Upload files if provided
      let logoUrl: string | null = null;
      let bannerUrl: string | null = null;
      
      if (logoFile) {
        logoUrl = await uploadFile(logoFile, 'logos');
        if (!logoUrl) {
          toast.error('Failed to upload logo');
          setIsUploading(false);
          return;
        }
      }
      
      if (bannerFile) {
        bannerUrl = await uploadFile(bannerFile, 'banners');
        if (!bannerUrl) {
          toast.error('Failed to upload banner');
          setIsUploading(false);
          return;
        }
      }

      // Geocode address
      let coordinates = { lat: null, lng: null };
      if (isPhysicalOrHybrid && (address || city)) {
        coordinates = await geocodeAddress();
      }

      createResource.mutate(
        {
          title,
          description,
          resource_type: resourceType,
          location_type: locationType,
          address: isPhysicalOrHybrid ? address : null,
          city: isPhysicalOrHybrid ? city : null,
          country: isPhysicalOrHybrid ? country : null,
          latitude: coordinates.lat,
          longitude: coordinates.lng,
          website_url: websiteUrl || null,
          contact_email: contactEmail || null,
          journey_steps: journeySteps.length > 0 ? journeySteps : null,
          logo_url: logoUrl,
          banner_url: bannerUrl,
        },
        {
          onSuccess: () => {
            onOpenChange(false);
            resetForm();
          },
        }
      );
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to submit resource');
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
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
    setLogoFile(null);
    setBannerFile(null);
    setLogoPreview(null);
    setBannerPreview(null);
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

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Logo (for map pin)</Label>
            <div className="flex items-center gap-4">
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
              {logoPreview ? (
                <div className="relative">
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                  <Button
                    type="button"
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => {
                      setLogoFile(null);
                      setLogoPreview(null);
                    }}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => logoInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Upload Logo
                </Button>
              )}
              <span className="text-xs text-muted-foreground">
                Recommended: Square image, 200x200px minimum
              </span>
            </div>
          </div>

          {/* Banner Upload */}
          <div className="space-y-2">
            <Label>Banner (for detail card)</Label>
            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              onChange={handleBannerChange}
              className="hidden"
            />
            {bannerPreview ? (
              <div className="relative">
                <img
                  src={bannerPreview}
                  alt="Banner preview"
                  className="w-full h-32 rounded-lg object-cover border-2 border-primary"
                />
                <Button
                  type="button"
                  size="icon"
                  variant="destructive"
                  className="absolute top-2 right-2 h-6 w-6 rounded-full"
                  onClick={() => {
                    setBannerFile(null);
                    setBannerPreview(null);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                onClick={() => bannerInputRef.current?.click()}
                className="w-full h-24 flex flex-col items-center justify-center gap-2 border-dashed"
              >
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Upload Banner (1200x400px recommended)</span>
              </Button>
            )}
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

          {isPhysicalOrHybrid && (
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
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    required={isPhysicalOrHybrid}
                    className={isPhysicalOrHybrid && !city.trim() ? 'border-destructive' : ''}
                  />
                  {isPhysicalOrHybrid && !city.trim() && (
                    <p className="text-xs text-destructive">City is required for physical resources</p>
                  )}
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
            <Button 
              type="submit" 
              disabled={createResource.isPending || isGeocoding || isUploading || (isPhysicalOrHybrid && !city.trim())}
            >
              {(createResource.isPending || isGeocoding || isUploading) ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Resource'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};