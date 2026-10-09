import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, ArrowLeft } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DistrictRooms from '@/components/DistrictRooms';

/** Admin-only workspace for districts while they are hidden from members. */
export default function DistrictsLab() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return setOk(false);
      const { data } = await supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' });
      setOk(!!data);
    })();
  }, []);
  if (ok === null) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-5 h-5 animate-spin" /></div>;
  if (!ok) return <div className="min-h-screen flex items-center justify-center text-muted-foreground">Admins only.</div>;
  return (
    <div className="min-h-screen bg-background px-4 sm:px-8 py-6 space-y-4">
      <div className="flex items-center gap-3">
        <Link to="/dashboard" className="text-muted-foreground hover:text-foreground"><ArrowLeft className="w-5 h-5" /></Link>
        <h1 className="text-xl font-semibold">Districts Lab</h1>
        <span className="text-xs text-muted-foreground">Hidden from members while in development</span>
      </div>
      <DistrictRooms />
    </div>
  );
}
