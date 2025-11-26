import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { BookOpen, Mail, FileText, Shield, Cookie } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-ocean-dark border-t border-ocean-border py-12 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-8 sm:mb-12">
          {/* Company Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8 sm:w-10 sm:h-10 glow-effect" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Startup Factory Hub
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              The ultimate AI-powered social accelerator platform connecting startups, 
              mentors, investors, and students worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/#about" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  About
                </Link>
              </li>
              <li>
                <Link 
                  to="/#features" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Features
                </Link>
              </li>
              <li>
                <Link 
                  to="/#community" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  Community
                </Link>
              </li>
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  Guidelines
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Help Center
                </Link>
              </li>
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  Documentation
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@startupfactoryhub.com" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  Contact Support
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookie-policy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Cookie className="h-3 w-3" />
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-ocean-border pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              © 2025 Startup Factory Hub. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground text-center sm:text-right">
              Built with ❤️ for the startup community
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;