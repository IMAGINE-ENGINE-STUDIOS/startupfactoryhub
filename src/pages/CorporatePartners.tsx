import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Building2, Handshake, Globe, Mail, Phone, Users, CheckCircle2, Rocket } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import MatrixBackground from "@/components/MatrixBackground";

const FEATURED_PARTNERS = [
  {
    name: "Lovable",
    logo: "/partners/lovable-logo.png",
    tier: "Technology Partner"
  },
  {
    name: "Decahedron Ventures",
    logo: "/partners/decahedron-ventures-logo.jpg",
    tier: "Investment Partner"
  },
  {
    name: "Flusso Capital",
    logo: "/partners/flusso-capital-logo.png",
    tier: "Investment Partner"
  },
  {
    name: "LivePlan",
    logo: "/partners/liveplan-logo.png",
    tier: "Accelerator Partner"
  },
  {
    name: "UK Venture Partners",
    logo: "/partners/uk-venture-logo.jpg",
    tier: "Investment Partner"
  },
  {
    name: "Flippa",
    logo: "/partners/flippa-logo.png",
    tier: "Marketplace Partner"
  },
  {
    name: "Ducere University",
    logo: "/partners/ducere-logo.png",
    tier: "Academic Partner"
  },
  {
    name: "HackerEarth",
    logo: "/partners/hackerearth-logo.png",
    tier: "Technology Partner"
  },
  {
    name: "Advantary Capital Partners",
    logo: "/partners/advantary-logo.jpg",
    tier: "Investment Partner"
  },
  {
    name: "Orlandopreneur",
    logo: "/partners/orlandopreneur-logo.png",
    tier: "Community Partner"
  },
  {
    name: "Grupo Incostas",
    logo: "/partners/incostas-logo.png",
    tier: "Business Partner"
  },
  {
    name: "Nouel Consult",
    logo: "/partners/nouel-logo.png",
    tier: "Legal Partner"
  },
  {
    name: "PitchPerfecter.AI",
    logo: "/partners/pitchperfecter-logo.png",
    tier: "Startup Partner"
  },
  {
    name: "LOT Network",
    logo: "/partners/lotnetwork-logo.png",
    tier: "Legal Partner"
  },
  {
    name: "F6S",
    logo: "/partners/f6s-logo.png",
    tier: "Startup Partner"
  },
  {
    name: "NASA",
    logo: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e5/NASA_logo.svg/200px-NASA_logo.svg.png",
    tier: "Technology Partner"
  },
  {
    name: "GitHub",
    logo: "/github-logo.png",
    tier: "Developer Partner"
  },
  {
    name: "Lehigh University",
    logo: "/lehigh-university-logo.png",
    tier: "Academic Partner"
  },
  {
    name: "MongoDB",
    logo: "/mongodb-logo.webp",
    tier: "Infrastructure Partner"
  },
  {
    name: "Datadog",
    logo: "https://imgix.datadoghq.com/img/dd_logo_n_70x75.png",
    tier: "Technology Partner"
  },
  {
    name: "Google",
    logo: "https://www.google.com/images/branding/googlelogo/2x/googlelogo_color_272x92dp.png",
    tier: "Cloud Partner"
  },
  {
    name: "NVIDIA Inception",
    logo: "https://www.nvidia.com/content/dam/en-zz/Solutions/about-nvidia/logo-and-brand/01-nvidia-logo-horiz-500x200-2c50-d.png",
    tier: "AI Partner"
  },
  {
    name: "Latham Pools",
    logo: "https://www.lathampool.com/wp-content/uploads/2021/10/latham-logo.svg",
    tier: "Corporate Sponsor"
  },
  {
    name: "Nasdaq Entrepreneurial Center",
    logo: "/nasdaq-logo.png",
    tier: "Entrepreneurship Partner"
  },
  {
    name: "UK Venture",
    logo: "https://ukventure.com/wp-content/uploads/2022/01/uk-venture-logo.png",
    tier: "Investment Partner"
  },
  {
    name: "IWG",
    logo: "https://www.iwgplc.com/~/media/IWG/Images/Logos/IWG-logo.svg",
    tier: "Workspace Partner"
  },
  {
    name: "HubSpot",
    logo: "https://www.hubspot.com/hubfs/HubSpot_Logos/HubSpot-Inversed-Favicon.png",
    tier: "Marketing Partner"
  },
  {
    name: "SumUp",
    logo: "https://www.sumup.com/favicon.ico",
    tier: "Payments Partner"
  },
  {
    name: "Connectd",
    logo: "https://connectd.com/wp-content/uploads/2021/01/connectd-logo.png",
    tier: "Investment Partner"
  },
  {
    name: "Regus",
    logo: "https://www.regus.com/favicon.ico",
    tier: "Workspace Partner"
  }
];

const PARTNERSHIP_TYPES = [
  { value: "technology", label: "Technology Partner" },
  { value: "academic", label: "Academic Institution" },
  { value: "corporate", label: "Corporate Sponsor" },
  { value: "investor", label: "Investment Partner" },
  { value: "media", label: "Media Partner" },
  { value: "government", label: "Government Agency" }
];

const INTEREST_AREAS = [
  "Startup Mentorship",
  "Technology Resources",
  "Funding Programs",
  "Talent Pipeline",
  "Research Collaboration",
  "Event Sponsorship",
  "Accelerator Programs",
  "Innovation Labs"
];

export default function CorporatePartners() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [failedLogos, setFailedLogos] = useState<Set<string>>(new Set());
  const [formData, setFormData] = useState({
    companyName: "",
    contactName: "",
    contactEmail: "",
    contactPhone: "",
    companyWebsite: "",
    companySize: "",
    partnershipType: "",
    interests: [] as string[],
    message: ""
  });

  const handleLogoError = (partnerName: string) => {
    setFailedLogos(prev => new Set(prev).add(partnerName));
  };

  const visiblePartners = FEATURED_PARTNERS.filter(p => !failedLogos.has(p.name));

  const handleInterestToggle = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyName || !formData.contactName || !formData.contactEmail || !formData.partnershipType) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase
        .from('corporate_partners')
        .insert({
          company_name: formData.companyName,
          contact_name: formData.contactName,
          contact_email: formData.contactEmail,
          contact_phone: formData.contactPhone || null,
          company_website: formData.companyWebsite || null,
          company_size: formData.companySize || null,
          partnership_type: formData.partnershipType,
          partnership_interests: formData.interests,
          message: formData.message || null,
          status: 'pending'
        });

      if (error) throw error;

      toast({
        title: "Application Submitted!",
        description: "Thank you for your interest. Our team will review your application and get back to you soon.",
      });

      setFormData({
        companyName: "",
        contactName: "",
        contactEmail: "",
        contactPhone: "",
        companyWebsite: "",
        companySize: "",
        partnershipType: "",
        interests: [],
        message: ""
      });

    } catch (error) {
      console.error('Error submitting partner application:', error);
      toast({
        title: "Submission Failed",
        description: "There was an error submitting your application. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* Matrix Background */}
      <div className="fixed inset-0 z-0">
        <MatrixBackground />
      </div>
      
      <div className="relative z-10">
        <Navigation />
        
        {/* Hero Section */}
        <section className="relative py-20 px-4 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="max-w-6xl mx-auto relative z-10">
            <Button 
              variant="ghost" 
              onClick={() => navigate(-1)}
              className="mb-6"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            
            <div className="text-center space-y-6">
              <Badge variant="secondary" className="text-sm px-4 py-1">
                <Handshake className="h-4 w-4 mr-2" />
                Strategic Partnerships
              </Badge>
              
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
                Corporate Partners & Collaborators
              </h1>
              
              <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
                Join our ecosystem of leading organizations supporting the next generation of innovative startups.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Partners Grid */}
        <section className="py-16 px-4 bg-background/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Our Trusted Partners</h2>
              <p className="text-muted-foreground">
                Working together to accelerate startup success worldwide
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {visiblePartners.map((partner, index) => (
                <div 
                  key={partner.name}
                  className="group relative animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  {/* Tech card with glowing border */}
                  <div className="relative p-[1px] rounded-lg bg-gradient-to-br from-primary/50 via-accent/30 to-primary/50 overflow-hidden">
                    {/* Animated border glow */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm" />
                    
                    {/* Card content */}
                    <div className="relative bg-background/95 backdrop-blur-md rounded-lg p-6 h-full">
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-3 h-3 border-l-2 border-t-2 border-primary/60" />
                      <div className="absolute top-0 right-0 w-3 h-3 border-r-2 border-t-2 border-primary/60" />
                      <div className="absolute bottom-0 left-0 w-3 h-3 border-l-2 border-b-2 border-primary/60" />
                      <div className="absolute bottom-0 right-0 w-3 h-3 border-r-2 border-b-2 border-primary/60" />
                      
                      {/* Scan line effect */}
                      <div className="absolute inset-0 overflow-hidden rounded-lg pointer-events-none">
                        <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent top-0 group-hover:animate-pulse" />
                      </div>
                      
                      {/* Logo container with hex pattern */}
                      <div className="h-16 flex items-center justify-center mb-4 relative">
                        <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_1px,_transparent_1px)] bg-[length:8px_8px]" />
                        <img
                          src={partner.logo}
                          alt={partner.name}
                          className="max-h-full max-w-full object-contain filter group-hover:brightness-125 group-hover:drop-shadow-[0_0_8px_hsl(var(--primary)/0.5)] transition-all duration-300"
                          onError={() => handleLogoError(partner.name)}
                        />
                      </div>
                      
                      {/* Partner name with tech styling */}
                      <h3 className="font-mono font-semibold text-sm text-center tracking-wide group-hover:text-primary transition-colors">
                        {partner.name}
                      </h3>
                      
                      {/* Status indicator */}
                      <div className="absolute top-3 right-3 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                        <span className="text-[8px] font-mono text-primary/70 uppercase">Active</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      {/* Benefits Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Partnership Benefits</h2>
            <p className="text-muted-foreground">
              Discover the advantages of partnering with Startup Factory Hub
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Access to Innovation</h3>
              <p className="text-sm text-muted-foreground">
                Connect with cutting-edge startups and emerging technologies in your industry
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-accent" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Talent Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                Discover and recruit top talent from our network of ambitious entrepreneurs
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Globe className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-semibold text-lg mb-2">Brand Visibility</h3>
              <p className="text-sm text-muted-foreground">
                Enhance your brand presence within the global startup ecosystem
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* Application Form */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          {/* Tech-style card wrapper */}
          <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-primary/60 via-accent/40 to-primary/60 overflow-hidden">
            {/* Animated border glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-primary opacity-30 blur-sm animate-pulse" />
            
            {/* Main card content */}
            <div className="relative bg-background/95 backdrop-blur-md rounded-xl p-8 md:p-12">
              {/* Corner accents */}
              <div className="absolute top-0 left-0 w-6 h-6 border-l-2 border-t-2 border-primary/70" />
              <div className="absolute top-0 right-0 w-6 h-6 border-r-2 border-t-2 border-primary/70" />
              <div className="absolute bottom-0 left-0 w-6 h-6 border-l-2 border-b-2 border-primary/70" />
              <div className="absolute bottom-0 right-0 w-6 h-6 border-r-2 border-b-2 border-primary/70" />
              
              {/* Scan lines effect */}
              <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent top-0" />
                <div className="absolute inset-x-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent bottom-0" />
                <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent left-0" />
                <div className="absolute inset-y-0 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent right-0" />
              </div>
              
              {/* Hex pattern background */}
              <div className="absolute inset-0 opacity-5 bg-[radial-gradient(circle_at_center,_hsl(var(--primary))_1px,_transparent_1px)] bg-[length:20px_20px] rounded-xl" />
              
              {/* Header */}
              <div className="text-center mb-10 relative">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-lg bg-primary/10 border border-primary/30 mb-4 relative">
                  <Building2 className="h-8 w-8 text-primary" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-primary animate-pulse" />
                </div>
                <h2 className="text-3xl font-bold mb-3 font-mono tracking-tight">
                  <span className="text-primary">&lt;</span>
                  Become_Partner
                  <span className="text-primary">/&gt;</span>
                </h2>
                <p className="text-muted-foreground font-mono text-sm">
                  // Initialize partnership connection
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-8 relative">
                {/* Section divider */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                  <span className="text-xs font-mono text-primary/70 uppercase tracking-wider">Company Info</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName" className="font-mono text-sm text-primary/80">Company_Name *</Label>
                    <Input
                      id="companyName"
                      value={formData.companyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder="Your organization name"
                      className="bg-background/50 border-primary/30 focus:border-primary font-mono"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactName" className="font-mono text-sm text-primary/80">Contact_Name *</Label>
                    <Input
                      id="contactName"
                      value={formData.contactName}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                      placeholder="Your full name"
                      className="bg-background/50 border-primary/30 focus:border-primary font-mono"
                      required
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail" className="font-mono text-sm text-primary/80">Email_Address *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                      <Input
                        id="contactEmail"
                        type="email"
                        value={formData.contactEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="email@company.com"
                        className="pl-10 bg-background/50 border-primary/30 focus:border-primary font-mono"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone" className="font-mono text-sm text-primary/80">Phone_Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                      <Input
                        id="contactPhone"
                        type="tel"
                        value={formData.contactPhone}
                        onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="pl-10 bg-background/50 border-primary/30 focus:border-primary font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyWebsite" className="font-mono text-sm text-primary/80">Company_Website</Label>
                    <div className="relative">
                      <Globe className="absolute left-3 top-3 h-4 w-4 text-primary/60" />
                      <Input
                        id="companyWebsite"
                        type="url"
                        value={formData.companyWebsite}
                        onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                        placeholder="https://company.com"
                        className="pl-10 bg-background/50 border-primary/30 focus:border-primary font-mono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="companySize" className="font-mono text-sm text-primary/80">Company_Size</Label>
                    <Select
                      value={formData.companySize}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}
                    >
                      <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary font-mono">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-50">1-50 employees</SelectItem>
                        <SelectItem value="51-200">51-200 employees</SelectItem>
                        <SelectItem value="201-1000">201-1,000 employees</SelectItem>
                        <SelectItem value="1001-5000">1,001-5,000 employees</SelectItem>
                        <SelectItem value="5000+">5,000+ employees</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Section divider */}
                <div className="flex items-center gap-4 pt-4">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                  <span className="text-xs font-mono text-accent/70 uppercase tracking-wider">Partnership Details</span>
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="partnershipType" className="font-mono text-sm text-primary/80">Partnership_Type *</Label>
                  <Select
                    value={formData.partnershipType}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, partnershipType: value }))}
                    required
                  >
                    <SelectTrigger className="bg-background/50 border-primary/30 focus:border-primary font-mono">
                      <SelectValue placeholder="Select partnership type" />
                    </SelectTrigger>
                    <SelectContent>
                      {PARTNERSHIP_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <Label className="font-mono text-sm text-primary/80">Areas_of_Interest</Label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {INTEREST_AREAS.map(interest => (
                      <div 
                        key={interest} 
                        className={`flex items-center space-x-2 p-3 rounded-lg border transition-all cursor-pointer ${
                          formData.interests.includes(interest) 
                            ? 'border-primary bg-primary/10' 
                            : 'border-primary/20 bg-background/30 hover:border-primary/50'
                        }`}
                        onClick={() => handleInterestToggle(interest)}
                      >
                        <Checkbox
                          id={interest}
                          checked={formData.interests.includes(interest)}
                          onCheckedChange={() => handleInterestToggle(interest)}
                          className="border-primary/50 data-[state=checked]:bg-primary"
                        />
                        <Label htmlFor={interest} className="text-xs font-mono cursor-pointer">
                          {interest}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="font-mono text-sm text-primary/80">Additional_Info</Label>
                  <Textarea
                    id="message"
                    value={formData.message}
                    onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="// Tell us about your partnership goals and how you'd like to collaborate..."
                    rows={4}
                    className="bg-background/50 border-primary/30 focus:border-primary font-mono resize-none"
                  />
                </div>

                <Button 
                  type="submit" 
                  className="w-full font-mono text-base py-6 bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 border border-primary/50 shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)] transition-all duration-300" 
                  size="lg"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      Initializing...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-5 w-5 mr-2" />
                      Execute_Partnership_Request()
                    </>
                  )}
                </Button>
                
                {/* Status indicator */}
                <div className="flex items-center justify-center gap-2 text-xs font-mono text-muted-foreground">
                  <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                  <span>System ready for new connections</span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

        <Footer />
      </div>
    </div>
  );
}
