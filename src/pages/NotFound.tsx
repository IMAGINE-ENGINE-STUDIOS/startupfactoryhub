import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { RefreshCw, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  const handleClearCache = async () => {
    setClearing(true);
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((r) => r.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      try {
        localStorage.removeItem("sfh_build_version");
        sessionStorage.removeItem("sfh_build_reload_guard");
        sessionStorage.removeItem("sfh_asset_recovery_once");
      } catch {
        // ignore
      }
    } catch (err) {
      console.error("Cache clear failed", err);
    }
    window.location.replace(location.pathname);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold mb-4 text-foreground">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-6">
          If you're seeing this for a page that should exist, your browser may have a cached old version of the site.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={handleClearCache} disabled={clearing} variant="default">
            <RefreshCw className={`mr-2 h-4 w-4 ${clearing ? "animate-spin" : ""}`} />
            {clearing ? "Clearing..." : "Clear cache & retry"}
          </Button>
          <Button asChild variant="outline">
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Return to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
