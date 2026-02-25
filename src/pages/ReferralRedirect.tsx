import { useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export default function ReferralRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    const trackAndRedirect = async () => {
      if (!code) {
        navigate("/auth");
        return;
      }

      try {
        await supabase.functions.invoke("track-referral-click", {
          body: { referral_code: code },
        });
      } catch (err) {
        console.error("Failed to track referral click:", err);
      }

      navigate(`/auth?ref=${code}`);
    };

    trackAndRedirect();
  }, [code, navigate]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );
}
