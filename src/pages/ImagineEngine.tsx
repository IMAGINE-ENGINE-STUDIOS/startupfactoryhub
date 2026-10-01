import { useEffect } from "react";

export default function ImagineEngine() {
  useEffect(() => {
    document.title = "Imagine Engine | Startup Factory Hub";
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-background">
      <iframe
        src="/imagine-engine/app.html"
        title="Imagine Engine"
        className="w-full h-full border-0"
      />
    </div>
  );
}
