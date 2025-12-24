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

const FEATURED_PARTNERS = [
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
    name: "Pitch Perfecter",
    logo: "https://uploads-ssl.webflow.com/6388a088c5eb4d4c50dd4f9a/6388a088c5eb4d1a71dd4fce_pp-logo-dark.svg",
    tier: "Startup Partner"
  },
  {
    name: "F6S",
    logo: "https://www.f6s.com/content-resource/images/logos/f6s-logo-blue.svg",
    tier: "Startup Partner"
  },
  {
    name: "Arias Incostas Nouel",
    logo: "https://www.ariaslaw.com/wp-content/uploads/2020/01/logo-arias.png",
    tier: "Legal Partner"
  },
  {
    name: "Nasdaq Entrepreneurial Center",
    logo: "/nasdaq-logo.png",
    tier: "Entrepreneurship Partner"
  },
  {
    name: "Orlandopreneur",
    logo: "https://images.squarespace-cdn.com/content/v1/5f4e0c7e7f74731dd56c21e0/1599015149012-7LQNKN8IHKC0JRCYWXLZ/Orlandopreneur+Logo.png",
    tier: "Community Partner"
  },
  {
    name: "UK Venture",
    logo: "https://ukventure.com/wp-content/uploads/2022/01/uk-venture-logo.png",
    tier: "Investment Partner"
  },
  {
    name: "Advantary Capital Partners",
    logo: "https://advantary.com/wp-content/uploads/2021/06/advantary-logo.png",
    tier: "Investment Partner"
  },
  {
    name: "Hacked Earth",
    logo: "https://hackedearth.com/wp-content/uploads/2021/01/hacked-earth-logo.png",
    tier: "Technology Partner"
  },
  {
    name: "Duquesne University",
    logo: "https://www.duq.edu/assets/images/duquesne-university-logo.svg",
    tier: "Academic Partner"
  },
  {
    name: "IWG",
    logo: "https://www.iwgplc.com/~/media/IWG/Images/Logos/IWG-logo.svg",
    tier: "Workspace Partner"
  },
  {
    name: "LOT Network",
    logo: "https://lotnet.com/wp-content/uploads/2020/01/LOT-Network-Logo.png",
    tier: "Legal Partner"
  },
  {
    name: "Flippa",
    logo: "https://flippa.com/images/flippa-logo.svg",
    tier: "Marketplace Partner"
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
    <div className="min-h-screen bg-background">
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Trusted Partners</h2>
            <p className="text-muted-foreground">
              Working together to accelerate startup success worldwide
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {FEATURED_PARTNERS.map((partner, index) => (
              <Card 
                key={partner.name}
                className="p-6 text-center group hover:shadow-lg transition-all duration-300 hover:scale-105"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="h-16 flex items-center justify-center mb-4">
                  <img
                    src={partner.logo}
                    alt={partner.name}
                    className="max-h-full max-w-full object-contain filter group-hover:brightness-110 transition-all"
                  />
                </div>
                <h3 className="font-semibold text-sm mb-2">{partner.name}</h3>
                <Badge variant="outline" className="text-xs">
                  {partner.tier}
                </Badge>
              </Card>
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
      <section className="py-16 px-4 bg-muted/30">
        <div className="max-w-3xl mx-auto">
          <Card className="p-8">
            <div className="text-center mb-8">
              <Building2 className="h-12 w-12 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Become a Partner</h2>
              <p className="text-muted-foreground">
                Fill out the form below and our team will be in touch
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyName">Company Name *</Label>
                  <Input
                    id="companyName"
                    value={formData.companyName}
                    onChange={(e) => setFormData(prev => ({ ...prev, companyName: e.target.value }))}
                    placeholder="Your organization name"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactName: e.target.value }))}
                    placeholder="Your full name"
                    required
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contactEmail">Email Address *</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactEmail"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactEmail: e.target.value }))}
                      placeholder="email@company.com"
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contactPhone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="contactPhone"
                      type="tel"
                      value={formData.contactPhone}
                      onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                      placeholder="+1 (555) 000-0000"
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite">Company Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="companyWebsite"
                      type="url"
                      value={formData.companyWebsite}
                      onChange={(e) => setFormData(prev => ({ ...prev, companyWebsite: e.target.value }))}
                      placeholder="https://company.com"
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="companySize">Company Size</Label>
                  <Select
                    value={formData.companySize}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, companySize: value }))}
                  >
                    <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="partnershipType">Partnership Type *</Label>
                <Select
                  value={formData.partnershipType}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, partnershipType: value }))}
                  required
                >
                  <SelectTrigger>
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

              <div className="space-y-3">
                <Label>Areas of Interest</Label>
                <div className="grid grid-cols-2 gap-3">
                  {INTEREST_AREAS.map(interest => (
                    <div key={interest} className="flex items-center space-x-2">
                      <Checkbox
                        id={interest}
                        checked={formData.interests.includes(interest)}
                        onCheckedChange={() => handleInterestToggle(interest)}
                      />
                      <Label htmlFor={interest} className="text-sm cursor-pointer">
                        {interest}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Additional Information</Label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Tell us about your partnership goals and how you'd like to collaborate..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-5 w-5 mr-2" />
                    Submit Partnership Application
                  </>
                )}
              </Button>
            </form>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
}
