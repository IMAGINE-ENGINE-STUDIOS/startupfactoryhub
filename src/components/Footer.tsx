import logo from "@/assets/logo.png";
import { Link } from "react-router-dom";
import { BookOpen, Mail, FileText, Shield, Cookie, Rocket, Handshake } from "lucide-react";
import { LanguageSelector } from "@/components/LanguageSelector";
import { useLanguage } from "@/contexts/LanguageContext";

const Footer = () => {
  const { t } = useLanguage();
  
  return (
    <footer className="bg-ocean-dark border-t border-ocean-border py-12 sm:py-16 overflow-hidden">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-8 mb-8 sm:mb-12">
          {/* Company Section */}
          <div className="col-span-1 sm:col-span-2 lg:col-span-4">
            <div className="flex items-center space-x-3 mb-4 sm:mb-6">
              <img src={logo} alt="Startup Factory Hub" className="w-8 h-8 sm:w-10 sm:h-10 glow-effect" />
              <span className="text-sm sm:text-base font-bold bg-gradient-primary bg-clip-text text-transparent tracking-wide">
                STARTUP FACTORY HUB
              </span>
            </div>
            <p className="text-sm sm:text-base text-muted-foreground max-w-md">
              The ultimate AI-powered social accelerator platform connecting startups, 
              mentors, investors, and students worldwide.
            </p>
          </div>

          {/* Quick Links */}
          <div className="col-span-1 lg:col-span-2">
            <h3 className="font-semibold text-foreground mb-4">{t('footer.quickLinks')}</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/#about" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.about')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/#features" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.features')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/blog" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {t('nav.blog')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  {t('nav.guidelines')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/sponsorship" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Rocket className="h-3 w-3" />
                  {t('nav.sponsorship')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/partners" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Handshake className="h-3 w-3" />
                  Partners
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-4">{t('footer.resources')}</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  {t('footer.helpCenter')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/guidelines" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <BookOpen className="h-3 w-3" />
                  {t('footer.documentation')}
                </Link>
              </li>
              <li>
                <a 
                  href="mailto:support@startupfactoryhub.com" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Mail className="h-3 w-3" />
                  {t('footer.contactSupport')}
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div className="col-span-1 lg:col-span-3">
            <h3 className="font-semibold text-foreground mb-4">{t('footer.legal')}</h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/privacy-policy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Shield className="h-3 w-3" />
                  {t('footer.privacyPolicy')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/terms-of-service" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <FileText className="h-3 w-3" />
                  {t('footer.termsOfService')}
                </Link>
              </li>
              <li>
                <Link 
                  to="/cookie-policy" 
                  className="text-sm text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-2"
                >
                  <Cookie className="h-3 w-3" />
                  {t('footer.cookiePolicy')}
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-ocean-border pt-6 sm:pt-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs sm:text-sm text-muted-foreground text-center sm:text-left">
              {t('footer.copyright')}
            </p>
            <div className="flex items-center gap-4">
              <LanguageSelector variant="full" />
              <p className="text-xs text-muted-foreground text-center sm:text-right">
                {t('footer.builtWith')}
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;