import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Partner {
  id: string;
  name: string;
  logo_url: string;
  website: string | null;
  tier: string | null;
}

export default function PartnersCarousel() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    if (partners.length > 0) {
      const timer = setInterval(() => {
        setCurrentIndex((prevIndex) => 
          prevIndex + 3 >= partners.length ? 0 : prevIndex + 3
        );
      }, 4000);
      return () => clearInterval(timer);
    }
  }, [partners.length]);

  const fetchPartners = async () => {
    // Use companies table as partners since partners table doesn't exist
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .limit(8);
    
    if (error) {
      console.error('Error fetching partners:', error);
      return;
    }
    
    const formattedPartners = (data || []).map(company => ({
      id: company.id,
      name: company.name,
      logo_url: company.logo_url || '/placeholder.svg',
      website: company.website,
      tier: 'gold'
    }));
    
    setPartners(formattedPartners);
  };

  if (partners.length === 0) {
    return null;
  }

  const visiblePartners = partners.slice(currentIndex, currentIndex + 3);
  if (visiblePartners.length < 3 && partners.length > 3) {
    visiblePartners.push(...partners.slice(0, 3 - visiblePartners.length));
  }

  return (
    <section className="py-20 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Trusted Partners
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Collaborating with industry leaders to accelerate startup success
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visiblePartners.map((partner, index) => (
            <Card 
              key={`${partner.id}-${currentIndex}`}
              className="tech-card p-6 text-center group cursor-pointer floating"
              style={{ animationDelay: `${index * 0.2}s` }}
              onClick={() => partner.website && window.open(partner.website, '_blank')}
            >
              <div className="scan-effect mb-4">
                <img
                  src={partner.logo_url}
                  alt={partner.name}
                  className="h-16 w-auto mx-auto object-contain group-hover:scale-110 transition-transform duration-300"
                />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{partner.name}</h3>
              {partner.tier && (
                <Badge variant="secondary" className="text-xs">
                  {partner.tier}
                </Badge>
              )}
            </Card>
          ))}
        </div>
        
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.ceil(partners.length / 3) }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                Math.floor(currentIndex / 3) === index 
                  ? 'bg-primary w-6' 
                  : 'bg-muted-foreground/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}