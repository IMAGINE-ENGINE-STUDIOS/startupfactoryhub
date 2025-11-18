import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import { Users, Target, Rocket, TrendingUp } from "lucide-react";

const About = () => {
  const stats = [
    { icon: Users, value: "10,000+", label: "Active Users" },
    { icon: Rocket, value: "500+", label: "Startups" },
    { icon: Target, value: "200+", label: "Mentors & Advisors" },
    { icon: TrendingUp, value: "$50M+", label: "Funding Raised" },
  ];

  return (
    <div className="min-h-screen">
      <Navigation />
      
      <section className="py-20 sm:py-32 relative overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-ocean-dark/20 to-background" />
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10">
          {/* Header */}
          <div className="text-center mb-16 animate-fade-in">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                About Startup Factory Hub
              </span>
            </h1>
            <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
              The world's first AI-powered social accelerator platform that connects 
              the entire startup ecosystem in one collaborative space.
            </p>
          </div>

          {/* Mission & Vision */}
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="glass-card p-8 rounded-xl border border-ocean-border hover-scale">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Mission</h2>
              <p className="text-muted-foreground leading-relaxed">
                To democratize access to startup resources, mentorship, and funding by creating 
                a unified platform where innovation thrives. We believe every great idea deserves 
                the support it needs to succeed.
              </p>
            </div>

            <div className="glass-card p-8 rounded-xl border border-ocean-border hover-scale">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center mb-4">
                <Rocket className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold mb-4 text-foreground">Our Vision</h2>
              <p className="text-muted-foreground leading-relaxed">
                To become the global standard for startup acceleration, fostering a community 
                where entrepreneurs, mentors, investors, and students collaborate seamlessly 
                to build the future of innovation.
              </p>
            </div>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {stats.map((stat, index) => (
              <div 
                key={index}
                className="glass-card p-6 rounded-xl border border-ocean-border text-center hover-scale"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-12 h-12 rounded-lg bg-gradient-primary/20 flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-3xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* What We Offer */}
          <div className="glass-card p-8 sm:p-12 rounded-xl border border-ocean-border">
            <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-center text-foreground">
              What Makes Us Different
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🤖 AI-Powered Matching</h3>
                <p className="text-sm text-muted-foreground">
                  Our intelligent algorithms connect you with the perfect mentors, investors, 
                  and opportunities based on your unique profile and goals.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🌐 Global Community</h3>
                <p className="text-sm text-muted-foreground">
                  Join a worldwide network of entrepreneurs, mentors, investors, and students 
                  all working together to build the next generation of startups.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">📚 Educational Resources</h3>
                <p className="text-sm text-muted-foreground">
                  Access comprehensive courses, workshops, and materials designed to accelerate 
                  your learning and growth at every stage.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">💼 Job & Internship Board</h3>
                <p className="text-sm text-muted-foreground">
                  Discover opportunities at innovative startups or find talented individuals 
                  to join your team through our integrated job platform.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">💰 Funding Opportunities</h3>
                <p className="text-sm text-muted-foreground">
                  Connect directly with investors actively looking for startups in your industry, 
                  stage, and vision.
                </p>
              </div>
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">🎯 Mentorship Programs</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized guidance from experienced mentors and advisors who have 
                  been where you are and know what it takes to succeed.
                </p>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center mt-16">
            <a 
              href="/auth"
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-primary text-white rounded-lg font-semibold hover:opacity-90 transition-opacity"
            >
              <Rocket className="h-5 w-5" />
              Join Our Community Today
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;
