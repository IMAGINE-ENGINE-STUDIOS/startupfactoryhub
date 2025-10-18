import logo from "@/assets/logo.png";

const Footer = () => {
  return (
    <footer className="bg-ocean-dark border-t border-ocean-border py-12 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8 sm:mb-12">
          <div className="col-span-1 sm:col-span-2">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8 sm:w-10 sm:h-10 glow-effect" />
              <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Startup Factory Hub
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6 max-w-md">
              The ultimate AI-powered social accelerator platform connecting startups, 
              mentors, investors, and students worldwide.
            </p>
          </div>
        </div>
        
        <div className="border-t border-ocean-border pt-6 sm:pt-8">
          <p className="text-xs sm:text-sm text-muted-foreground text-center">
            © 2024 Startup Factory Hub. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;