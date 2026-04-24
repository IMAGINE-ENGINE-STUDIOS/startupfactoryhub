import { MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface LocationPermissionPromptProps {
  message?: string | null;
  onRequest: () => Promise<unknown> | void;
  blocked?: boolean;
  onContinueWithoutLocation?: () => void;
}

/**
 * Full-screen prompt shown when the browser denies/blocks location.
 * Asks the user to enable location and provides per-OS guidance.
 */
export const LocationPermissionPrompt = ({
  message,
  onRequest,
  blocked = false,
  onContinueWithoutLocation,
}: LocationPermissionPromptProps) => {
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    setBusy(true);
    try {
      await onRequest();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="absolute inset-0 z-40 bg-black/85 backdrop-blur flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-white/5 border border-white/10 rounded-2xl p-5 text-center space-y-4">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-base font-semibold text-white">
            Activate location to enter Galaxy
          </h2>
          <p className="text-xs text-white/70 leading-relaxed">
            {message ||
              "Galaxy needs your precise GPS to lock the LiDAR wireframe to your room and place AR content with pixel-by-pixel accuracy."}
          </p>
          {blocked && (
            <p className="text-[11px] text-amber-300/90 leading-relaxed">
              Browser permission is currently blocked, so tapping the button again will not reopen the prompt until you allow location for this site.
            </p>
          )}
        </div>

        <div className="text-left text-[11px] text-white/60 space-y-1 bg-black/30 border border-white/10 rounded-lg p-3">
          <div className="text-white/80 text-xs font-semibold mb-1">
            How to enable
          </div>
          <div>
            <span className="text-white/80">iOS:</span> Settings → Privacy →
            Location Services → Safari → While Using
          </div>
          <div>
            <span className="text-white/80">Android:</span> Site settings →
            Permissions → Location → Allow
          </div>
          <div>
            <span className="text-white/80">Desktop:</span> Click the lock icon
            in the address bar → Location → Allow
          </div>
        </div>

        <Button
          size="lg"
          className="w-full"
          onClick={() => void handleClick()}
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <MapPin className="w-4 h-4 mr-2" />
              Activate location
            </>
          )}
        </Button>

        {blocked && onContinueWithoutLocation && (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
            onClick={onContinueWithoutLocation}
          >
            Continue without location
          </Button>
        )}
      </div>
    </div>
  );
};
