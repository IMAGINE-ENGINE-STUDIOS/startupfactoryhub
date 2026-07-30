import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ShieldAlert } from "lucide-react";
import { DeleteAccountDialog } from "@/components/DeleteAccountDialog";

/**
 * Self-service account deletion. Shown at the bottom of every profile so users
 * can remove their profile and data without contacting support.
 */
export const DangerZoneCard = ({ className = "" }: { className?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Card className={`tech-card border-0 border-l-2 border-l-destructive/60 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <ShieldAlert className="h-4 w-4" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            Delete my profile — permanently removes your account, profile and content. This cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="destructive" size="sm" onClick={() => setOpen(true)}>
            <Trash2 className="h-4 w-4 mr-2" />
            Delete my profile
          </Button>
        </CardContent>
      </Card>

      <DeleteAccountDialog open={open} onOpenChange={setOpen} />
    </>
  );
};

export default DangerZoneCard;
