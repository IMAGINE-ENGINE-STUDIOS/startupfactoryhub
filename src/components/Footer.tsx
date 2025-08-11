import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";
import { Github, Twitter, Linkedin, Mail } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-ocean-dark border-t border-ocean-border py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <img src={logo} alt="Startup Factory Hub" className="w-10 h-10 glow-effect" />
              <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Startup Factory Hub
              </span>
            </div>
            <p className="text-muted-foreground mb-6 max-w-md">
              The ultimate AI-powered social accelerator platform connecting startups, 
              mentors, investors, and students worldwide.
            </p>
            <div className="flex space-x-4">
              <Button variant="glass" size="icon">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Linkedin className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Github className="w-4 h-4" />
              </Button>
              <Button variant="glass" size="icon">
                <Mail className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-ocean-primary">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">AI Assistant</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Resources</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Community</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Events</a></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4 text-ocean-primary">Support</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Status</a></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-ocean-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-muted-foreground mb-4 md:mb-0">
              © 2024 Startup Factory Hub. All rights reserved.
            </p>
            <div className="flex space-x-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
              <a href="#" className="hover:text-foreground transition-colors">Cookie Policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;